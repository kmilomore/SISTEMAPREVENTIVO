# Contexto — ActaPage

Archivo: `src/pages/ActaPage.tsx`  
Ruta: `#/acta`  
Fuente de datos: Supabase · tabla `public.actas_visita` · bucket storage `actas-visita`

---

## 1. Propósito

Gestor completo de actas de visita del SLEP Colchagua. Permite registrar, consultar y hacer seguimiento de sesiones, acuerdos y compromisos por establecimiento. Cubre cuatro tipos de acta: Asesoría, Observación, Reunión y Solicitud.

---

## 2. Origen de los datos

| Atributo | Valor |
|---|---|
| Tabla principal | `public.actas_visita` |
| Bucket Storage | `actas-visita` |
| Clave primaria | `id` (uuid) |
| Folio autogenerado | `folio` (texto secuencial, generado por trigger en Supabase) |
| Orden de carga | Descendente por `fecha_visita`, luego por `created_at` |

### Rutas en el bucket `actas-visita`

| Tipo de archivo | Ruta |
|---|---|
| PDF del acta | `{año}/{mes}/{id}.pdf` |
| Lista de asistencia | `asistencias/{año}/{mes}/{id}.{ext}` |

---

## 3. Estructura de la tabla `actas_visita`

### Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `folio` | text | Número de folio autogenerado |
| `tipo_acta` | text | `asesoria` / `observacion` / `reunion` / `solicitud` |
| `estado` | text | `Registrada` / `Registrada sin PDF` / `Cerrada` |
| `establecimiento_id` | text | ID del establecimiento (N° de la tabla SLEP) |
| `establecimiento_nombre` | text | Nombre del establecimiento |
| `establecimiento_rbd` | text | RBD del establecimiento |
| `establecimiento_comuna` | text | Comuna |
| `fecha_visita` | date | Fecha de la visita |
| `hora_inicio` | time | Hora de inicio |
| `hora_termino` | time | Hora de término |
| `participantes` | jsonb | Array de `ParticipanteActa` |
| `acuerdos` | jsonb | Array de `AcuerdoActa` |
| `temas_anteriores` | text | Seguimiento de visita previa |
| `actividad_realizada` | text | Descripción de la actividad |
| `pdf_path` | text | Ruta del PDF en Storage |
| `pdf_url` | text | URL pública del PDF |
| `asistencia_path` | text | Ruta del archivo de asistencia en Storage |
| `asistencia_url` | text | URL pública del archivo de asistencia |
| `created_by_nombre` | text | Nombre del registrador |
| `created_at` | timestamptz | Fecha de creación |
| `updated_at` | timestamptz | Fecha de última actualización |

### Tipos internos (TypeScript)

```ts
interface ParticipanteActa {
  nombre: string
  rol_estamento: string
  contacto?: string
}

interface AcuerdoActa {
  descripcion: string
  responsable?: string
  plazo?: string
  estado: 'Pendiente' | 'En proceso' | 'Cumplido'
}
```

---

## 4. Estados del acta

| Estado | Descripción | Color |
|---|---|---|
| `Registrada` | Acta guardada con PDF generado | Azul (`status-info`) |
| `Registrada sin PDF` | Acta guardada, pero falló la generación del PDF | Amarillo (`status-warning`) |
| `Cerrada` | Acta finalizada y cerrada | Verde (`status-success`) |

---

## 5. Tipos de acta

| Clave | Etiqueta |
|---|---|
| `asesoria` | Asesoría |
| `observacion` | Observación |
| `reunion` | Reunión |
| `solicitud` | Solicitud |

---

## 6. Vistas del componente

El componente `ActaPage` maneja tres vistas internas mediante el estado `view`:

```
'list'           → Listado de actas registradas + modal de detalle
'tipo-selector'  → Selector del tipo de acta (paso previo al formulario)
'form'           → Formulario de ingreso del acta
```

---

## 7. Flujo de registro de un acta nueva

```
Clic "Nueva acta"
        │
        ▼
ActaTipoSelector
  usuario elige tipo
        │
        ▼
ActaForm (5 secciones)
  1. Información general (establecimiento, fecha, horario, registrador)
  2. Participantes
  3. Desarrollo de la visita (temas anteriores, actividad realizada)
  4. Acuerdos, medidas y compromisos
  5. Lista de asistencia (opcional — PDF o imagen)
        │
  submit
        │
        ▼
insertActa() → Supabase INSERT → obtiene id + folio
        │
        ├── generarActaPdf() → uploadActaPdf() → updateActaPdf()
        │       error → updateActaEstado('Registrada sin PDF')
        │
        └── si hay archivo de asistencia:
                uploadAsistenciaFile() → updateActaAsistencia()
        │
        ▼
loadActas() → volver a 'list' → mostrar mensaje resultado
```

---

## 8. Modal de detalle del acta (`ActaDetailModal`)

Se abre al hacer clic en "Ver" en la fila de la tabla. La URL se actualiza con `#/acta?actaId=<uuid>` para permitir deep-linking y navegación con el historial del navegador.

