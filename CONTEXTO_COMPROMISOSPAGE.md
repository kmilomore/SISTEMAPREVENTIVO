# Contexto — CompromisosPage

Archivo: `src/pages/CompromisosPage.tsx`  
Ruta: `#/compromisos`  
Fuente de datos: Supabase · tabla `public.compromisos` · fallback automático a datos mock

---

## 1. Propósito

Gestor de seguimiento de compromisos impuestos a los establecimientos educacionales del SLEP Colchagua. Permite:

- visualizar todos los compromisos vigentes en una tabla filtrable;
- cambiar el estado de un compromiso (Pendiente / En proceso / Cumplido / Vencido);
- registrar notas de seguimiento tipo historial con autor y fecha;
- identificar visualmente compromisos vencidos por plazo superado;
- conocer de un vistazo el resumen cuantitativo mediante chips KPI en el header.

Un compromiso es una obligación formal derivada de un acuerdo registrado en un acta de visita. A diferencia de los acuerdos internos del acta (campo `acuerdos` en `actas_visita`), los compromisos en este módulo son entidades independientes con ciclo de vida propio, historial de comentarios y actualización de estado desacoplada del acta original.

---

## 2. Origen de los datos

| Atributo | Valor |
|---|---|
| Tabla principal | `public.compromisos` |
| Clave primaria | `id` (uuid o texto) |
| Orden de carga | Descendente por `created_at` |
| Modo fallback | Si Supabase no está configurado O si la tabla no existe, se usan los datos mock de `src/data/mockData.ts` |
| Indicador de modo | El componente recibe `isMock: boolean` del servicio y muestra un chip "Modo demo" si corresponde |

---

## 3. Estructura de la tabla `compromisos`

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text / uuid PK | Identificador único del compromiso |
| `acta_id` | text (nullable) | UUID del acta de origen en `actas_visita` |
| `acta_folio` | text (nullable) | Folio visible del acta de origen |
| `establecimiento_id` | text | ID del establecimiento (N° SLEP) |
| `establecimiento_nombre` | text | Nombre del establecimiento |
| `establecimiento_comuna` | text | Comuna del establecimiento |
| `descripcion` | text | Texto completo del compromiso |
| `responsable` | text (nullable) | Persona o cargo responsable de cumplirlo |
| `plazo` | text (nullable) | Fecha límite de cumplimiento (ISO 8601: `YYYY-MM-DD`) |
| `estado` | text | `Pendiente` / `En proceso` / `Cumplido` / `Vencido` |
| `comentarios` | jsonb | Array de `ComentarioCompromiso` (historial de seguimiento) |
| `created_at` | text / timestamptz | Fecha de creación |
| `updated_at` | text / timestamptz | Fecha de última actualización |

### Tipos TypeScript — `src/types/compromisos.ts`

```ts
export type EstadoCompromiso = 'Pendiente' | 'En proceso' | 'Cumplido' | 'Vencido'

export interface ComentarioCompromiso {
  id: string       // generado en cliente: `cc-{timestamp}-{random}`
  texto: string    // cuerpo del comentario
  autor: string    // nombre del autor (default: 'Unidad de Prevención')
  fecha: string    // ISO 8601 YYYY-MM-DD
}

export interface Compromiso {
  id: string
  acta_id?: string
  acta_folio?: string
  establecimiento_id: string
  establecimiento_nombre: string
  establecimiento_comuna: string
  descripcion: string
  responsable?: string
  plazo?: string
  estado: EstadoCompromiso
  comentarios: ComentarioCompromiso[]
  created_at: string
  updated_at: string
}
```

---

## 4. Estados del compromiso

| Estado | Descripción | Color visual |
|---|---|---|
| `Pendiente` | Compromiso registrado, aún sin acción | Amarillo (`status-warning`) |
| `En proceso` | Se está trabajando en el cumplimiento | Azul (`status-info`) |
| `Cumplido` | Compromiso completado y verificado | Verde (`status-success`) |
| `Vencido` | Plazo superado sin cumplimiento | Rojo (`status-error`) |

### Detección automática de vencimiento (solo visual)

El campo `plazo` se compara con la fecha actual en cliente. Si la fecha ya pasó y el estado **no** es `Cumplido`, el texto del plazo se muestra en rojo. Esto es una señal visual, no un cambio automático de estado: el estado sigue siendo el que tiene en base de datos.

```ts
function isPlazoVencido(plazo?: string) {
  if (!plazo) return false
  return new Date(plazo) < new Date()
}
```

---

## 5. Servicio de datos — `src/lib/compromisosService.ts`

### Funciones exportadas

