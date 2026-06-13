# DESIGN.md

Guia de diseno para AgroCafeLLM.

## Objetivo Visual

AgroCafeLLM debe sentirse como una herramienta operativa de investigacion aplicada, no como una landing page. La interfaz debe ayudar a expertos agronomicos a revisar imagenes foliares de cafe, registrar diagnosticos clinicos y preparar un dataset multimodal confiable.

La referencia visual inicial es el mockup `agrocafellm-mockup`: sidebar verde oscuro, fondo claro agro, tarjetas blancas, controles de anotacion y paneles de dataset.

## Principios UX

- Priorizar velocidad de anotacion y lectura clara.
- Mostrar siempre contexto de la imagen, estado del registro y trazabilidad.
- Reducir texto explicativo dentro de la UI; la pantalla debe ser una herramienta de trabajo.
- Mantener las acciones principales visibles: guardar juicio, revisar dataset, exportar.
- Evitar layouts decorativos o de marketing.
- Evitar componentes gigantes; cada vista debe dividirse por responsabilidad.
- Usar estados visuales claros para pendiente, en revision, validado y conflictivo.

## Vistas Prioritarias

### Juicio Experto

La vista debe permitir:

- Ver la imagen foliar con suficiente tamano.
- Identificar codigo de imagen, etapa foliar y estado de consenso.
- Seleccionar deficiencia principal.
- Registrar severidad y calidad de imagen.
- Marcar sintomas visibles.
- Redactar descripcion clinica del experto.
- Guardar el juicio y avanzar al siguiente registro.

La imagen debe dominar la vista, con el formulario al costado en desktop y debajo en pantallas pequenas.

### Dataset

La vista debe permitir:

- Ver metricas generales del banco curado.
- Revisar registros con diagnostico, metadatos, consenso y estado.
- Entender que PostgreSQL es la fuente de verdad relacional.
- Mostrar formatos de exportacion para entrenamiento.
- Mostrar un ejemplo JSONL legible.

La tabla o listado debe priorizar trazabilidad: imagen, diagnostico, metadatos, consenso y estado.

## Layout

- Las vistas principales deben usar rutas reales de Next.js: `/juicio-experto` para anotacion experta y `/dataset` para dataset curado.
- Usar sidebar persistente en desktop.
- La identidad superior del sidebar debe mostrar solo el nombre de la pagina/proyecto; no usar subtitulo en ese bloque.
- El sidebar debe estar colapsado por defecto en desktop, mostrando solo iconos.
- Al pasar el raton o enfocar el sidebar, debe expandirse para mostrar textos y contexto.
- Debe existir una accion superior de fijado para mantener el sidebar extendido mientras este activa; debe usar un icono descriptivo de barra lateral y conservar tooltip/label accesible.
- Los iconos principales del sidebar deben conservar su posicion al expandir o contraer.
- Los textos de navegacion deben quedar en una posicion fija y revelarse por el recorte del sidebar, sin aparecer tarde por fade o cambio de posicion.
- Al contraerse, el borde derecho del sidebar debe actuar como mascara visual para que no se filtren letras de las etiquetas.
- En estado contraido, los botones seleccionados y el perfil deben conservar su propio borde redondeado completo; no deben verse como fondos grandes cortados por el borde del sidebar.
- Debe existir una linea divisoria entre la identidad de la aplicacion y los iconos de navegacion.
- Hacer click en una opcion de navegacion no debe fijar el sidebar.
- El perfil del experto debe ubicarse en la parte inferior para no desplazar la navegacion principal.
- Por ahora, el footer del sidebar solo debe mostrar un avatar cuadrado con inicial unica, nombre y rol corto; no mostrar XP, porcentaje ni mision semanal.
- El footer puede mostrar accion de cerrar sesion junto al usuario, pero solo cuando el sidebar este expandido.
- El sidebar expandido debe dar espacio suficiente para leer completo el nombre del usuario del footer.
- La navegacion principal del sidebar debe estar anclada a una posicion vertical estable.
- En desktop, el sidebar debe medir lo mismo que la ventana y no debe scrollear con el contenido principal.
- El scroll vertical de la aplicacion debe ocurrir en el panel de contenido, no en la barra lateral.
- En mobile/tablet, el sidebar puede apilarse arriba o transformarse en navegacion compacta.
- El contenido principal debe tener padding consistente.
- Usar grillas de 12 columnas en desktop cuando haya panel de imagen + panel de formulario.
- Evitar tarjetas anidadas innecesarias.
- Mantener espacios suficientes entre paneles para lectura rapida.

