from pydantic import BaseModel, Field


class ImageResponse(BaseModel):
    id: str
    specimen_code: str
    original_path: str
    processed_path: str | None
    width: int | None
    height: int | None
    color_mode: str | None
    image_format: str | None
    status: str


class PreprocessResponse(BaseModel):
    image_id: str
    processed_path: str
    width: int
    height: int
    color_mode: str
    image_format: str
    tensor_shape: tuple[int, int, int]
    status: str


class AnnotationCreate(BaseModel):
    image_id: str
    expert_id: str
    deficiency: str
    severity: str
    confidence: float = Field(ge=0, le=100)
    symptoms: list[str]
    clinical_description: str = Field(min_length=20)
    consensus: float = Field(default=0, ge=0, le=1)
    expert_validated: bool = False


class AnnotationResponse(AnnotationCreate):
    id: str


class DatasetRecordResponse(BaseModel):
    image_id: str
    specimen_code: str
    processed_path: str | None
    status: str
    annotations: int


class JsonlRecord(BaseModel):
    image: str
    messages: list[dict[str, str]]
    metadata: dict[str, object]
