# CLAUDE.md

Reglas de trabajo para Claude en este repositorio. Complementan a `AGENTS.md` y `DESIGN.md`.

## Git: commits y ramas

- **Nunca hacer `git commit` sin que el usuario lo pida explicitamente.** Aunque el trabajo este terminado y verificado, dejar los cambios en el working tree y esperar la orden de commitear.
- **Nunca hacer `git push` sin que el usuario lo pida explicitamente.** Recordar que un push a `main` deploya directo a produccion (Vercel + Railway), sin CI ni gate.
- **No trabajar nunca directamente sobre `main`.** Para cualquier cambio, crear una rama independiente a partir de `main` y trabajar ahi. `main` se mantiene limpia.
- Integrar a `main` solo cuando el usuario lo pida, idealmente via Pull Request.

## Nombres de rama

Formato: `tipo/descripcion-en-kebab-case`, en espanol y en ASCII (sin acentos).

```txt
fix/estabilidad-flujo
fix/cumplimiento-requerimientos-evaluacion
feat/exportacion-jsonl-validados
refactor/consenso-experto
```

## Mensajes de commit

Estilo Conventional Commits, en espanol, descripcion en minusculas y en ASCII (sin acentos):

```txt
tipo(scope): descripcion breve
```

Ejemplos del estilo esperado:

```txt
refactor(auditoria): separar reloj y controles
refactor(auditoria): ordenar paneles de simulacion
fix(ui): ocultar boton flotante de control aereo
fix(deploy): validar backend y conexion mysql
fix(simulacion): sincronizar pedidos del vuelo seleccionado
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

Scopes de este proyecto: `juicio-experto`, `dataset`, `backend`, `frontend`, `api`, `db`, `auth`, etc.

Reglas:

- Descripcion clara y accionable; no usar `update`, `changes`, `fix bugs` ni `wip`.
- Mensaje corto; si hace falta detalle, usar el cuerpo del commit.
- Un commit por cambio logico.
</content>
</invoke>
