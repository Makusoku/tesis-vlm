# AGENTS.md

Instrucciones para agentes que trabajen en este repositorio.

## Contexto del Proyecto

AgroCafeLLM es una plataforma Human-in-the-Loop para curacion experta de imagenes foliares de cafe. El objetivo es apoyar la construccion de un dataset multimodal curado, con imagenes depuradas, metadatos clinicos, diagnosticos expertos y registros exportables para entrenamiento.

Tecnologias obligatorias del proyecto:

- Frontend: React Web mediante Next.js, TypeScript y Tailwind CSS.
- Backend: Python con FastAPI.
- Procesamiento de imagen: OpenCV y Pillow.
- Base de datos: PostgreSQL por integridad relacional y transacciones ACID.

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
- Mantener tipos y datos mock en `frontend/lib/`.
- No conectar datos reales directamente desde componentes; usar una capa clara cuando se agregue API.

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
- PostgreSQL es la fuente de verdad para expertos, imagenes, metadatos clinicos, anotaciones y exportaciones.
- OpenCV/Pillow deben concentrarse en servicios de procesamiento, no en rutas con logica pesada.
- Las imagenes no deben guardarse como binario en PostgreSQL; guardar rutas o claves de almacenamiento.
- En local puede usarse filesystem; en despliegue se espera S3 u otro storage equivalente.

## Modelo de Dominio

Entidades principales:

- `experts`: expertos anotadores.
- `leaf_images`: imagenes foliares depuradas.
- `clinical_metadata`: metadatos clinicos/agronomicos.
- `annotations`: juicio experto, sintomas, severidad, confianza y descripcion clinica.
- `dataset_exports`: registros preparados para entrenamiento multimodal.

Preserva la integridad referencial entre estas entidades. Evita soluciones NoSQL o estructuras ad hoc que rompan el fundamento relacional del proyecto.

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
- Evita mezclar mock data con logica de persistencia real.
- No introduzcas refactors ajenos a la tarea.
- Si hay cambios no relacionados en el worktree, no los reviertas.

## Prioridades Actuales

La prioridad funcional inicial es:

1. Vista de Juicio experto.
2. Vista Dataset.
3. Preparacion de API para ingesta, preprocesamiento y anotacion.
4. Integracion posterior con PostgreSQL real y almacenamiento de imagenes.

El proyecto aun no implementa entrenamiento de IA. La meta actual es curacion, anotacion semantica y preparacion confiable del dataset.
