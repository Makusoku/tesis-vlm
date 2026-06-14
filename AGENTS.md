# AGENTS.md

Instrucciones para agentes que trabajen en este repositorio.

## Contexto del Proyecto

AgroCafeLLM es una plataforma Human-in-the-Loop para curacion experta de imagenes foliares de cafe. El objetivo es apoyar la construccion de un dataset multimodal curado, con imagenes depuradas, metadatos clinicos, diagnosticos expertos y registros exportables para entrenamiento.

Tecnologias obligatorias del proyecto:

- Frontend: React Web mediante Next.js, TypeScript y Tailwind CSS.
- Backend: Python con FastAPI.
- Procesamiento de imagen: OpenCV y Pillow.
- Base de datos: PostgreSQL por integridad relacional y transacciones ACID.
- Autenticacion: Kinde con login hospedado.
- Storage: Supabase Storage privado para imagenes foliares.
- Despliegue objetivo: frontend en Vercel y backend FastAPI en Railway.

## Estructura del Repositorio

El proyecto debe mantenerse organizado en dos carpetas principales:

```txt
backend/   API FastAPI, modelos PostgreSQL, OpenCV/Pillow y schema SQL
frontend/  App Next.js, React, TypeScript, Tailwind y vistas de usuario
```

No agregues codigo de aplicacion en la raiz. La raiz debe reservarse para archivos de coordinacion del repositorio, como `README.md`, `.gitignore`, `.gitattributes` y `AGENTS.md`.

## Permisos y Cambios Sensibles

- Nunca hagas commits por cuenta propia. Solo ejecuta `git commit` si el usuario lo pide explicitamente.
- Nunca hagas `git push` por cuenta propia. Solo empuja cambios si el usuario lo pide explicitamente.
- Antes de modificar la base de datos o su estructura, pide permiso al usuario.
- No agregues, elimines ni renombres tablas, columnas, indices, constraints, relaciones, migraciones o archivos de schema sin aprobacion explicita.
- No ejecutes migraciones ni comandos que alteren datos reales sin aprobacion explicita.
- Si un cambio requiere tocar PostgreSQL, primero explica que se modificaria y espera confirmacion.
- No expongas secretos ni valores reales de `.env` en commits, logs o respuestas.
- No uses `SUPABASE_SERVICE_ROLE_KEY` en frontend; esa llave solo pertenece al backend.
- No ejecutes operaciones destructivas sobre Supabase, Railway, Vercel o Kinde sin confirmacion explicita.

## Convencion de Commits

Si el usuario pide crear un commit, usa mensajes estilo Conventional Commits, en espanol y con scope cuando aplique:

```txt
feat(agenda): auto-seleccionar la primera empresa al iniciar la cita
fix(agenda): conservar trabajador al cambiar de empresa + aviso "no coincide"
feat(admision): encadenar citas del dia (1 ticket por persona) + errores claros
fix(dataset): no exportar registros sin validacion experta
feat(juicio-experto): agregar sintomas semanticos al formulario
```

Formato preferido:

```txt
tipo(scope): descripcion breve
```

Tipos recomendados:

- `feat`: nueva funcionalidad.
- `fix`: correccion de bug.
- `refactor`: cambio interno sin alterar comportamiento esperado.
- `docs`: documentacion.
- `test`: pruebas.
- `chore`: mantenimiento, configuracion o tareas auxiliares.

Reglas:

- Usa scope descriptivo: `juicio-experto`, `dataset`, `backend`, `frontend`, `api`, `db`, `auth`, `admision`, etc.
- Escribe la descripcion en minusculas, clara y accionable.
- Mantén el mensaje corto; si hace falta detalle, usa cuerpo del commit.
- No uses mensajes genericos como `update`, `changes`, `fix bugs` o `wip`.
- Para merges, respeta el mensaje generado por GitHub/Git salvo que el usuario pida otro.
- Esta convencion no autoriza commits automaticos; primero debe existir una solicitud explicita del usuario.

## Frontend

