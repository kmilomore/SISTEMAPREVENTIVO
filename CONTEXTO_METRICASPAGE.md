# Contexto — MetricasPage

Archivo: `src/pages/MetricasPage.tsx`  
Ruta: `#/metricas`  
Fuente de datos: Supabase · tabla `public.actas_visita` + tabla `public."BASE DE DATOS ESCUELAS SLEP"`

---

## 1. Propósito

Panel de indicadores operativos de la Unidad de Prevención de Riesgos del SLEP Colchagua. Consolida métricas derivadas de las actas de visita registradas, calcula la cobertura territorial de establecimientos visitados y expone el listado de compromisos pendientes agrupado por establecimiento y comuna.

No reemplaza los módulos de Acta ni de Base de Datos: consume sus datos como fuente de lectura y los agrega en indicadores de control de gestión.

---

## 2. Origen de los datos

| Fuente | Tabla Supabase | Propósito en este módulo |
|---|---|---|
| Actas de visita | `public.actas_visita` | Fuente de compromisos, visitas y establecimientos visitados |
| Directorio SLEP | `public."BASE DE DATOS ESCUELAS SLEP"` | Total de establecimientos para calcular cobertura |

### Campos consumidos de `actas_visita`

| Campo | Uso |
|---|---|
| `id` | Identificador único del acta |
| `folio` | Referencia visible del acta en el listado |
| `establecimiento_id` | Clave para contar establecimientos únicos visitados |
| `establecimiento_nombre` | Etiqueta del establecimiento en la tabla de compromisos |
| `establecimiento_comuna` | Agrupación por comuna |
| `fecha_visita` | Referencia de cuándo ocurrió la visita |
| `acuerdos` | JSONB — array de `AcuerdoActa`, fuente de compromisos |

### Campos consumidos de `BASE DE DATOS ESCUELAS SLEP`

| Campo | Uso |
|---|---|
| `N°` | Clave primaria |
| `NOMBRE ESTABLECIMIENTO` | (solo cargado para el conteo total) |
| `COMUNA` | Agrupación por comuna para cruzar cobertura |

### Tipo interno de acuerdo

```ts
interface AcuerdoActa {
  descripcion: string
  responsable?: string
  plazo?: string
  estado: 'Pendiente' | 'En proceso' | 'Cumplido'
}
```

---

## 3. Carga de datos

```
Montaje del componente
        │
        ▼
¿supabase inicializado?
   NO → render <NoSupabaseFallback /> (mensaje de configuración)
   SÍ
        │
        ▼
Promise.all en paralelo:
  1. fetchActas()                    → actas_visita (todas las actas)
  2. supabase.from("BASE DE DATOS…")
       .select('"N°", COMUNA, "NOMBRE ESTABLECIMIENTO"')
                                     → total de establecimientos
        │
   error en fetchActas → muestra banner de error
   sin datos           → métricas en cero, tabla vacía
   con datos           → computar métricas → render
```

### Estados de la página

| Estado | Qué muestra |
|---|---|
| Sin Supabase configurado | Panel con instrucciones de configuración (.env.local) |
| `loading: true` | Texto "Cargando métricas…" centrado |
| `fetchError` | Banner rojo con mensaje de error de la API |
| Datos cargados | KPI cards + cobertura por comuna + listado |

---

## 4. Métricas calculadas (KPI cards)

Todas las métricas se calculan en cliente con `useMemo` sobre los arrays `actas` y `escuelas`.

### 4.1 Compromisos asignados

```
totalCompromisos = Σ acta.acuerdos.length   (para todas las actas)
```

Incluye todos los estados: Pendiente, En proceso y Cumplido.  
Subtexto: cantidad de acuerdos que aún están Pendiente o En proceso.

### 4.2 Escuelas visitadas

```
escuelasVisitadasSet = new Set(actas.map(a => a.establecimiento_id))
escuelasVisitadas = escuelasVisitadasSet.size
```

