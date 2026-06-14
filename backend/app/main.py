from collections import Counter
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import Annotation, Expert, LeafImage
from .schemas import (
    AnnotationCreate,
    AnnotationResponse,
    DatasetRecordResponse,
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


@app.post("/experts", response_model=dict[str, str])
def create_expert(name: str, role: str = "Analista Agronomico", db: Session = Depends(get_db)) -> dict[str, str]:
    expert = Expert(name=name, role=role)
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return {"id": expert.id, "name": expert.name, "role": expert.role}


@app.post("/experts/ensure", response_model=ExpertResponse)
def ensure_expert(payload: ExpertEnsure, db: Session = Depends(get_db)) -> Expert:
    return ensure_expert_record(payload.name, payload.role, db)


def ensure_expert_record(name: str, role: str, db: Session) -> Expert:
    expert = db.scalar(select(Expert).where(Expert.name == name, Expert.role == role))
    if expert is not None:
        return expert

    expert = Expert(name=name, role=role)
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return expert


@app.post("/images", response_model=ImageResponse)
async def upload_image(
    specimen_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> LeafImage:
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
    db.commit()
    db.refresh(image)
    return image


def dataset_record_from_image(image: LeafImage) -> DatasetRecordResponse:
    annotations = image.annotations
    diagnosis_counts = Counter(annotation.deficiency for annotation in annotations)
    top_items = diagnosis_counts.most_common()
    top_count = top_items[0][1] if top_items else 0
    has_tie = len(top_items) > 1 and top_items[1][1] == top_count
    consensus = (top_count / len(annotations)) if len(annotations) >= 2 else 0
    expert_validated = len(annotations) >= MIN_ANNOTATIONS_FOR_CONSENSUS and not has_tie and consensus >= CONSENSUS_VALIDATION_THRESHOLD
    final_diagnosis = top_items[0][0] if expert_validated else None

    return DatasetRecordResponse(
        image_id=image.id,
        specimen_code=image.specimen_code,
        original_path=image.original_path,
        processed_path=image.processed_path,
        status=image.status,
        annotations=len(annotations),
        consensus=consensus,
        expert_validated=expert_validated,
        final_diagnosis=final_diagnosis,
        width=image.width,
        height=image.height,
        color_mode=image.color_mode,
        image_format=image.image_format,
    )


@app.get("/images/pending", response_model=PendingImageResponse | None)
def get_pending_image(
    expert_name: str | None = None,
    role: str = "Analista agronómico",
    db: Session = Depends(get_db),
) -> PendingImageResponse | None:
    expert = db.scalar(select(Expert).where(Expert.name == expert_name, Expert.role == role)) if expert_name else None
    images = db.scalars(select(LeafImage).order_by(LeafImage.created_at.asc())).all()
    image = next(
        (
            item
            for item in images
            if len(item.annotations) < MIN_ANNOTATIONS_FOR_CONSENSUS
            and (expert is None or all(annotation.expert_id != expert.id for annotation in item.annotations))
        ),
        None,
    )
    if image is None:
        return None

    image_path = image.processed_path or image.original_path
    record = dataset_record_from_image(image)
    return PendingImageResponse(**record.model_dump(), preview_url=create_signed_url(settings, image_path))


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

    annotation = Annotation(**payload.model_dump())
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
