from collections import Counter
from pathlib import Path
from unicodedata import combining, normalize

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

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


def find_expert_records(names: list[str], role: str | None, db: Session) -> list[Expert]:
    identities = {normalize_identity(name) for name in names if normalize_identity(name)}
    if not identities:
        return []

    normalized_role = normalize_identity(role)
    experts = db.scalars(select(Expert)).all()
    matches_with_role = [
        expert
        for expert in experts
        if normalize_identity(expert.name) in identities and normalize_identity(expert.role) == normalized_role
    ]
    if matches_with_role:
        return matches_with_role

    return [expert for expert in experts if normalize_identity(expert.name) in identities]


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
        return experts[0]

    expert = Expert(name=name, role=role)
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

    db.commit()
    db.refresh(image)
    return image


def dataset_record_from_image(image: LeafImage) -> DatasetRecordResponse:
    annotations = image.annotations
    clinical_metadata = image.clinical_metadata
    diagnosis_counts = Counter(annotation.deficiency for annotation in annotations)
    top_items = diagnosis_counts.most_common()
    top_count = top_items[0][1] if top_items else 0
    has_tie = len(top_items) > 1 and top_items[1][1] == top_count
    consensus = (top_count / len(annotations)) if len(annotations) >= 2 else 0
    expert_validated = len(annotations) >= MIN_ANNOTATIONS_FOR_CONSENSUS and not has_tie and consensus >= CONSENSUS_VALIDATION_THRESHOLD
    final_diagnosis = top_items[0][0] if expert_validated else None
    image_path = image.processed_path or image.original_path

    return DatasetRecordResponse(
        image_id=image.id,
        specimen_code=image.specimen_code,
        original_path=image.original_path,
        processed_path=image.processed_path,
        preview_url=create_signed_url(settings, image_path),
        status=image.status,
        annotations=len(annotations),
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
    role: str = DEFAULT_EXPERT_ROLE,
    db: Session = Depends(get_db),
) -> PendingImageResponse | None:
    expert_names = compact_identity_values(expert_name, *expert_alias)
    experts = find_expert_records(expert_names, role, db)
    expert_ids = {expert.id for expert in experts}
    images = db.scalars(select(LeafImage).order_by(LeafImage.created_at.asc())).all()
    image = next(
        (
            item
            for item in images
            if len(item.annotations) < MIN_ANNOTATIONS_FOR_CONSENSUS
            and (not expert_names or all(annotation.expert_id not in expert_ids for annotation in item.annotations))
        ),
        None,
    )
    if image is None:
        return None

    record = dataset_record_from_image(image)
    return PendingImageResponse(**record.model_dump())


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
    db.commit()
    db.refresh(annotation)

    image_annotations = db.scalars(select(Annotation).where(Annotation.image_id == payload.image_id)).all()
    diagnosis_counts = Counter(item.deficiency for item in image_annotations)
    top_items = diagnosis_counts.most_common()
    top_count = top_items[0][1] if top_items else 0
    has_tie = len(top_items) > 1 and top_items[1][1] == top_count
    consensus = (top_count / len(image_annotations)) if len(image_annotations) >= 2 else 0
    expert_validated = (
        len(image_annotations) >= MIN_ANNOTATIONS_FOR_CONSENSUS
        and not has_tie
        and consensus >= CONSENSUS_VALIDATION_THRESHOLD
    )

    for item in image_annotations:
        item.consensus = consensus
        item.expert_validated = expert_validated
    db.commit()
    db.refresh(annotation)
    return annotation


@app.get("/dataset", response_model=list[DatasetRecordResponse])
def list_dataset(db: Session = Depends(get_db)) -> list[DatasetRecordResponse]:
    images = db.scalars(select(LeafImage)).all()
    return [dataset_record_from_image(image) for image in images]


@app.get("/dataset/metrics", response_model=DatasetMetricsResponse)
def get_dataset_metrics(db: Session = Depends(get_db)) -> DatasetMetricsResponse:
    images = db.scalars(select(LeafImage)).all()
    experts = db.scalars(select(Expert)).all()
    annotations = db.scalars(select(Annotation)).all()
    records = [dataset_record_from_image(image) for image in images]
    conflict_count = sum(
        1
        for record in records
        if record.annotations >= MIN_ANNOTATIONS_FOR_CONSENSUS and not record.expert_validated
    )

    return DatasetMetricsResponse(
        images=len(images),
        experts=len(experts),
        active_experts=len({annotation.expert_id for annotation in annotations}),
        validated=sum(1 for record in records if record.expert_validated),
        conflicts=conflict_count,
        pending=sum(1 for record in records if record.annotations < MIN_ANNOTATIONS_FOR_CONSENSUS),
    )


@app.get("/dataset/export/jsonl", response_model=list[JsonlRecord])
def export_jsonl(db: Session = Depends(get_db)) -> list[JsonlRecord]:
    annotations = db.scalars(select(Annotation)).all()
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
