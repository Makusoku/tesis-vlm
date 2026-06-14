from io import BytesIO
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
RAW_MAX_SIDE = 1600
JPEG_QUALITY = 85


def resize_max_side(image: Image.Image, max_side: int) -> Image.Image:
    width, height = image.size
    longest_side = max(width, height)
    if longest_side <= max_side:
        return image.copy()

    scale = max_side / longest_side
    target_size = (round(width * scale), round(height * scale))
    return image.resize(target_size, Image.Resampling.LANCZOS)


def letterbox_image(image: Image.Image, size: tuple[int, int], fill: tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    target_width, target_height = size
    width, height = image.size
    scale = min(target_width / width, target_height / height)
    resized_size = (round(width * scale), round(height * scale))
    resized = image.resize(resized_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", size, fill)
    offset = ((target_width - resized_size[0]) // 2, (target_height - resized_size[1]) // 2)
    canvas.paste(resized, offset)
    return canvas


async def save_upload(file: UploadFile, upload_dir: str) -> tuple[Path, dict[str, object]]:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WEBP images are accepted")

    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    target = Path(upload_dir) / f"{uuid4()}.jpg"
    content = await file.read()

    try:
        with Image.open(BytesIO(content)) as image:
            rgb_image = image.convert("RGB")
            optimized = resize_max_side(rgb_image, RAW_MAX_SIDE)
            optimized.save(target, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            metadata = {
                "width": optimized.width,
                "height": optimized.height,
                "color_mode": "RGB",
                "image_format": "JPEG",
            }
    except UnidentifiedImageError as exc:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=415, detail="Uploaded file is not a valid image") from exc

    return target, metadata


def preprocess_image(source_path: str, processed_dir: str, size: tuple[int, int] = (512, 512)) -> dict[str, object]:
    Path(processed_dir).mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as pil_image:
        rgb_image = pil_image.convert("RGB")
        source_width, source_height = pil_image.size

    letterboxed = letterbox_image(rgb_image, size)
    tensor = np.array(letterboxed)
    normalized = tensor.astype(np.float32) / 255.0

    processed_path = Path(processed_dir) / f"{Path(source_path).stem}_processed.jpg"
    cv2.imwrite(str(processed_path), cv2.cvtColor(tensor, cv2.COLOR_RGB2BGR), [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])

    return {
        "processed_path": str(processed_path),
        "width": source_width,
        "height": source_height,
        "color_mode": "RGB",
        "image_format": "JPEG",
        "tensor_shape": tuple(int(value) for value in normalized.shape),
    }