Trabaja dentro de `frontend/`.

Antes de modificar interfaz, layout, componentes visuales o flujos de usuario, lee y respeta `DESIGN.md`.

Comandos principales:

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

Reglas:

- Mantener Next.js App Router.
- Mantener componentes React con TypeScript.
- Usar Tailwind local, no CDN.
- Priorizar las vistas de `Juicio experto` y `Dataset`.
- Mantener una interfaz operativa, no una landing page.
- Separar componentes reutilizables en `frontend/components/`.
- Separar vistas de dominio en `frontend/features/`.
- Mantener tipos y catalogos locales en `frontend/lib/`.
- No usar datos mock visuales para simular imagenes, metricas o registros reales. Si el backend falla o no hay datos, mostrar estados vacios o errores claros.
- `frontend/lib/mock-data.ts` solo debe contener catalogos auxiliares estables, como deficiencias y sintomas. No debe contener imagenes de Unsplash, registros de dataset inventados ni metricas falsas.
- La capa de conexion con la API vive en `frontend/lib/api.ts`. Funciones disponibles:
  - `fetchDatasetRecords()` — GET /dataset
  - `fetchJsonlRecords()` — GET /dataset/export/jsonl
  - `fetchDatasetMetrics()` — GET /dataset/metrics
  - `fetchPendingImage(expertName, role)` — GET /images/pending
  - `ensureExpert(name, role)` — POST /experts/ensure
  - `createAnnotation(payload)` — POST /annotations
  - `getApiBaseUrl()` — retorna `NEXT_PUBLIC_API_URL` con fallback a `http://localhost:8000`
- Componentes con interaccion a API (`"use client"`) van en `frontend/components/` o dentro de la feature correspondiente. Ej: `UploadLeafButton` sube imagen y metadatos a `POST /images` y luego ejecuta `POST /images/{id}/preprocess`.
- Las vistas de servidor (Server Components) pueden hacer fetch directo desde `api.ts`. Ej: `DatasetPage` llama `fetchDatasetRecords()`, `fetchJsonlRecords()` y `fetchDatasetMetrics()`, y pasa los datos como props. No debe caer a mock visual.
- La ruta `/login` no debe implementar login propio con contrasena. Debe redirigir al flujo hospedado de Kinde.
- Las rutas operativas principales son `/juicio-experto` y `/dataset`.

## Backend

Trabaja dentro de `backend/`.

Comandos principales:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Verificacion rapida desde la raiz:

```bash
backend/.venv/bin/python -m py_compile backend/app/*.py backend/app/services/*.py
```

Reglas:

- FastAPI expone la API.
- SQLAlchemy modela las tablas relacionales.
- PostgreSQL/Supabase es la fuente de verdad para expertos, imagenes, metadatos clinicos, anotaciones y exportaciones.
- OpenCV/Pillow deben concentrarse en servicios de procesamiento, no en rutas con logica pesada.
- Las imagenes no deben guardarse como binario en PostgreSQL; guardar rutas o claves de almacenamiento.
- Las imagenes reales se guardan en Supabase Storage privado. PostgreSQL guarda claves/rutas tipo `storage://...`.
- En local puede usarse filesystem temporal para procesar. En Railway usar `UPLOAD_DIR=/tmp/uploads` y `PROCESSED_DIR=/tmp/processed`.
- Procesamiento de imagen en `backend/app/services/image_processing.py`:
  - `save_upload`: recibe UploadFile, convierte a RGB, redimensiona con `resize_max_side` a 1600px lado maximo, guarda como JPEG calidad 85 optimizado.
  - `preprocess_image`: desde raw, aplica `letterbox_image` a 512x512 con padding blanco (no deforma sintomas), guarda como JPEG calidad 85 via OpenCV y retorna tensor normalizado float32.
  - Constantes: `RAW_MAX_SIDE = 1600`, `JPEG_QUALITY = 85`, tamaños raw/procesado.
