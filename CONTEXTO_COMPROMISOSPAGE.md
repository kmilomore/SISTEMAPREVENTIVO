# Contexto — CompromisosPage

Archivo: `src/pages/CompromisosPage.tsx`  
Ruta: `#/compromisos`  
Fuente de datos: Supabase · tablas `public.compromisos` + `public.comentarios_compromisos`  
Schema SQL: `supabase/compromisos_schema.sql`

---

## 1. Propósito

Gestor de seguimiento de compromisos impuestos a los establecimientos educacionales del SLEP Colchagua. Permite:

- visualizar todos los compromisos vigentes en una tabla filtrable;
- cambiar el estado de un compromiso (Pendiente / En proceso / Cumplido / Vencido);
- registrar notas de seguimiento tipo historial con autor y fecha;
- identificar visualmente compromisos vencidos por plazo superado;
- conocer de un vistazo el resumen cuantitativo mediante chips KPI en el header.

Un compromiso es una obligación formal derivada de un acuerdo registrado en un acta de visita. Los compromisos son entidades independientes con ciclo de vida propio: tienen su propio estado, su historial de comentarios normalizado en tabla separada, y pueden actualizarse sin tocar el acta de origen.

---

## 2. Origen de los datos

| Atributo | Valor |
|---|---|
| Tabla principal | `public.compromisos` |
| Tabla de comentarios | `public.comentarios_compromisos` |
| Clave primaria | `id` (uuid) |
| Orden de carga | Descendente por `created_at` |
| Sin Supabase configurado | Muestra banner de configuración — sin datos mock |

Los compromisos **no se crean manualmente desde la app**. Se generan automáticamente desde los acuerdos del acta vía trigger en Supabase (ver sección 4).

---

## 3. Estructura de tablas

### Tabla `public.compromisos`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único del compromiso |
| `acta_id` | uuid FK → `actas_visita.id` (nullable, set null on delete) | Acta de origen |
| `acta_folio` | text (nullable) | Folio visible del acta de origen |
| `establecimiento_id` | text | ID del establecimiento (N° SLEP) |
| `establecimiento_nombre` | text | Nombre del establecimiento |
| `establecimiento_comuna` | text | Comuna del establecimiento |
| `descripcion` | text | Texto completo del compromiso |
| `responsable` | text (nullable) | Persona o cargo responsable |
| `plazo` | date (nullable) | Fecha límite de cumplimiento |
| `estado` | text | `Pendiente` / `En proceso` / `Cumplido` / `Vencido` (check constraint) |
| `created_at` | timestamptz | Fecha de creación (default `now()`) |
| `updated_at` | timestamptz | Fecha de última actualización (auto-actualizado por trigger) |

### Tabla `public.comentarios_compromisos`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Identificador único del comentario |
| `compromiso_id` | uuid FK → `compromisos.id` (cascade delete) | Compromiso al que pertenece |
| `texto` | text | Cuerpo del comentario |
| `autor` | text | Nombre del autor (default `'Unidad de Prevención'`) |
| `created_at` | timestamptz | Fecha de creación (default `now()`) |

### Índices

| Índice | Tabla | Campo |
|---|---|---|
| `compromisos_estado_idx` | `compromisos` | `estado` |
| `compromisos_acta_id_idx` | `compromisos` | `acta_id` |
| `compromisos_establecimiento_id_idx` | `compromisos` | `establecimiento_id` |
| `compromisos_plazo_idx` | `compromisos` | `plazo` (where not null) |
| `comentarios_compromisos_compromiso_id_idx` | `comentarios_compromisos` | `compromiso_id` |

### Tipos TypeScript — `src/types/compromisos.ts`

