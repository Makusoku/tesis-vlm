from pathlib import Path
import ssl
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import certifi
from fastapi import HTTPException

from ..config import Settings

SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def storage_uri(bucket: str, object_key: str) -> str:
    return f"storage://{bucket}/{object_key}"


def parse_storage_uri(uri: str) -> tuple[str, str]:
    if not uri.startswith("storage://"):
        raise ValueError("Not a storage URI")

    path = uri.removeprefix("storage://")
    bucket, _, object_key = path.partition("/")
    if not bucket or not object_key:
        raise ValueError("Invalid storage URI")
    return bucket, object_key


def upload_to_supabase(
    settings: Settings,
    file_path: Path,
    object_key: str,
    content_type: str = "application/octet-stream",
) -> str:
    if not settings.storage_enabled:
        return str(file_path)

    bucket = settings.supabase_storage_bucket
    encoded_key = quote(object_key, safe="/")
    url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{encoded_key}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key or "",
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    request = Request(url, data=file_path.read_bytes(), headers=headers, method="POST")
    try:
        with urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
            if response.status not in {200, 201}:
                raise HTTPException(status_code=502, detail="Supabase Storage rejected the upload")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore") or exc.reason
        raise HTTPException(status_code=502, detail=f"Supabase Storage upload failed: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase Storage is unreachable: {exc.reason}") from exc

    return storage_uri(bucket, object_key)


def download_from_supabase(settings: Settings, uri: str, target_dir: str) -> Path:
    bucket, object_key = parse_storage_uri(uri)
    encoded_key = quote(object_key, safe="/")
    url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{encoded_key}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key or "",
    }

    Path(target_dir).mkdir(parents=True, exist_ok=True)
    target = Path(target_dir) / Path(object_key).name
    request = Request(url, headers=headers, method="GET")
    try:
        with urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
            target.write_bytes(response.read())
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore") or exc.reason
        raise HTTPException(status_code=502, detail=f"Supabase Storage download failed: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase Storage is unreachable: {exc.reason}") from exc

    return target
