from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def new_uuid() -> str:
    return str(uuid4())


class Expert(Base):
    __tablename__ = "experts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    # Identidades historicas del experto (id de Kinde, emails, nombre) para
    # reconciliarlo aunque ingrese con distintas cuentas/metodos de login.
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    annotations: Mapped[list["Annotation"]] = relationship(back_populates="expert")


class LeafImage(Base):
    __tablename__ = "leaf_images"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    specimen_code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    original_path: Mapped[str] = mapped_column(Text, nullable=False)
    processed_path: Mapped[str | None] = mapped_column(Text)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    color_mode: Mapped[str | None] = mapped_column(String(30))
    image_format: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(40), default="uploaded", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    clinical_metadata: Mapped["ClinicalMetadata | None"] = relationship(back_populates="image")
    annotations: Mapped[list["Annotation"]] = relationship(back_populates="image")


class ClinicalMetadata(Base):
    __tablename__ = "clinical_metadata"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    image_id: Mapped[str] = mapped_column(ForeignKey("leaf_images.id", ondelete="CASCADE"), nullable=False)
    region: Mapped[str | None] = mapped_column(String(120))
    farm: Mapped[str | None] = mapped_column(String(120))
    variety: Mapped[str | None] = mapped_column(String(120))
    symptoms: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    image: Mapped[LeafImage] = relationship(back_populates="clinical_metadata")


class Annotation(Base):
    __tablename__ = "annotations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    image_id: Mapped[str] = mapped_column(ForeignKey("leaf_images.id", ondelete="CASCADE"), nullable=False)
    expert_id: Mapped[str] = mapped_column(ForeignKey("experts.id", ondelete="RESTRICT"), nullable=False)
    deficiency: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(40), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    symptoms: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    clinical_description: Mapped[str] = mapped_column(Text, nullable=False)
    consensus: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    expert_validated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    image: Mapped[LeafImage] = relationship(back_populates="annotations")
    expert: Mapped[Expert] = relationship(back_populates="annotations")


class DatasetExport(Base):
    __tablename__ = "dataset_exports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    format: Mapped[str] = mapped_column(String(40), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False)
    export_path: Mapped[str | None] = mapped_column(Text)
    export_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