```ts
export type EstadoCompromiso = 'Pendiente' | 'En proceso' | 'Cumplido' | 'Vencido'

export interface ComentarioCompromiso {
  id: string
  compromiso_id: string
  texto: string
  autor: string
  created_at: string   // timestamptz desde Supabase
}

export interface Compromiso {
  id: string
  acta_id?: string | null
  acta_folio?: string | null
  establecimiento_id: string
  establecimiento_nombre: string
  establecimiento_comuna: string
  descripcion: string
  responsable?: string | null
  plazo?: string | null
  estado: EstadoCompromiso
  comentarios: ComentarioCompromiso[]  // mapeado desde comentarios_compromisos
  created_at: string
  updated_at: string
}
```

---

## 4. Ciclo de vida de un compromiso

### Creación automática desde actas (trigger)

Los compromisos **no se insertan desde la app**. Supabase los crea automáticamente mediante el trigger `trg_actas_visita_sync_compromisos`, que se dispara `AFTER INSERT` en `actas_visita`:

```
Usuario registra acta en ActaPage (con acuerdos)
        │
        ▼
INSERT en public.actas_visita  ← insertActa() en actasService.ts
        │
        ▼  (trigger automático en Supabase)
trg_actas_visita_sync_compromisos
  → lee NEW.acuerdos (JSONB array)
  → INSERT en public.compromisos — uno por cada acuerdo
        │
        ▼
Compromiso aparece en #/compromisos al recargar
```

El trigger **no se activa en UPDATE**, para no pisar cambios de estado ya hechos en el módulo de compromisos.

La función del trigger (`sync_acuerdos_to_compromisos`) extrae de cada elemento del JSONB:
- `descripcion` → campo `descripcion`
- `responsable` → campo `responsable` (null si vacío)
- `plazo` → se castea a `date` con detección de tres formatos (ver sección 4.1); null si no reconocido
- `estado` → se valida contra los valores permitidos; default `'Pendiente'`

### 4.1 Formatos de fecha soportados para `plazo`

Los acuerdos en `actas_visita.acuerdos` pueden traer el plazo en tres formatos distintos. El CASE statement en el trigger y en el bloque de migración los detecta por regex:

| Regex | Formato | Conversión |
|---|---|---|
| `^\d{4}-\d{2}-\d{2}$` | ISO `YYYY-MM-DD` | cast directo a `date` |
| `^\d{2}/\d{2}/\d{4}$` | Chileno con barras `DD/MM/YYYY` | `to_date(..., 'DD/MM/YYYY')` |
| `^\d{2}-\d{2}-\d{4}$` | Chileno con guiones `DD-MM-YYYY` | `to_date(..., 'DD-MM-YYYY')` |

Cualquier otro valor (texto libre, vacío) queda como `null`.

> **Historial del bug**: la migración inicial solo manejaba `YYYY-MM-DD`. Los datos reales del SLEP usan `DD/MM/YYYY` y `DD-MM-YYYY`, por lo que todos los `plazo` migraron como `null`. Fix aplicado en dos pasos:
> 1. Actualización del schema (trigger + bloque `DO $$`) para manejar los tres formatos.
> 2. Query de corrección ejecutada una sola vez en el SQL Editor de Supabase para backfill de registros existentes:
> ```sql
> update public.compromisos c
> set plazo = case
>   when acuerdo->>'plazo' ~ '^\d{4}-\d{2}-\d{2}$' then (acuerdo->>'plazo')::date
>   when acuerdo->>'plazo' ~ '^\d{2}/\d{2}/\d{4}$' then to_date(acuerdo->>'plazo', 'DD/MM/YYYY')
>   when acuerdo->>'plazo' ~ '^\d{2}-\d{2}-\d{4}$' then to_date(acuerdo->>'plazo', 'DD-MM-YYYY')
>   else null end,
>   updated_at = now()
> from public.actas_visita a, jsonb_array_elements(a.acuerdos) as acuerdo
> where c.acta_id = a.id and c.plazo is null
>   and trim(acuerdo->>'descripcion') = c.descripcion
>   and nullif(trim(acuerdo->>'plazo'), '') is not null;
> ```

### Migración de acuerdos históricos

