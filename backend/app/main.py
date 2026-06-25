from collections import Counter
from pathlib import Path
from unicodedata import combining, normalize

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .config import get_settings
from .database import Base, engine, get_db
from .models import Annotation, ClinicalMetadata, Expert, LeafImage
from .schemas import (
    AnnotationCreate,
    AnnotationResponse,
    DatasetRecordResponse,
    DatasetMetricsResponse,
    ExpertEnsure,
    ExpertResponse,
    ImageResponse,
    JsonlRecord,
    PendingImageResponse,
    PreprocessResponse,
)
from .services.image_processing import preprocess_image, save_upload
from .services.storage import create_signed_url, download_from_supabase, upload_to_supabase

app = FastAPI(title="AgroCafeLLM API", version="0.1.0")
settings = get_settings()
MIN_ANNOTATIONS_FOR_CONSENSUS = 4
CONSENSUS_VALIDATION_THRESHOLD = 0.75

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "storage": "enabled" if settings.storage_enabled else "local",
    }


DEFAULT_EXPERT_ROLE = "Analista agronómico"


def normalize_identity(value: str | None) -> str:
    normalized = normalize("NFKD", value or "")
    without_accents = "".join(char for char in normalized if not combining(char))
    return " ".join(without_accents.casefold().split())


def compact_identity_values(*values: str | None) -> list[str]:
    seen: set[str] = set()
    compacted: list[str] = []
    for value in values:
        trimmed = (value or "").strip()
        normalized = normalize_identity(trimmed)
        if trimmed and normalized not in seen:
            seen.add(normalized)
            compacted.append(trimmed)
    return compacted


def expert_identity_set(expert: Expert) -> set[str]:
    """Todas las identidades por las que se reconoce a un experto: nombre + alias."""
    values = [expert.name, *(expert.aliases or [])]
    return {normalize_identity(value) for value in values if normalize_identity(value)}


def union_identity_values(existing: list[str] | None, new_values: list[str]) -> list[str]:
    """Suma identidades nuevas a las existentes sin duplicar (comparando normalizado)."""
    result = list(existing or [])
    seen = {normalize_identity(value) for value in result if normalize_identity(value)}
    for value in new_values:
        normalized = normalize_identity(value)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(value)
    return result


def find_expert_records(names: list[str], role: str | None, db: Session) -> list[Expert]:
    identities = {normalize_identity(name) for name in names if normalize_identity(name)}
    if not identities:
        return []

    normalized_role = normalize_identity(role)
    experts = db.scalars(select(Expert)).all()
    matches = [expert for expert in experts if expert_identity_set(expert) & identities]
    matches_with_role = [expert for expert in matches if normalize_identity(expert.role) == normalized_role]
    matches_with_other_role = [expert for expert in matches if expert.id not in {item.id for item in matches_with_role}]
    return matches_with_role + matches_with_other_role


def find_expert_record(name: str | None, role: str | None, db: Session) -> Expert | None:
    matches = find_expert_records([name] if name else [], role, db)
    if not matches:
        return None
    return matches[0]


@app.post("/experts", response_model=dict[str, str])
def create_expert(name: str, role: str = DEFAULT_EXPERT_ROLE, db: Session = Depends(get_db)) -> dict[str, str]:
    expert = Expert(name=name, role=role)
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return {"id": expert.id, "name": expert.name, "role": expert.role}


@app.post("/experts/ensure", response_model=ExpertResponse)
def ensure_expert(payload: ExpertEnsure, db: Session = Depends(get_db)) -> Expert:
    return ensure_expert_record(payload.name, payload.role, db, payload.aliases)


def ensure_expert_record(name: str, role: str, db: Session, aliases: list[str] | None = None) -> Expert:
    names = compact_identity_values(name, *(aliases or []))
    experts = find_expert_records(names, role, db)
    if experts:
        expert = experts[0]
        # Acumular las identidades nuevas (p. ej. el id de Kinde) para que el
        # experto se reconozca aunque cambie el metodo de login en el futuro.
        merged_aliases = union_identity_values(expert.aliases, names)
        if merged_aliases != list(expert.aliases or []):
            expert.aliases = merged_aliases
            db.commit()
            db.refresh(expert)
        return expert

    expert = Expert(name=name, role=role, aliases=names)
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return expert


