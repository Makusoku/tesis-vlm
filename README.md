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
UPLOAD_DIR=backend/uploads
PROCESSED_DIR=backend/processed
CORS_ORIGINS=http://localhost:3000
```

El bucket `leaf-images` debe existir en Supabase Storage y mantenerse privado. El backend guarda una copia local temporal para procesar con OpenCV/Pillow y registra en PostgreSQL la ruta del objeto almacenado.

La primera version usa datos mock en la interfaz. El backend ya queda conectado para ingesta, preprocesamiento, Storage y persistencia relacional.