El script incluye un bloque `DO $$` que se ejecuta **una sola vez** (cuando `compromisos` está vacía) y migra todos los acuerdos de actas ya existentes en `actas_visita`. Esto sincroniza el histórico sin crear duplicados.

### Actualización de estado

El usuario cambia el estado directamente en el modal de `CompromisosPage` → `updateCompromisoEstado()` → UPDATE en `compromisos`. El trigger `compromisos_set_updated_at` actualiza `updated_at` automáticamente.

### Historial de comentarios

Cada comentario es un INSERT en `comentarios_compromisos` con `compromiso_id` como FK. No se sobreescriben comentarios anteriores: la tabla crece append-only.

---

## 5. Estados del compromiso

| Estado | Descripción | Color visual |
|---|---|---|
| `Pendiente` | Compromiso registrado, aún sin acción | Amarillo (`status-warning`) |
| `En proceso` | Se está trabajando en el cumplimiento | Azul (`status-info`) |
| `Cumplido` | Compromiso completado y verificado | Verde (`status-success`) |
| `Vencido` | Plazo superado sin cumplimiento | Rojo (`status-error`) |

### Detección visual de vencimiento

El campo `plazo` se compara con la fecha actual en cliente. Si ya pasó y el estado no es `Cumplido`, el texto del plazo se muestra en rojo. Es una señal visual — el estado en BD no cambia automáticamente.

```ts
function isPlazoVencido(plazo?: string | null) {
  if (!plazo) return false
  return new Date(plazo + 'T23:59:59') < new Date()
}
```

---

## 6. Servicio de datos — `src/lib/compromisosService.ts`

### Funciones exportadas

| Función | Descripción |
|---|---|
| `fetchCompromisos()` | SELECT `*` en `compromisos` con nested select de `comentarios_compromisos`. Retorna `{ data, error }`. |
| `updateCompromisoEstado(id, estado)` | UPDATE `estado` + `updated_at` en `compromisos`. |
| `addComentario(compromiso_id, texto, autor)` | INSERT en `comentarios_compromisos`. Retorna `{ data: ComentarioCompromiso, error }`. |

### Sin Supabase

Las tres funciones retornan `{ data: [], error: 'Supabase no inicializado.' }` o `{ data: null, error: ... }`. La página muestra un banner de configuración. No hay fallback a datos mock.

### Query de carga (nested select)

```ts
supabase
  .from('compromisos')
  .select(`
    *,
    comentarios_compromisos (
      id, compromiso_id, texto, autor, created_at
    )
  `)
  .order('created_at', { ascending: false })
```

El resultado de `comentarios_compromisos` se mapea al campo `comentarios` del tipo `Compromiso`, ordenado cronológicamente por `created_at`.

---

## 7. Estructura del componente `CompromisosPage`

### Estado local

| Variable | Tipo | Propósito |
|---|---|---|
| `compromisos` | `Compromiso[]` | Lista completa cargada desde el servicio |
| `loading` | `boolean` | Muestra skeletons durante la carga inicial |
| `fetchError` | `string \| null` | Error de carga (Supabase no configurado o fallo de red) |
| `filtroEscuela` | `string` | Texto libre para filtrar por nombre de establecimiento |
| `filtroComuna` | `string` | Valor del select de comunas |
| `filtroEstado` | `EstadoCompromiso \| ''` | Valor del select de estados |
| `selected` | `Compromiso \| null` | Compromiso activo en el modal |
| `sortKey` | `SortKey` | Columna activa de ordenamiento (default: `'plazo'`) |
| `sortDir` | `SortDir` | Dirección del sort: `'asc'` o `'desc'` (default: `'asc'`) |

### Datos derivados (useMemo)

| Variable | Derivado de | Propósito |
|---|---|---|
| `comunas` | `compromisos` | Lista única de comunas para el select de filtro |
| `filtered` | `compromisos + filtros + sort` | Subconjunto filtrado y ordenado por la columna activa |
| `counts` | `compromisos` | Conteos por estado para los KPI chips |