Cuenta establecimientos únicos con al menos un acta registrada.  
Subtexto: total de establecimientos en el directorio SLEP (si está disponible).

### 4.3 Cobertura global

```
coberturaGlobal = totalEscuelas > 0
  ? round((escuelasVisitadas / totalEscuelas) * 100)
  : 0
```

Si no hay datos del directorio SLEP, muestra `—` con texto "Sin datos de directorio".

### 4.4 Compromisos pendientes

```
compromisosPendientes = acuerdos donde estado === 'Pendiente'
comprimisosEnProceso  = acuerdos donde estado === 'En proceso'
```

El KPI muestra el conteo de "Pendiente".  
Subtexto: cantidad de acuerdos "En proceso".

---

## 5. Cobertura por comuna

### Construcción del mapa de comunas

```
1. Por cada escuela del directorio SLEP:
   map[COMUNA].total++

2. Por cada acta registrada:
   map[acta.establecimiento_comuna].visited.add(establecimiento_id)
   map[acta.establecimiento_comuna].visits++

3. Resultado por comuna:
   {
     commune: string
     totalEscuelas: number         // desde directorio SLEP
     escuelasVisitadas: number     // IDs únicos desde actas
     cobertura: number             // escuelasVisitadas / totalEscuelas * 100
     totalVisitas: number          // cantidad de actas registradas
   }
```

Orden: descendente por `escuelasVisitadas`, luego alfabético por `commune`.

### Colores de la barra de progreso

| Cobertura | Color |
|---|---|
| ≥ 75 % | Verde (`bg-emerald-500`) |
| ≥ 40 % | Amarillo (`bg-amber-400`) |
| < 40 % | Rojo (`bg-red-400`) |

### Caso sin datos del directorio

Si la tabla `BASE DE DATOS ESCUELAS SLEP` no devuelve registros (Supabase no configurado o tabla vacía), la columna `totalEscuelas` queda en 0 para esa comuna. En ese caso:
- No se muestra la barra de progreso.
- Se muestra solo el conteo de actas registradas (`N visitas`).

---

## 6. Listado de compromisos pendientes

### Origen

Se aplana el campo `acuerdos` de todas las actas y se filtran los que tienen estado `Pendiente` o `En proceso`:

```ts
compromisosPendientes = actas.flatMap(acta =>
  acta.acuerdos
    .filter(a => a.estado === 'Pendiente' || a.estado === 'En proceso')
    .map(a => ({
      key: `${acta.id}-${index}`,
      actaFolio: acta.folio,
      establecimiento: acta.establecimiento_nombre,
      comuna: acta.establecimiento_comuna,
      descripcion: a.descripcion,
      responsable: a.responsable,
      plazo: a.plazo,
      estado: a.estado,
      fechaVisita: acta.fecha_visita,
    }))
)
```

### Filtro por comuna

El selector "Todas las comunas" filtra el listado por `establecimiento_comuna`. Solo aparece si hay más de una comuna presente en los compromisos.

### Columnas de la tabla

| Columna | Campo fuente | Descripción |
|---|---|---|
| Establecimiento | `establecimiento_nombre` + `actaFolio` + `fechaVisita` | Nombre visible + folio y fecha como referencia |
| Acuerdo | `descripcion` | Texto del acuerdo (truncado a 2 líneas) |
| Responsable | `responsable` | Persona o cargo asignado |
| Plazo | `plazo` | Fecha o descripción del plazo comprometido |
| Estado | `estado` | Chip visual: amarillo (`Pendiente`) o azul (`En proceso`) |

### Chips de estado

| Estado | Color |
|---|---|
| `Pendiente` | Fondo amarillo claro · texto amber-700 · borde amber-200 |
| `En proceso` | Fondo azul claro · texto blue-700 · borde blue-200 |

---

## 7. Servicios y hooks utilizados