| Función | Descripción |
|---|---|
| `fetchCompromisos()` | Carga todos los compromisos. Retorna `{ data, error, isMock }`. Si Supabase no está inicializado o falla, retorna datos mock con `isMock: true`. |
| `updateCompromisoEstado(id, estado)` | Actualiza el campo `estado` y `updated_at` en Supabase. Si no hay Supabase, retorna sin error (el cambio persiste solo en estado local de React). |
| `updateCompromisoComentarios(id, comentarios)` | Actualiza el array `comentarios` completo y `updated_at` en Supabase. Mismo comportamiento sin conexión. |

### Lógica de fallback

```ts
// 1. Sin Supabase configurado → mock inmediato
if (!supabase) return { data: crmData.compromisos, error: null, isMock: true }

// 2. Supabase configurado pero tabla no existe (error de Supabase) → mock como fallback
if (error) return { data: crmData.compromisos, error: null, isMock: true }

// 3. Supabase OK → datos reales
return { data: data as Compromiso[], error: null, isMock: false }
```

### Escritura sin Supabase

Cuando `supabase` es `null`, las funciones de escritura retornan `{ error: null }` sin hacer nada. El componente aplica el cambio localmente en su estado React, por lo que la UI se actualiza pero no persiste entre sesiones.

---

## 6. Estructura del componente `CompromisosPage`

### Estado local

| Variable | Tipo | Propósito |
|---|---|---|
| `compromisos` | `Compromiso[]` | Lista completa cargada desde el servicio |
| `loading` | `boolean` | Muestra skeletons durante la carga inicial |
| `isMock` | `boolean` | Controla si se muestra el chip "Modo demo" |
| `filtroEscuela` | `string` | Texto libre para filtrar por nombre de establecimiento |
| `filtroComuna` | `string` | Valor del select de comunas |
| `filtroEstado` | `EstadoCompromiso \| ''` | Valor del select de estados |
| `selected` | `Compromiso \| null` | Compromiso activo en el modal |

### Datos derivados (useMemo)

| Variable | Derivado de | Propósito |
|---|---|---|
| `comunas` | `compromisos` | Lista única de comunas, ordenada alfabéticamente, para el select de filtro |
| `filtered` | `compromisos + filtros` | Subconjunto de compromisos que pasa los tres filtros activos |
| `counts` | `compromisos` | Conteos por estado para los chips KPI del header |

### Flujo de carga

```
Montaje del componente
        │
        ▼
fetchCompromisos()
  ├── Supabase OK        → datos reales, isMock: false
  └── Sin Supabase / error → datos mock, isMock: true
        │
        ▼
setCompromisos(data) + setIsMock(mock) + setLoading(false)
        │
        ▼
Render: KPI chips + filtros + tabla
```

---

## 7. Filtros de la tabla

| Filtro | Tipo | Campo filtrado |
|---|---|---|
| Búsqueda por establecimiento | Input texto libre | `establecimiento_nombre` (insensible a mayúsculas) |
| Filtro por comuna | Select dropdown | `establecimiento_comuna` (coincidencia exacta) |
| Filtro por estado | Select dropdown | `estado` (coincidencia exacta) |

Los tres filtros se aplican en paralelo (AND lógico). El botón "Limpiar filtros" aparece cuando al menos uno está activo y resetea los tres a la vez.

---

## 8. Modal de edición — `CompromisoModal`

Se monta cuando `selected !== null`. El overlay (`backdrop-blur-sm`) cierra el modal al hacer clic fuera.

### Secciones del modal

| # | Sección | Contenido |
|---|---|---|
| 1 | Header | Descripción completa del compromiso + folio del acta de origen |
| 2 | Metadata | Establecimiento, responsable, plazo (en rojo si está vencido) |
| 3 | Cambio de estado | Botones de selección (Pendiente / En proceso / Cumplido / Vencido) |
| 4 | Historial | Lista cronológica de comentarios con avatar, autor y fecha |
| 5 | Nuevo comentario | Textarea + campo autor + botón Agregar |

### Flujo de cambio de estado

```
Usuario selecciona nuevo estado (botón cambia de apariencia)
        │
estadoChanged = true → aparece botón "Guardar cambio de estado"
        │
        ▼
updateCompromisoEstado(id, nuevoEstado)   ← Supabase o no-op
        │
        ▼
onUpdated(compromiso actualizado)        ← propaga a CompromisosPage
        │
        ▼
setCompromisos(prev.map(c => c.id === id ? updated : c))
setSelected(updated)
```

### Flujo de agregar comentario

