from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def save_upload(file: UploadFile, upload_dir: str) -> tuple[Path, dict[str, object]]:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WEBP images are accepted")

    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "leaf.jpg").suffix.lower() or ".jpg"
    target = Path(upload_dir) / f"{uuid4()}{extension}"
    content = await file.read()
    target.write_bytes(content)

    try:
        with Image.open(target) as image:
            metadata = {
                "width": image.width,
                "height": image.height,
                "color_mode": image.mode,
                "image_format": image.format or extension.replace(".", "").upper(),
            }
    except UnidentifiedImageError as exc:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=415, detail="Uploaded file is not a valid image") from exc

    return target, metadata


def preprocess_image(source_path: str, processed_dir: str, size: tuple[int, int] = (512, 512)) -> dict[str, object]:
    Path(processed_dir).mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as pil_image:
        rgb_image = pil_image.convert("RGB")
        image_format = pil_image.format or "JPEG"
        original_width, original_height = pil_image.size

    tensor = np.array(rgb_image)
    resized = cv2.resize(tensor, size, interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0

    processed_path = Path(processed_dir) / f"{Path(source_path).stem}_processed.jpg"
    cv2.imwrite(str(processed_path), cv2.cvtColor(resized, cv2.COLOR_RGB2BGR))

    return {
        "processed_path": str(processed_path),
        "width": original_width,
        "height": original_height,
        "color_mode": "RGB",
        "image_format": image_format,
        "tensor_shape": tuple(int(value) for value in normalized.shape),
    }
