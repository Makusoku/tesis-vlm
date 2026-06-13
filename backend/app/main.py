from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import Annotation, Expert, LeafImage
from .schemas import (
    AnnotationCreate,
    AnnotationResponse,
    DatasetRecordResponse,
    ImageResponse,
    JsonlRecord,
    PreprocessResponse,
)
from .services.image_processing import preprocess_image, save_upload

app = FastAPI(title="AgroCafeLLM API", version="0.1.0")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/experts", response_model=dict[str, str])
def create_expert(name: str, role: str = "Analista Agronomico", db: Session = Depends(get_db)) -> dict[str, str]:
    expert = Expert(name=name, role=role)
    db.add(expert)
    db.commit()
    db.refresh(expert)
    return {"id": expert.id, "name": expert.name, "role": expert.role}


@app.post("/images", response_model=ImageResponse)
async def upload_image(
    specimen_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> LeafImage:
    settings = get_settings()
    original_path, metadata = await save_upload(file, settings.upload_dir)
    image = LeafImage(
        specimen_code=specimen_code,
        original_path=str(original_path),
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


@app.post("/images/{image_id}/preprocess", response_model=PreprocessResponse)
def preprocess_leaf_image(image_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    settings = get_settings()
    image = db.get(LeafImage, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    result = preprocess_image(image.original_path, settings.processed_dir)
    image.processed_path = str(result["processed_path"])
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

    annotation = Annotation(**payload.model_dump())
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@app.get("/dataset", response_model=list[DatasetRecordResponse])
def list_dataset(db: Session = Depends(get_db)) -> list[DatasetRecordResponse]:
    images = db.scalars(select(LeafImage)).all()
    return [
        DatasetRecordResponse(
            image_id=image.id,
            specimen_code=image.specimen_code,
            processed_path=image.processed_path,
            status=image.status,
            annotations=len(image.annotations),
        )
        for image in images
    ]


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