```
Usuario escribe texto + nombre (opcional)
        │
        ▼
Clic "Agregar"
        │
        ▼
Construye ComentarioCompromiso {
  id: `cc-{Date.now()}-{random}`,
  texto, autor (default 'Unidad de Prevención'), fecha: today
}
        │
        ▼
nuevosComentarios = [...comentarios, nuevo]
updateCompromisoComentarios(id, nuevosComentarios)   ← Supabase o no-op
        │
        ▼
setComentarios(nuevosComentarios)
onUpdated(compromiso con comentarios actualizados)
```

---

## 9. KPI chips del header

Los chips se calculan en `useMemo` sobre el array completo `compromisos` (no sobre `filtered`), para mostrar siempre el panorama global independiente de los filtros activos.

| Chip | Color | Valor |
|---|---|---|
| Total | Gris neutro | `compromisos.length` |
| Pendientes | Ámbar | `compromisos.filter(c => c.estado === 'Pendiente').length` |
| En proceso | Azul | `compromisos.filter(c => c.estado === 'En proceso').length` |
| Cumplidos | Verde | `compromisos.filter(c => c.estado === 'Cumplido').length` |
| Vencidos | Rojo | `compromisos.filter(c => c.estado === 'Vencido').length` |

---

## 10. Integración en el shell

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
route === 'database'    ? <DatabasePage />
  : route === 'acta'    ? <ActaPage />
  : route === 'compromisos' ? <CompromisosPage />
  : <MetricasPage />