### Flujo de carga

```
Montaje del componente
        │
        ▼
fetchCompromisos()
  ├── Supabase OK + datos   → setCompromisos(data)
  ├── Supabase OK + vacío   → setCompromisos([]) — tabla existe pero sin registros
  └── Error / sin Supabase  → setFetchError(msg) → render banner configuración
        │
        ▼
setLoading(false) → render tabla o banner
```

---

## 8. Filtros y ordenamiento

### Filtros

| Filtro | Tipo | Campo filtrado |
|---|---|---|
| Búsqueda por establecimiento | Input texto libre | `establecimiento_nombre` (insensible a mayúsculas) |
| Filtro por comuna | Select dropdown | `establecimiento_comuna` (coincidencia exacta) |
| Filtro por estado | Select dropdown | `estado` (coincidencia exacta) |

Los tres filtros se aplican en paralelo (AND lógico). El botón "Limpiar filtros" aparece cuando al menos uno está activo.

### Ordenamiento por columnas

Todas las columnas de la tabla son clickeables para ordenar. La lógica está en el `useMemo` de `filtered` — primero filtra, luego ordena el resultado.

| Columna | `SortKey` | Criterio de orden |
|---|---|---|
| Compromiso | `'descripcion'` | `localeCompare` con locale `es` |
| Establecimiento | `'establecimiento_nombre'` | `localeCompare` con locale `es` |
| Responsable | `'responsable'` | `localeCompare`; null tratado como `''` |
| Plazo | `'plazo'` | Comparación de string ISO; null va siempre al final (sin importar dirección) |
| Estado | `'estado'` | Orden lógico: Pendiente(0) → En proceso(1) → Cumplido(2) → Vencido(3) |

**Comportamiento:** primer click en una columna → `asc`; segundo click → `desc`. Click en columna distinta → resetea a `asc`. La columna activa muestra flecha azul (↑/↓); las inactivas muestran ⇅ gris.

**Tipos:**
```ts
type SortKey = 'descripcion' | 'establecimiento_nombre' | 'responsable' | 'plazo' | 'estado'
type SortDir = 'asc' | 'desc'
```

---

## 9. Modal de edición — `CompromisoModal`

Se monta cuando `selected !== null`. El overlay cierra el modal al hacer clic fuera.

### Secciones del modal

| # | Sección | Contenido |
|---|---|---|
| 1 | Header | Descripción completa + folio del acta de origen |
| 2 | Metadata | Establecimiento, responsable, plazo (en rojo si vencido) |
| 3 | Cambio de estado | Botones de selección con color por estado |
| 4 | Historial | Lista cronológica de `comentarios_compromisos` con avatar, autor y fecha |
| 5 | Nuevo comentario | Textarea + campo autor + botón Agregar |

### Flujo de cambio de estado

```
Usuario selecciona nuevo estado
        │
estadoChanged = true → aparece botón "Guardar cambio de estado"
        │
        ▼
updateCompromisoEstado(id, nuevoEstado)
        │
        ▼
onUpdated(compromiso actualizado)
  → setCompromisos(prev.map(...))
  → setSelected(updated)
```

### Flujo de agregar comentario

```
Usuario escribe texto + nombre (opcional)
        │
        ▼
addComentario(compromiso.id, texto, autor)
  → INSERT en comentarios_compromisos
  → retorna ComentarioCompromiso con id y created_at de Supabase
        │
        ▼
setComentarios([...comentarios, data])
onUpdated(compromiso con comentarios actualizados)
```

El comentario recién insertado usa el `created_at` real de Supabase — no se genera un ID en cliente.

---

## 10. KPI chips del header

Se calculan sobre `compromisos` completo (no sobre `filtered`), para mostrar el panorama global independiente de los filtros.