| Módulo | Función | Uso |
|---|---|---|
| `lib/actasService.ts` | `fetchActas()` | Carga todas las actas con sus acuerdos |
| `lib/supabase.ts` | `supabase` | Cliente Supabase (null si no está configurado) |
| `react` | `useState`, `useEffect`, `useMemo` | Estado de carga, fetch inicial y cálculo de métricas |

---

## 8. Componentes internos del módulo

| Componente | Propósito |
|---|---|
| `MetricasPage` | Orquestador principal: carga, cómputo y render de las tres secciones |
| `KpiCard` | Tarjeta de indicador con label, valor destacado, subtexto e ícono coloreado |
| `ProgressBar` | Barra de progreso coloreada según el porcentaje de cobertura |
| `estadoChip()` | Función que devuelve el chip JSX según el estado del acuerdo |
| `formatFecha()` | Convierte fecha ISO a formato `dd/mm/yyyy` en locale `es-CL` |
| `IconCompromisos` | SVG — ícono de check circular (KPI compromisos asignados) |
| `IconEscuelas` | SVG — ícono de edificio/escuela (KPI escuelas visitadas) |
| `IconCobertura` | SVG — ícono de globo/cobertura (KPI cobertura global) |
| `IconPendientes` | SVG — ícono de reloj (KPI compromisos pendientes) |

---

## 9. Integración en el shell

### routes.ts

```ts
export type AppRouteId = 'database' | 'acta' | 'metricas'

{
  id: 'metricas',
  label: 'Métricas',
  description: 'Indicadores de cobertura, compromisos y visitas del territorio.',
}
```

### AppShell.tsx

```ts
pageTitle.metricas = 'Métricas e indicadores'
pageTag.metricas   = 'Control de gestión'

// Ícono en el menú lateral:
<MetricsIcon />   // SVG — gráfico de líneas con ejes X/Y

// Render condicional:
route === 'database' ? <DatabasePage />
  : route === 'acta' ? <ActaPage />
  : <MetricasPage />
```

---

## 10. Hallazgos y limitaciones actuales

### 10.0 Bug resuelto — `useHashRoute` no reconocía rutas nuevas

**Archivo:** `src/app/useHashRoute.ts`  
**Estado:** corregido.

La función `normalizeRoute` tenía hardcodeadas solo dos rutas posibles:

```ts
// Antes — roto para cualquier ruta distinta de 'acta'
return route === 'acta' ? 'acta' : defaultRoute
```

Al hacer clic en "Métricas", el hash se actualizaba a `#/metricas` correctamente, pero `normalizeRoute` lo ignoraba y devolvía `'database'`, por lo que la página nunca cambiaba.

**Corrección aplicada:**

```ts
// Después — genérico: válido para cualquier ruta definida en appRoutes
const validRouteIds = new Set(appRoutes.map((r) => r.id))

function normalizeRoute(hash: string): AppRouteId {
  const segment = hash.replace(/^#\/?/, '').split('?')[0]
  return validRouteIds.has(segment as AppRouteId) ? (segment as AppRouteId) : defaultRoute
}
```

La corrección deriva las rutas válidas desde `appRoutes`, así agregar una ruta nueva en `routes.ts` no requiere modificar el hook.

---

### 10.1 Cobertura basada en actas, no en visitas formales

El módulo infiere "escuela visitada" a partir de la presencia de al menos un acta con ese `establecimiento_id`. No existe aún una tabla formal de visitas separada. Esto implica que:

- si una visita se realizó pero no se registró el acta, la escuela no aparece como visitada;
- una escuela con múltiples actas cuenta igual que una con una sola.

**Pendiente:** crear tabla `public.visitas` para registrar visitas como entidad propia, y usarla aquí como fuente primaria de cobertura.

### 10.2 Cobertura por comuna sin denominador si SLEP no está cargada