## Componentes Base

Componentes esperados:

- `Sidebar`: navegacion principal y contexto del experto.
- `AppHeader`: titulo de la herramienta, busqueda y accion de subida.
- `Card`: contenedor visual para paneles.
- `Button`: acciones primarias, secundarias y peligrosas.
- `StatCard`: metricas resumidas.
- `ExpertJudgmentView`: vista de anotacion.
- `DatasetView`: vista de dataset curado.

Los controles deben ser familiares:

- Selects para opciones cerradas.
- Checkboxes para sintomas.
- Textarea para descripcion clinica.
- Botones con icono y texto cuando la accion lo amerite.
- Badges para estados.
- Barras de progreso para consenso o avance.

## Estilo Visual

Paleta base:

```txt
canopy-900  #10251b  sidebar y paneles oscuros
canopy-50   #f3f8f1  fondo general
emerald-700 #047857  acciones primarias
emerald-100 #d1fae5  estados positivos suaves
amber-300   #fcd34d  misiones/alertas destacadas
amber-100   #fef3c7  estados pendientes
slate-950   #020617  texto principal
slate-500   #64748b  texto secundario
white       #ffffff  tarjetas
```

Reglas:

- El verde oscuro debe dar identidad agro/cafe sin saturar toda la interfaz.
- Las tarjetas blancas deben funcionar como superficies de trabajo.
- Usar acentos ambar solo para advertencias, pendientes o misiones.
- Evitar una interfaz dominada por un solo tono verde; combinar con slate, blanco y ambar.
- No usar fondos con blobs, orbes o decoracion abstracta.

## Tipografia

- Usar la fuente del sistema por defecto de Next/Tailwind.
- Titulos de seccion: claros y compactos.
- Texto de tabla/listado: pequeno pero legible.
- No usar texto hero grande dentro de la herramienta.
- Evitar letter-spacing negativo.

## Responsive

La app debe funcionar al menos en:

- Desktop ancho: sidebar + contenido principal.
- Laptop/tablet: contenido con columnas reducidas.
- Mobile: secciones apiladas, controles de ancho completo y texto sin desbordes.

Criterios:

- Ningun boton debe cortar su texto.
- Las tablas deben transformarse en listado o permitir scroll horizontal controlado.
- La imagen principal no debe quedar aplastada ni desbordarse.
- Los paneles de formulario deben poder usarse con una mano en mobile.

## Estados y Feedback

Estados recomendados:

```txt
Pendiente       badge ambar
En revision     badge ambar o slate
En consenso     badge ambar
Validada        badge emerald
Rechazada       badge rojo
Exportable      badge emerald
```

Las acciones futuras que conecten con API deben contemplar:

- Loading.
- Error recuperable.
- Exito.
- Validacion de campos.
- Registro incompleto.

## Datos y Trazabilidad

La UI debe reflejar el modelo relacional:

- Una imagen puede tener metadatos clinicos.
- Una imagen puede tener una o mas anotaciones expertas.
- Una anotacion pertenece a un experto.
- Un registro exportable debe indicar consenso, confianza y validacion experta.

No ocultar la trazabilidad del dataset. Es parte central del valor academico y tecnico del proyecto.

## Criterios de Aceptacion Visual

Antes de cerrar cambios de UI:

- La app compila con `npm run build` en `frontend/`.
- La app pasa `npm run lint` en `frontend/`.
- Juicio Experto y Dataset se pueden navegar sin errores.
- La vista de Juicio Experto muestra imagen, formulario y resumen del registro.
- La vista Dataset muestra metricas, formatos de exportacion, listado y JSONL.
- No hay texto desbordado en desktop o mobile.
- El resultado sigue pareciendose al mockup base, salvo cambios intencionales.

## No Objetivos Actuales

Por ahora no disenar:

- Landing page publica.
- Dashboard ejecutivo completo.
- Sistema de autenticacion visual completo.
- Entrenamiento de IA.
- Administracion avanzada de usuarios.

La prioridad sigue siendo curacion, anotacion semantica y preparacion confiable del dataset.