| Chip | Color | Valor |
|---|---|---|
| Total | Gris | `compromisos.length` |
| Pendientes | Ámbar | estado === `'Pendiente'` |
| En proceso | Azul | estado === `'En proceso'` |
| Cumplidos | Verde | estado === `'Cumplido'` |
| Vencidos | Rojo | estado === `'Vencido'` |

Los chips solo se muestran cuando `loading` es `false` y hay al menos un compromiso.

---

## 11. Integración en el shell

### routes.ts

```ts
export type AppRouteId = 'database' | 'acta' | 'metricas' | 'compromisos'

{
  id: 'compromisos',
  label: 'Compromisos',
  description: 'Seguimiento y gestión de compromisos impuestos por establecimiento.',
}
```

### AppShell.tsx

```ts
pageTitle.compromisos = 'Gestor de compromisos'
pageTag.compromisos   = 'Seguimiento'

// Ícono en el menú lateral:
<CommitmentsIcon />   // SVG — checklist con marca de verificación en cuadro

// Render condicional:
route === 'compromisos' ? <CompromisosPage /> : ...
```

---

## 12. Schema SQL — `supabase/compromisos_schema.sql`

El archivo contiene en orden:

| Bloque | Descripción |
|---|---|
| `set_updated_at()` | Función trigger reutilizable para `updated_at` |
| `create table compromisos` | Tabla principal con check constraint en `estado` |
| Índices | 4 índices en `compromisos` |
| `compromisos_set_updated_at` | Trigger BEFORE UPDATE en `compromisos` |
| `create table comentarios_compromisos` | Tabla de historial con FK cascade |
| Índice | 1 índice en `comentarios_compromisos` |
| `sync_acuerdos_to_compromisos()` | Función trigger que lee `acuerdos` JSONB y hace INSERT en `compromisos` con detección de 3 formatos de fecha |
| `trg_actas_visita_sync_compromisos` | Trigger AFTER INSERT en `actas_visita` |
| `DO $$` migración | Migra acuerdos históricos una sola vez si `compromisos` está vacía; misma lógica de 3 formatos de fecha |

**RLS deshabilitado en `compromisos` y `comentarios_compromisos`** — activar cuando se implemente autenticación.  
**`actas_visita` tiene RLS activo** — no afecta el SQL Editor (corre como postgres) pero sí afecta las llamadas desde el cliente JS con anon key.

---

## 13. Componentes internos del módulo

| Componente / función | Propósito |
|---|---|
| `CompromisosPage` | Orquestador: carga, filtros, ordenamiento, tabla, estado del modal, banner de error |
| `CompromisoModal` | Modal: metadata, cambio de estado, historial de comentarios, nuevo comentario |
| `HeaderCard` | Header estático usado en el banner de error (sin Supabase) |
| `KpiChip` | Chip de indicador con colores por categoría |
| `SortableTh` | `<th>` clicable que llama `onSort(colKey)` y renderiza `SortIcon` |
| `SortIcon` | SVG de flecha: ⇅ gris (inactivo) / ↑↓ azul (activo según `sortDir`) |
| `estadoChip(estado)` | Clase CSS del chip de estado en la tabla |
| `estadoBtnClass(estado, selected)` | Clase CSS del botón de selección en el modal |
| `isPlazoVencido(plazo)` | Compara plazo con fecha actual (incluye fin del día) |
| `formatFecha(dateStr)` | Formatea ISO date o timestamptz a `dd/mm/yyyy` en `es-CL` |
| `SearchIcon` | SVG — lupa |
| `CloseIcon` | SVG — X para cerrar modal |
| `SendIcon` | SVG — avión de papel para botón "Agregar" |

---

## 14. Hallazgos y limitaciones actuales

### 14.0 Bug resuelto: `plazo` mostraba `—` en todos los registros

**Causa**: la migración inicial (`DO $$`) corrió antes de que se agregara soporte para los formatos de fecha chilenos. El CASE statement solo cubría `YYYY-MM-DD`, por lo que todos los registros con plazo en `DD/MM/YYYY` o `DD-MM-YYYY` se insertaron con `plazo = null`.