Si la tabla `BASE DE DATOS ESCUELAS SLEP` está vacía o no accesible, `totalEscuelas` queda en 0 y el porcentaje de cobertura global muestra `—`. El módulo funciona igual, pero pierde el contexto del denominador.

### 10.3 Sin filtro por período de tiempo

Actualmente se muestran todas las actas históricas sin filtro de fecha. No hay selector de mes, trimestre ni año. Esto afecta la utilidad del indicador "escuelas visitadas" en contextos de seguimiento periódico.

### 10.4 Compromisos sin fecha de plazo

Muchos acuerdos registrados no tienen `plazo` definido. En la tabla aparecen como `—`. No hay forma de identificar compromisos vencidos sin ese campo completo.

---

## 11. Funcionalidades pendientes (próximos pasos)

### 11.1 Filtro por período

Agregar selector de rango de fechas (mes/trimestre/año) que filtre las actas antes de calcular todas las métricas. Esto permite usar el panel como informe mensual de gestión.

**Inputs sugeridos:**
- `mes` (select con meses del año)
- `año` (select con años disponibles en las actas)
- o un rango de fechas con `date picker` libre

### 11.2 Indicador de compromisos vencidos

Comparar el campo `plazo` de cada acuerdo con la fecha actual. Los compromisos con plazo pasado y estado `Pendiente` o `En proceso` deben marcarse como vencidos con un chip rojo adicional.

```ts
const estaVencido = (plazo: string) => new Date(plazo) < new Date()
```

### 11.3 Gráfico de cobertura

Reemplazar o complementar los cards de comunas con un gráfico de barras horizontal que muestre visualmente el porcentaje de cobertura por comuna. Librería candidata: `recharts` (ya compatible con React 19 y Vite).

### 11.4 Tabla de establecimientos sin visita

Listado inverso: establecimientos del directorio SLEP que aún no tienen ninguna acta registrada. Útil para programar visitas pendientes.

**Lógica:**
```ts
const noVisitados = escuelas.filter(
  e => !escuelasVisitadasSet.has(String(e['N°']))
)
```

### 11.5 Exportación del panel

Botón "Exportar CSV" que descargue el listado de compromisos pendientes con todos los campos. Útil para seguimiento fuera del portal.

```ts
const csv = compromisosPendientes.map(c =>
  [c.establecimiento, c.actaFolio, c.descripcion, c.responsable, c.plazo, c.estado].join(';')
).join('\n')
```

### 11.6 Cobertura por asesor UATP

El directorio SLEP ya tiene el campo `ASESOR UATP`. Cruzar los establecimientos visitados con su asesor asignado permitiría medir la carga de trabajo y cobertura por persona de la Unidad.

**Asesores presentes en los datos:**
- Vanessa Montalba
- Milton Sepulveda
- Jessica Arriagada
- Javiera Vega
- Patricia Leiva

### 11.7 Indicador de cierre de actas

Ratio de actas en estado `Cerrada` sobre el total. Equivale al "Cierre oportuno de actas" que ya aparecía en los datos mock de `crmData.indicators`.

```ts
const pctCierre = round(
  (actas.filter(a => a.estado === 'Cerrada').length / actas.length) * 100
)
```

### 11.8 Vinculación con módulo de actas

Desde la tabla de compromisos pendientes, agregar un botón "Ir al acta" que navegue a `#/acta?actaId=<uuid>` para abrir el modal de detalle directamente. Mismo patrón que usa `DatabasePage`.

---

## 12. Dependencias del componente

| Módulo | Versión | Uso |
|---|---|---|
| `react` | 19 | `useState`, `useEffect`, `useMemo` |
| `lib/actasService` | interno | `fetchActas()` |
| `lib/supabase` | interno | cliente Supabase y guard de configuración |
| `types/actas` | interno | `ActaVisitaRow`, `EscuelaSLEP` |

No tiene dependencias externas de UI ni librerías de visualización. Toda la presentación se construye con Tailwind CSS.