@app.post("/images", response_model=ImageResponse)
async def upload_image(
    specimen_code: str = Form(...),
    region: str | None = Form(default=None),
    farm: str | None = Form(default=None),
    variety: str | None = Form(default=None),
    symptoms: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> LeafImage:
    specimen_code = specimen_code.strip()
    if not specimen_code:
        raise HTTPException(status_code=422, detail="Specimen code is required")

    existing_image = db.scalar(select(LeafImage).where(LeafImage.specimen_code == specimen_code))
    if existing_image is not None:
        raise HTTPException(status_code=409, detail="Specimen code already exists")

    original_path, metadata = await save_upload(file, settings.upload_dir)
    object_key = f"raw/{specimen_code}/{original_path.name}"
    stored_path = upload_to_supabase(
        settings=settings,
        file_path=original_path,
        object_key=object_key,
        content_type=file.content_type or "application/octet-stream",
    )
    image = LeafImage(
        specimen_code=specimen_code,
        original_path=stored_path,
        width=metadata["width"],
        height=metadata["height"],
        color_mode=metadata["color_mode"],
        image_format=metadata["image_format"],
        status="uploaded",
    )
    db.add(image)
    db.flush()

    metadata_symptoms = [item.strip() for item in (symptoms or "").split(",") if item.strip()]
    if region or farm or variety or metadata_symptoms:
        db.add(
            ClinicalMetadata(
                image_id=image.id,
                region=region.strip() if region else None,
                farm=farm.strip() if farm else None,
                variety=variety.strip() if variety else None,
                symptoms=metadata_symptoms,
            )
        )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Specimen code already exists") from exc
    db.refresh(image)
    return image


def evaluate_consensus(annotations: list[Annotation]) -> tuple[int, float, bool, str | None]:
    """Single source of truth for consensus. Returns (count, consensus, validated, final_diagnosis)."""
    count = len(annotations)
    diagnosis_counts = Counter(annotation.deficiency for annotation in annotations)
    top_items = diagnosis_counts.most_common()
    top_count = top_items[0][1] if top_items else 0
    has_tie = len(top_items) > 1 and top_items[1][1] == top_count
    consensus = (top_count / count) if count >= 2 else 0
    expert_validated = count >= MIN_ANNOTATIONS_FOR_CONSENSUS and not has_tie and consensus >= CONSENSUS_VALIDATION_THRESHOLD
    final_diagnosis = top_items[0][0] if expert_validated else None
    return count, consensus, expert_validated, final_diagnosis


def safe_preview_url(image_path: str) -> str | None:
    """Sign a preview URL without letting a single bad Storage object break a whole listing."""
    try:
        return create_signed_url(settings, image_path)
    except HTTPException:
        return None


def dataset_record_from_image(image: LeafImage) -> DatasetRecordResponse:
    clinical_metadata = image.clinical_metadata
    annotation_count, consensus, expert_validated, final_diagnosis = evaluate_consensus(image.annotations)
    image_path = image.processed_path or image.original_path

    return DatasetRecordResponse(
        image_id=image.id,
        specimen_code=image.specimen_code,
        original_path=image.original_path,
        processed_path=image.processed_path,
        preview_url=safe_preview_url(image_path),
        status=image.status,
        annotations=annotation_count,
        consensus=consensus,
        expert_validated=expert_validated,
        final_diagnosis=final_diagnosis,
        region=clinical_metadata.region if clinical_metadata else None,
        farm=clinical_metadata.farm if clinical_metadata else None,
        variety=clinical_metadata.variety if clinical_metadata else None,
        metadata_symptoms=clinical_metadata.symptoms if clinical_metadata else [],
        width=image.width,
        height=image.height,
        color_mode=image.color_mode,
        image_format=image.image_format,
    )


@app.get("/images/pending", response_model=PendingImageResponse | None)
def get_pending_image(
    expert_name: str | None = None,
    expert_alias: list[str] = Query(default=[]),
    exclude_image_id: list[str] = Query(default=[]),
    role: str = DEFAULT_EXPERT_ROLE,
    db: Session = Depends(get_db),
) -> PendingImageResponse | None:
    expert_names = compact_identity_values(expert_name, *expert_alias)
    experts = find_expert_records(expert_names, role, db)
    expert_ids = {expert.id for expert in experts}
    excluded_image_ids = {image_id for image_id in exclude_image_id if image_id}
    images = db.scalars(
        select(LeafImage)
        .options(selectinload(LeafImage.annotations), selectinload(LeafImage.clinical_metadata))
        .order_by(LeafImage.created_at.asc())
    ).all()
    for item in images:
        if item.id in excluded_image_ids:
            continue
        if len(item.annotations) >= MIN_ANNOTATIONS_FOR_CONSENSUS:
            continue
        if expert_names and any(annotation.expert_id in expert_ids for annotation in item.annotations):
            continue

        record = dataset_record_from_image(item)
        if record.preview_url is None:
            # Sin preview disponible (objeto faltante en Storage): saltar para no bloquear la cola.
            continue
        return PendingImageResponse(**record.model_dump())

    return None


@app.get("/images/{image_id}/signed-url", response_model=dict[str, str])
def get_image_signed_url(image_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    image = db.get(LeafImage, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = image.processed_path or image.original_path
    return {"url": create_signed_url(settings, image_path)}


@app.post("/images/{image_id}/preprocess", response_model=PreprocessResponse)
def preprocess_leaf_image(image_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    image = db.get(LeafImage, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    source_path = image.original_path
    if source_path.startswith("storage://"):
        source_path = str(download_from_supabase(settings, source_path, settings.upload_dir))

    result = preprocess_image(source_path, settings.processed_dir)
    processed_local_path = Path(str(result["processed_path"]))
    processed_object_key = f"processed/{image.specimen_code}/{processed_local_path.name}"
    image.processed_path = upload_to_supabase(
        settings=settings,
        file_path=processed_local_path,
        object_key=processed_object_key,
        content_type="image/jpeg",
    )
    image.width = int(result["width"])
    image.height = int(result["height"])
    image.color_mode = str(result["color_mode"])
    image.image_format = str(result["image_format"])
    image.status = "preprocessed"
    db.commit()

    return {
        "image_id": image.id,
        "processed_path": image.processed_path,
        "width": image.width,
        "height": image.height,
        "color_mode": image.color_mode,
        "image_format": image.image_format,
        "tensor_shape": result["tensor_shape"],
        "status": image.status,
    }


@app.post("/annotations", response_model=AnnotationResponse)
def create_annotation(payload: AnnotationCreate, db: Session = Depends(get_db)) -> Annotation:
    if db.get(LeafImage, payload.image_id) is None:
        raise HTTPException(status_code=404, detail="Image not found")
    if db.get(Expert, payload.expert_id) is None:
        raise HTTPException(status_code=404, detail="Expert not found")
    existing_annotation = db.scalar(
        select(Annotation).where(Annotation.image_id == payload.image_id, Annotation.expert_id == payload.expert_id)
    )
    if existing_annotation is not None:
        raise HTTPException(status_code=409, detail="Expert already annotated this image")

    annotation_data = payload.model_dump(exclude={"consensus", "expert_validated"})
    annotation = Annotation(**annotation_data, consensus=0, expert_validated=False)
    db.add(annotation)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Expert already annotated this image") from exc
    db.refresh(annotation)

    image_annotations = db.scalars(select(Annotation).where(Annotation.image_id == payload.image_id)).all()
    _, consensus, expert_validated, _ = evaluate_consensus(image_annotations)

    for item in image_annotations:
        item.consensus = consensus
        item.expert_validated = expert_validated
    db.commit()
    db.refresh(annotation)
    return annotation


@app.get("/dataset", response_model=list[DatasetRecordResponse])
def list_dataset(db: Session = Depends(get_db)) -> list[DatasetRecordResponse]:
    images = db.scalars(
        select(LeafImage).options(
            selectinload(LeafImage.annotations), selectinload(LeafImage.clinical_metadata)
        )
    ).all()
    return [dataset_record_from_image(image) for image in images]


@app.get("/dataset/metrics", response_model=DatasetMetricsResponse)
def get_dataset_metrics(db: Session = Depends(get_db)) -> DatasetMetricsResponse:
    # Counts only: no signed URLs, no per-image HTTP round-trips to Storage.
    images = db.scalars(select(LeafImage).options(selectinload(LeafImage.annotations))).all()
    experts_total = db.scalar(select(func.count()).select_from(Expert)) or 0
    active_experts = db.scalar(select(func.count(func.distinct(Annotation.expert_id)))) or 0

    validated = conflicts = pending = 0
    for image in images:
        annotation_count, _, expert_validated, _ = evaluate_consensus(image.annotations)
        if annotation_count < MIN_ANNOTATIONS_FOR_CONSENSUS:
            pending += 1
        elif expert_validated:
            validated += 1
        else:
            conflicts += 1

    return DatasetMetricsResponse(
        images=len(images),
        experts=experts_total,
        active_experts=active_experts,
        validated=validated,
        conflicts=conflicts,
        pending=pending,
    )


@app.get("/dataset/export/jsonl", response_model=list[JsonlRecord])
def export_jsonl(db: Session = Depends(get_db)) -> list[JsonlRecord]:
    annotations = db.scalars(select(Annotation).options(selectinload(Annotation.image))).all()
    records: list[JsonlRecord] = []
    for annotation in annotations:
        image_path = annotation.image.processed_path or annotation.image.original_path
        records.append(
            JsonlRecord(
                image=image_path,
                messages=[
                    {
                        "role": "user",
                        "content": "Que deficiencia nutricional presenta esta hoja de cafe?",
                    },
                    {
                        "role": "assistant",
                        "content": annotation.clinical_description,
                    },
                ],
                metadata={
                    "consensus": annotation.consensus,
                    "confidence": annotation.confidence,
                    "expert_validated": annotation.expert_validated,
                    "deficiency": annotation.deficiency,
                    "severity": annotation.severity,
                    "source_table": "annotations",
                },
            )
        )
    return records
