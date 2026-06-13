# AgroCafeLLM Platform

Plataforma Human-in-the-Loop para curacion experta de imagenes foliares de cafe y preparacion de registros multimodales para entrenamiento.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, OpenCV, Pillow
- Base de datos: PostgreSQL

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

La primera version usa datos mock en la interfaz. El backend queda preparado para ingesta, preprocesamiento y persistencia relacional.