```

### Icono `CommitmentsIcon`

```tsx
function CommitmentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
```

---

## 11. Datos mock — `src/data/mockData.ts`

Los datos demo incluyen 5 compromisos que cubren los tres establecimientos mock, los cuatro estados posibles y distintos escenarios de plazo:

| ID | Establecimiento | Estado | Plazo | Notas |
|---|---|---|---|---|
| `com-01` | Escuela San Fernando Norte | En proceso | 2026-05-15 | 1 comentario |
| `com-02` | Escuela San Fernando Norte | Pendiente | 2026-06-01 | Sin comentarios |
| `com-03` | Liceo Técnico Placilla | Vencido | 2026-04-28 | 1 comentario |
| `com-04` | Liceo Técnico Placilla | Pendiente | 2026-05-30 | Sin comentarios |
| `com-05` | Escuela Rural Nancagua | Cumplido | 2026-04-19 | 1 comentario |

---

## 12. Componentes internos del módulo

| Componente / función | Propósito |
|---|---|
| `CompromisosPage` | Orquestador: carga, filtros, tabla, estado del modal |
| `CompromisoModal` | Modal completo: metadata, cambio de estado, historial, nuevo comentario |
| `KpiChip` | Chip de indicador reutilizable con colores por categoría |
| `estadoChip(estado)` | Retorna la clase CSS de Tailwind para el chip de estado en la tabla |
| `estadoBtnClass(estado, selected)` | Retorna la clase CSS del botón de selección de estado en el modal |
| `isPlazoVencido(plazo)` | Compara la fecha de plazo con la fecha actual |
| `formatFecha(dateStr)` | Formatea fecha ISO a `dd/mm/yyyy` en locale `es-CL` |
| `generateId()` | Genera un ID único para comentarios nuevos en cliente |
| `SearchIcon` | SVG — lupa para el input de búsqueda |
| `CloseIcon` | SVG — X para cerrar el modal |
| `SendIcon` | SVG — avión de papel para el botón "Agregar comentario" |

---

## 13. Hallazgos y limitaciones actuales

### 13.1 Tabla `compromisos` no existe aún en Supabase

La tabla `public.compromisos` no ha sido creada en el esquema de Supabase. El servicio cae automáticamente en modo mock. Para activar persistencia real se requiere:

1. Crear la tabla con el esquema descrito en la sección 3.
2. Habilitar RLS y crear políticas de lectura/escritura para usuarios autenticados.
3. Opcionalmente: crear un trigger que al insertar un acta genere automáticamente registros en `compromisos` desde el array `acuerdos`.

**SQL base sugerido:**
```sql
create table public.compromisos (
  id              uuid primary key default gen_random_uuid(),
  acta_id         uuid references public.actas_visita(id) on delete set null,
  acta_folio      text,
  establecimiento_id   text not null,
  establecimiento_nombre text not null,
  establecimiento_comuna text not null,
  descripcion     text not null,
  responsable     text,
  plazo           date,
  estado          text not null default 'Pendiente'
                    check (estado in ('Pendiente','En proceso','Cumplido','Vencido')),
  comentarios     jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.compromisos enable row level security;

create policy "compromisos_select" on public.compromisos
  for select using (true);

create policy "compromisos_write" on public.compromisos
  for all using (auth.role() = 'authenticated');
```

### 13.2 Compromisos desvinculados de actas en tiempo real

Los compromisos del módulo son entidades independientes. Si se modifica el acuerdo dentro del acta original (en `ActaPage`), ese cambio **no se refleja automáticamente** en la tabla `compromisos`. Ambas entidades son paralelas y deben mantenerse en sincronía manualmente o mediante un trigger en Supabase.

### 13.3 Sin paginación

La tabla carga todos los compromisos de una sola vez. Con volúmenes grandes (>200 registros) puede afectar el rendimiento de carga y renderizado. Se recomienda agregar paginación o scroll infinito en ese punto.

### 13.4 Autor del comentario sin autenticación

El campo "Tu nombre" del formulario de comentarios es un input libre. No está ligado a ningún sistema de autenticación. Una vez implementado el login, este campo debería autocompletarse con el nombre del usuario autenticado y deshabilitarse.

### 13.5 Estado `Vencido` no se actualiza automáticamente

El estado `Vencido` en la base de datos requiere que alguien lo marque manualmente. La detección de vencimiento que hace el componente es solo visual (texto en rojo). Si se quiere que Supabase refleje el estado real, se necesita un cron job o función edge que actualice el estado al superar el plazo.

---

## 14. Funcionalidades pendientes (próximos pasos)

### 14.1 Creación de compromisos desde el módulo

Agregar botón "Nuevo compromiso" con formulario que permita crear un compromiso manualmente, sin necesidad de que provenga de un acta. Campos mínimos: descripción, establecimiento, responsable, plazo, estado inicial.

### 14.2 Generación automática desde actas

Al registrar o cerrar un acta, generar automáticamente los compromisos en `public.compromisos` desde el array `acuerdos`. Esto puede implementarse con un trigger Supabase (PostgreSQL) o desde el cliente al llamar `insertActa()`.

```sql
-- Trigger sugerido: después de INSERT en actas_visita
-- iterar acuerdos y hacer INSERT INTO compromisos para cada uno
```

### 14.3 Vinculación bidireccional con Actas

Desde la fila de un compromiso, mostrar un botón "Ver acta" que navegue a `#/acta?actaId=<acta_id>` y abra el modal del acta de origen. Requiere que `acta_id` esté poblado.

### 14.4 Filtro por plazo

Agregar filtro de fecha (o rango) para mostrar solo compromisos con plazo en un período determinado (ej: "vence esta semana", "vence este mes").

### 14.5 Cambio de estado masivo

Selección múltiple de filas para cambiar el estado de varios compromisos a la vez. Útil en revisiones periódicas de seguimiento.

### 14.6 Exportación CSV

Botón "Exportar" que descargue el listado filtrado activo como archivo CSV con todos los campos del compromiso.

```ts
const csv = filtered.map(c =>
  [c.acta_folio, c.establecimiento_nombre, c.establecimiento_comuna,
   c.descripcion, c.responsable, c.plazo, c.estado].join(';')
).join('\n')
```

### 14.7 Notificaciones de vencimiento próximo

Agregar una alerta en el header del módulo cuando existan compromisos con plazo en los próximos 7 días y estado diferente de `Cumplido`. Lógica:

```ts
const proximos = compromisos.filter(c => {
  if (c.estado === 'Cumplido' || !c.plazo) return false
  const diasRestantes = (new Date(c.plazo).getTime() - Date.now()) / 86_400_000
  return diasRestantes >= 0 && diasRestantes <= 7
})
```

### 14.8 Integración con Métricas

Que `MetricasPage` lea desde `public.compromisos` en lugar de derivar compromisos del campo `acuerdos` de `actas_visita`. Esto daría mayor precisión al KPI de compromisos pendientes y permitiría mostrar la evolución temporal del estado de los compromisos.

---

## 15. Dependencias del módulo

| Módulo | Origen | Uso |
|---|---|---|
| `react` | externo | `useState`, `useEffect`, `useCallback`, `useMemo` |
| `types/compromisos` | interno | Tipos `Compromiso`, `ComentarioCompromiso`, `EstadoCompromiso` |
| `lib/compromisosService` | interno | `fetchCompromisos`, `updateCompromisoEstado`, `updateCompromisoComentarios` |
| `data/mockData` | interno | `crmData.compromisos` (fallback cuando Supabase no está disponible) |
| `lib/supabase` | interno | Cliente Supabase (consumido dentro del servicio) |

No tiene dependencias externas de UI. Toda la presentación usa Tailwind CSS y clases utilitarias del design system del portal (`panel-card-strong`, `table-shell`, `status-chip`, `btn-primary`, `btn-secondary`, `skeleton`).
