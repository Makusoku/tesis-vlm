# AgroCafeLLM Platform

Plataforma Human-in-the-Loop para curacion experta de imagenes foliares de cafe y preparacion de registros multimodales para entrenamiento.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, OpenCV, Pillow
- Base de datos: PostgreSQL, usando Supabase como proveedor gestionado
- Storage: Supabase Storage para imagenes foliares originales y procesadas

## Estructura

```txt
backend/   API FastAPI, OpenCV/Pillow y PostgreSQL
frontend/  App Next.js, React, TypeScript y Tailwind
```

## Desarrollo frontend

```bash
cd frontend
npm install
npm run dev
```

Variables necesarias en `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

La vista Dataset consulta `GET /dataset` y `GET /dataset/export/jsonl`. El boton `Subir hojas` envia imagenes a `POST /images` y luego ejecuta `POST /images/{id}/preprocess`.

La vista Juicio experto consulta `GET /images/pending`, visualiza la imagen privada mediante una URL temporal generada por el backend, asegura el experto con `POST /experts/ensure` y guarda el juicio en `POST /annotations`.

La regla inicial de consenso usa 4 anotaciones expertas distintas por imagen. El backend recalcula consenso despues de cada anotacion; una imagen queda validada cuando alcanza 4 juicios y una deficiencia obtiene al menos 3 coincidencias de 4 (`consensus >= 0.75`). Empates o acuerdos de 2/4 quedan como casos conflictivos.

## Desarrollo backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Variables necesarias en `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_supabase_secret_key
SUPABASE_STORAGE_BUCKET=leaf-images
UPLOAD_DIR=uploads
PROCESSED_DIR=processed
CORS_ORIGINS=http://localhost:3000
```

El bucket `leaf-images` debe existir en Supabase Storage y mantenerse privado. El backend guarda una copia local temporal para procesar con OpenCV/Pillow y registra en PostgreSQL la ruta del objeto almacenado.

Politica de imagenes:

- `raw/`: imagen optimizada en JPEG, RGB, calidad 85 y lado largo maximo de 1600px.
- `processed/`: imagen 512x512 en JPEG, RGB, calidad 85, manteniendo proporcion y agregando padding para no deformar sintomas foliares.

La primera version usa datos mock en la interfaz. El backend ya queda conectado para ingesta, preprocesamiento, Storage y persistencia relacional.
