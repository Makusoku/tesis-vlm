from pydantic import BaseModel, Field


class ExpertEnsure(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = Field(default="Analista agronómico", min_length=1, max_length=120)
    aliases: list[str] = Field(default_factory=list)


class ExpertResponse(BaseModel):
    id: str
    name: str
    role: str


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
    clinical_description: str = Field(min_length=10)
    consensus: float = Field(default=0, ge=0, le=1)
    expert_validated: bool = False


class AnnotationResponse(AnnotationCreate):
    id: str


class DatasetRecordResponse(BaseModel):
    image_id: str
    specimen_code: str
    original_path: str
    processed_path: str | None
    preview_url: str | None = None
    status: str
    annotations: int
    consensus: float
    expert_validated: bool
    final_diagnosis: str | None
    region: str | None = None
    farm: str | None = None
    variety: str | None = None
    metadata_symptoms: list[str] = Field(default_factory=list)
    width: int | None
    height: int | None
    color_mode: str | None
    image_format: str | None


class PendingImageResponse(DatasetRecordResponse):
    preview_url: str


class DatasetMetricsResponse(BaseModel):
    images: int
    experts: int
    active_experts: int
    validated: int
    conflicts: int
    pending: int


class JsonlRecord(BaseModel):
    image: str
    messages: list[dict[str, str]]
    metadata: dict[str, object]