### Secciones del modal

| # | Sección | Contenido |
|---|---|---|
| 1 | Establecimiento | Nombre, RBD, Comuna |
| 2 | Fecha y horario | Fecha, hora inicio, hora término, registrado por |
| 3 | Participantes | Tabla con nombre, rol/estamento, contacto |
| 4 | Desarrollo de la visita | Temas anteriores, actividad realizada |
| 5 | Lista de asistencia | Ver archivo subido o subir uno nuevo (PDF/imagen) |
| 6 | Acuerdos / Compromisos | Listado con estado, responsable y plazo |

### Acciones del footer

| Acción | Condición | Descripción |
|---|---|---|
| Abrir PDF | `pdf_url` existe | Abre el PDF en nueva pestaña |
| Generar/Reintentar PDF | `pdf_url` ausente | Genera el PDF, lo sube y descarga |
| Cerrar | Siempre | Cierra el modal y limpia el hash |

### Lista de asistencia en el modal

- Si `asistencia_url` existe: muestra botón "Ver archivo" + opción "Reemplazar"
- Si no existe: muestra input de carga con spinner durante el upload
- Formatos aceptados: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`
- Al subir exitosamente, el estado del acta se actualiza en memoria sin recargar la lista completa

---

## 9. Deep-linking con hash

La página sincroniza el modal de detalle con la URL usando el fragmento de hash:

```
#/acta              → vista de listado (sin modal)
#/acta?actaId=<id>  → abre automáticamente el modal del acta con ese ID
```

Esto permite compartir el link directo a un acta y que el modal se abra al cargar la página.

---

## 10. Servicios y librerías utilizadas

| Módulo | Función | Descripción |
|---|---|---|
| `lib/actasService.ts` | `fetchActas` | Carga todas las actas ordenadas |
| `lib/actasService.ts` | `insertActa` | Inserta una nueva acta en Supabase |
| `lib/actasService.ts` | `updateActaPdf` | Actualiza `pdf_path` y `pdf_url` |
| `lib/actasService.ts` | `updateActaEstado` | Actualiza el campo `estado` |
| `lib/actasService.ts` | `updateActaAsistencia` | Actualiza `asistencia_path` y `asistencia_url` |
| `lib/pdfActaService.ts` | `generarActaPdf` | Genera los bytes del PDF del acta |
| `lib/pdfActaService.ts` | `descargarActaPdf` | Descarga el PDF en el navegador |
| `lib/storageActasService.ts` | `uploadActaPdf` | Sube el PDF al bucket `actas-visita` |
| `lib/storageActasService.ts` | `uploadAsistenciaFile` | Sube el archivo de asistencia al mismo bucket |

---

## 11. Componentes del módulo

| Componente | Archivo | Propósito |
|---|---|---|
| `ActaPage` | `src/pages/ActaPage.tsx` | Orquestador principal: vistas, estado global, flujo de submit |
| `ActaTipoSelector` | `components/actas/ActaTipoSelector.tsx` | Selección del tipo de acta |
| `ActaForm` | `components/actas/ActaForm.tsx` | Formulario de ingreso (5 secciones) |
| `ActaDetailModal` | `components/actas/ActaDetailModal.tsx` | Modal de detalle y acciones sobre el acta |
| `EstablecimientoSelect` | `components/actas/EstablecimientoSelect.tsx` | Selector autocomplete de establecimiento SLEP |
| `ParticipantesFieldArray` | `components/actas/ParticipantesFieldArray.tsx` | Lista dinámica de participantes |
| `AcuerdosFieldArray` | `components/actas/AcuerdosFieldArray.tsx` | Lista dinámica de acuerdos y compromisos |
| `AutoResizeTextarea` | `components/actas/AutoResizeTextarea.tsx` | Textarea que crece automáticamente |

---

## 12. Funcionalidades pendientes (próximos pasos)

### 12.1 Firma digital en la lista de asistencia

Integrar una solución de firma en pantalla (canvas) para que los participantes puedan firmar digitalmente la lista de asistencia desde un tablet o dispositivo móvil.

### 12.2 Edición de actas existentes

Permitir editar los campos de un acta ya registrada (participantes, acuerdos, actividad realizada) con regeneración automática del PDF.

### 12.3 Cierre de actas y seguimiento de compromisos

Agregar acción "Cerrar acta" que cambie el estado a `Cerrada` y bloquee ediciones. Vista de compromisos pendientes/vencidos cruzando fecha actual con `plazo` de cada `AcuerdoActa`.

### 12.4 Filtros en el listado

Filtros por `tipo_acta`, `estado`, `establecimiento_comuna` y rango de fechas.

### 12.5 Exportación

Exportar el listado filtrado a CSV o Excel con todos los campos del acta.

### 12.6 Notificaciones de vencimiento

Envío de alertas cuando acuerdos con plazo definido estén próximos a vencer o ya vencidos.