- `POST /images` recibe `multipart/form-data` con imagen, `specimen_code` y metadatos clinicos opcionales (`region`, `farm`, `variety`, `symptoms`).
- `POST /annotations` crea anotaciones y recalcula consenso en backend. No confiar en `consensus` ni `expert_validated` enviados desde el navegador.
- El consenso inicial requiere 4 anotaciones expertas distintas por imagen. Una imagen queda validada cuando una deficiencia logra al menos 3 de 4 votos (`consensus >= 0.75`) sin empate.
- La descripcion clinica del experto debe tener al menos 10 caracteres.
- Start command recomendado para Railway:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Modelo de Dominio

Entidades principales:

- `experts`: expertos anotadores.
- `leaf_images`: imagenes foliares depuradas.
- `clinical_metadata`: metadatos clinicos/agronomicos.
- `annotations`: juicio experto, sintomas, severidad, confianza y descripcion clinica.
- `dataset_exports`: registros preparados para entrenamiento multimodal.

Preserva la integridad referencial entre estas entidades. Evita soluciones NoSQL o estructuras ad hoc que rompan el fundamento relacional del proyecto.

## Integraciones Actuales

- Kinde: autenticacion hospedada. El frontend usa `@kinde-oss/kinde-auth-nextjs`.
- Supabase PostgreSQL: base relacional principal.
- Supabase Storage: bucket privado `leaf-images` para imagenes raw y processed.
- Vercel: despliegue recomendado para `frontend/`.
- Railway: despliegue recomendado para `backend/`.

Pendiente importante:

- Proteger el backend con JWT/Audience de Kinde antes de usarlo como produccion publica. Por ahora el frontend esta protegido por Kinde, pero la API backend debe endurecerse para evitar llamadas directas no autenticadas.

## Criterios de Implementacion

Antes de terminar cambios relevantes:

- Ejecuta `npm run lint` en `frontend/`.
- Ejecuta `npm run build` en `frontend/`.
- Ejecuta `py_compile` para backend si tocaste Python.
- Actualiza `README.md` si cambian comandos, estructura o flujo de desarrollo.
- Mantén `.env.example` actualizado cuando agregues variables de entorno.

## Estilo y Mantenimiento

- Usa ASCII en archivos nuevos salvo que exista una razon clara para usar caracteres no ASCII.
- No subas secretos, credenciales, `.env`, `.venv`, `node_modules`, `.next`, uploads ni archivos procesados.
- Evita componentes gigantes; divide por responsabilidad.
- Evita mezclar catalogos locales o datos de muestra con logica de persistencia real.
- No introduzcas refactors ajenos a la tarea.
- Si hay cambios no relacionados en el worktree, no los reviertas.

## Prioridades Actuales

Estado actual del proyecto:

- [x] Autenticacion con Kinde mediante flujo hospedado.
- [x] Vista de Juicio experto conectada a cola real de imagenes pendientes.
- [x] Vista Dataset conectada a API real, sin fallback visual a datos mock.
- [x] Formulario de subida de imagenes con metadatos clinicos (region, finca, variedad, sintomas).
- [x] Preprocesamiento backend: resize a 1600px, letterbox a 512x512, normalizacion float32.
- [x] Endpoints API: POST /images, POST /images/{id}/preprocess, GET /images/pending, GET /dataset, GET /dataset/metrics, GET /dataset/export/jsonl, POST /experts/ensure, POST /annotations.
- [x] Integracion con PostgreSQL real mediante Supabase.
- [x] Almacenamiento privado de imagenes en Supabase Storage.
- [x] Consenso de 4 expertos por imagen con validacion por mayoria 3/4.
- [ ] Despliegue backend en Railway.
- [ ] Despliegue frontend en Vercel.
- [ ] Configurar URLs productivas en Kinde.
- [ ] Proteger backend con JWT de Kinde.
- [ ] Mejorar exportacion JSONL para incluir unicamente registros validados si el flujo academico lo requiere.

El proyecto aun no implementa entrenamiento de IA. La meta actual es curacion, anotacion semantica y preparacion confiable del dataset.