**Fix aplicado**:
- Schema actualizado con tres formatos en el trigger y en el bloque de migración.
- Query de backfill ejecutado una sola vez en el SQL Editor (ver sección 4.1).
- La tabla `actas_visita` tiene RLS activo, pero el SQL Editor de Supabase ejecuta como rol `postgres` (superusuario) y lo bypasea automáticamente.

### 14.1 Sin paginación

La tabla carga todos los compromisos en memoria. Con volúmenes grandes (>300 registros) se recomienda agregar paginación o scroll infinito.

### 14.2 Autor del comentario sin autenticación

El campo "Tu nombre" es un input libre. Una vez implementado el login debe autocompletarse con el usuario autenticado y deshabilitarse.

### 14.3 Estado `Vencido` no se actualiza automáticamente en BD

El cambio a `Vencido` es manual. El componente solo lo resalta visualmente. Para automatizarlo en Supabase se necesita una función edge o cron job:

```sql
update public.compromisos
set estado = 'Vencido', updated_at = now()
where plazo < current_date
  and estado not in ('Cumplido', 'Vencido');
```

### 14.4 Trigger solo en INSERT, no en UPDATE de acuerdos

Si se edita una acta existente y se agregan nuevos acuerdos, esos acuerdos **no generan compromisos nuevos** automáticamente. El trigger solo se dispara al insertar un acta nueva.

---

## 15. Funcionalidades pendientes (próximos pasos)

### 15.1 Vinculación bidireccional con Actas

Desde la fila del compromiso, botón "Ver acta" que navegue a `#/acta?actaId=<acta_id>`. El campo `acta_id` ya está poblado por el trigger.

### 15.2 Filtro por plazo

Selector de rango de fechas para mostrar solo compromisos que vencen en un período (ej: "esta semana", "este mes").

### 15.3 Cambio de estado masivo

Selección múltiple de filas para cambiar el estado de varios compromisos en una sola operación.

### 15.4 Exportación CSV

Botón que descargue el listado filtrado activo:

```ts
const csv = filtered.map(c =>
  [c.acta_folio, c.establecimiento_nombre, c.establecimiento_comuna,
   c.descripcion, c.responsable, c.plazo, c.estado].join(';')
).join('\n')
```

### 15.5 Notificaciones de vencimiento próximo

Banner de alerta cuando existan compromisos con plazo en los próximos 7 días:

```ts
const proximos = compromisos.filter(c => {
  if (c.estado === 'Cumplido' || !c.plazo) return false
  const dias = (new Date(c.plazo).getTime() - Date.now()) / 86_400_000
  return dias >= 0 && dias <= 7
})
```

### 15.6 Trigger en UPDATE de actas

Extender `sync_acuerdos_to_compromisos` para detectar acuerdos nuevos en un UPDATE de `actas_visita` y crearlos como compromisos sin duplicar los existentes.

### 15.7 Integración con Métricas

Que `MetricasPage` lea desde `public.compromisos` en lugar de derivar compromisos del JSONB de `actas_visita`, para mayor precisión y evolución temporal del estado.

---

## 16. Dependencias del módulo

| Módulo | Origen | Uso |
|---|---|---|
| `react` | externo | `useState`, `useEffect`, `useCallback`, `useMemo` |
| `types/compromisos` | interno | `Compromiso`, `ComentarioCompromiso`, `EstadoCompromiso` |
| `lib/compromisosService` | interno | `fetchCompromisos`, `updateCompromisoEstado`, `addComentario` |
| `lib/supabase` | interno | cliente Supabase (consumido dentro del servicio) |

Sin dependencias externas de UI. Toda la presentación usa Tailwind CSS y clases utilitarias del portal (`panel-card-strong`, `table-shell`, `status-chip`, `btn-primary`, `skeleton`).
