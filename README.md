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

La vista Dataset consulta `GET /dataset`, `GET /dataset/metrics` y `GET /dataset/export/jsonl`. Incluye miniaturas con URLs temporales de Storage, metricas reales de expertos, busqueda por codigo/estado/diagnostico/metadatos, filtros por estado y exportacion descargable en JSONL, JSON y CSV. Si el backend no esta disponible o no hay imagenes, la interfaz muestra estados vacios reales y no datos de demostracion.

El boton `Subir hojas` abre un formulario para registrar imagen, codigo, region, finca, variedad y sintomas iniciales. Luego envia esos datos a `POST /images`, guarda metadatos clinicos en PostgreSQL y ejecuta `POST /images/{id}/preprocess`.

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

El bucket `leaf-images` debe existir en Supabase Storage y mantenerse privado. El backend guarda una copia local temporal para procesar con OpenCV/Pillow, registra en PostgreSQL la ruta del objeto almacenado y asocia los metadatos clinicos con la imagen.

Politica de imagenes:

- `raw/`: imagen optimizada en JPEG, RGB, calidad 85 y lado largo maximo de 1600px.
- `processed/`: imagen 512x512 en JPEG, RGB, calidad 85, manteniendo proporcion y agregando padding para no deformar sintomas foliares.

La interfaz ya consume datos reales del backend para cola de imagenes, dataset, metricas y exportaciones. Los catalogos de deficiencias y sintomas siguen siendo listas locales de apoyo para acelerar la anotacion experta.

## Despliegue

Arquitectura recomendada:

```txt
frontend/  -> Vercel
backend/   -> Railway
PostgreSQL -> Supabase
Storage    -> Supabase Storage
Auth       -> Kinde
```

### Backend en Railway

Crear un servicio desde GitHub apuntando al directorio `backend/`.

Railway puede usar `backend/railway.json`. Si configuras manualmente:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Variables necesarias en Railway:

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_supabase_secret_key
SUPABASE_STORAGE_BUCKET=leaf-images
UPLOAD_DIR=/tmp/uploads
PROCESSED_DIR=/tmp/processed
CORS_ORIGINS=https://your-frontend.vercel.app
```

Verificacion:

```txt
GET https://your-backend.up.railway.app/health
```

### Frontend en Vercel

Crear un proyecto desde GitHub apuntando al directorio `frontend/`.

Variables necesarias en Vercel:

```env
KINDE_CLIENT_ID=replace_with_your_kinde_client_id
KINDE_CLIENT_SECRET=replace_with_your_kinde_client_secret
KINDE_ISSUER_URL=https://agrocafellm.kinde.com
KINDE_SITE_URL=https://your-frontend.vercel.app
KINDE_POST_LOGOUT_REDIRECT_URL=https://your-frontend.vercel.app/login
KINDE_POST_LOGIN_REDIRECT_URL=https://your-frontend.vercel.app/juicio-experto
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### Kinde

En la aplicacion de Kinde, agregar:

```txt
Allowed callback URLs:
https://your-frontend.vercel.app/api/auth/kinde_callback

Allowed logout redirect URLs:
https://your-frontend.vercel.app/login
https://your-frontend.vercel.app

Application login URI:
https://your-frontend.vercel.app/api/auth/login
```

### Checklist post-deploy

- Abrir `/health` del backend.
- Iniciar sesion desde `/login`.
- Subir una imagen foliar.
- Confirmar que se crea el objeto en Supabase Storage.
- Confirmar que `leaf_images` y `clinical_metadata` reciben registros.
- Guardar un juicio experto.
- Revisar `/dataset` y exportacion JSONL.

Pendiente antes de produccion publica: proteger el backend con JWT/Audience de Kinde para rechazar llamadas no autenticadas directas a la API.
