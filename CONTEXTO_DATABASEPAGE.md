# Contexto — DatabasePage

Archivo: `src/pages/DatabasePage.tsx`  
Ruta: `#/database`  
Fuente de datos: Supabase · tabla `"BASE DE DATOS ESCUELAS SLEP"`

---

## 1. Propósito

Directorio operacional de todos los establecimientos educacionales del SLEP Colchagua. Permite consultar, buscar y revisar la ficha completa de cada establecimiento con datos de contacto, ubicación geográfica y estructura organizacional.

---

## 2. Origen de los datos

| Atributo | Valor |
|---|---|
| Proyecto Supabase | `osbkiydklibdpmqjpovq` |
| Tabla | `public."BASE DE DATOS ESCUELAS SLEP"` |
| Clave primaria | `N°` (bigint) |
| Total de columnas | 28 |
| Autenticación | RLS habilitado · política `SELECT` para rol `anon` y `authenticated` |
| Orden de carga | Ascendente por `N°` |

### Variables de entorno requeridas

```
VITE_SUPABASE_URL=https://osbkiydklibdpmqjpovq.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

---

## 3. Cobertura territorial

Los establecimientos cubren comunas de la Región de O'Higgins bajo la administración del SLEP Colchagua:

| Comuna | Representante consejo |
|---|---|
| Chimbarongo | Jorge Barahona / Vianka Mejías |
| Nancagua | Vianka Mejías |
| Placilla | Vianka Mejías |
| San Fernando | Carolina Rozas / Marisol Maldonado |

Todas las comunas tienen establecimientos con coordenadas LATITUD/LONGITUD disponibles → **base lista para mapa**.

---

## 4. Tipos de establecimiento (`TIPO`)

| Tipo | Descripción |
|---|---|
| `ESCUELA` | Escuela básica, mayoritaria |
| `LICEO` | Liceo, enseñanza media |
| `COLEGIO` | Colegio básico/medio |
| `JARDIN` | Jardín infantil y sala cuna |

---

## 5. Campos de la tabla

### Identificación
| Campo | Tipo | Uso |
|---|---|---|
| `N°` | bigint PK | Número correlativo interno |
| `RBD` | text | Rol Base de Datos del Mineduc |
| `NOMBRE ESTABLECIMIENTO` | text | Nombre oficial |
| `TIPO` | text | ESCUELA / LICEO / COLEGIO / JARDIN |
| `RURAL/URBANO` | text | Clasificación territorial |

### Ubicación
| Campo | Tipo | Uso |
|---|---|---|
| `DIRECCIÓN` | text | Dirección postal |
| `COMUNA` | text | Comuna principal |
| `COMUNA_1` | text | Comuna administrativa (a veces difiere) |
| `LATITUD` | text | Coordenada decimal (separador `,`) |
| `LONGITUD` | text | Coordenada decimal (separador `,`) |
| `ALTITUD` | text | Altitud en metros (muchos nulos) |

> **Nota:** Las coordenadas usan coma como separador decimal y no punto. Para usar en mapas hay que normalizar: `parseFloat(lat.replace(',', '.'))`.

### Dirección y contacto
| Campo | Uso |
|---|---|
| `DIRECTOR/A` | Nombre completo del director actual |
| `RUT` | RUT del director |
| `TELEFONO FIJO/ANEXOS` | Teléfono fijo institucional |
| `TELEFONO CELULAR` | Celular del director |
| `CORREO ELECTRÓNICO` | Correo institucional del director |
| `CORREO SUBROGANTE` | Correo del subrogante cuando aplica |
| `FUNCIONARIO SUBROGANTE POR LM` | Nombre del subrogante por licencia médica |
| `CELULAR` | Celular alternativo |

### Consejo escolar y CGPMA
| Campo | Uso |
|---|---|
| `REPRESENTANTE CONSEJO ESCOLAR` | Nombre del representante SLEP ante el consejo |
| `CORREO REPRESENTANTE` | Correo del representante |
| `ASESOR UATP` | Nombre del asesor UATP asignado |
| `CORREO ASESOR` | Correo del asesor UATP |
| `NOMBRE PRESIDENTE CGPMA` | Presidente del Centro General de Padres |
| `CORREO` | Correo del presidente CGPMA |
| `TELEFONO` | Teléfono del presidente CGPMA |
| `OBSERVACION CGPMA` | Observaciones libres sobre el CGPMA |

### Otros
| Campo | Uso |
|---|---|
| `OBSERVACIONES` | Texto libre institucional (subrogantes, notas operativas) |

---

## 6. Flujo actual de la página

```
Montaje del componente
        │
        ▼
¿supabase inicializado?
   NO → estado: error ("No fue posible inicializar...")
   SÍ
        │
        ▼
supabase.from("BASE DE DATOS ESCUELAS SLEP").select("*")
        │
   error API → estado: error (muestra errorMessage)
   sin datos → estado: empty
   con datos  → ordenar por N° asc → estado: ready
        │
        ▼
Render tabla principal
  columnas visibles: N° · RBD · NOMBRE · COMUNA · TIPO · DIRECTOR/A · CORREO
  búsqueda en: NOMBRE · RBD · COMUNA · DIRECTOR/A · TIPO
        │
  clic en fila
        │
        ▼
SchoolDetailModal (overlay)
  tecla ESC → cierra
  clic fondo → cierra
  muestra 4 pills: N° · Tipo · Comuna · Zona
  secciones desplegadas (solo campos con valor):
    - Identificacion
    - Ubicacion
    - Direccion y contacto
    - Consejo escolar y CGPMA
    - Observaciones
```

### Estados de carga

| Estado | Qué muestra |
|---|---|
| `loading` | 5 skeletons grises animados |
| `error` | Banner rojo con mensaje de error |
| `empty` | Aviso: "No hay escuelas registradas en la tabla" |
| `ready` | Tabla con todos los registros filtrables |

---

## 7. Búsqueda

La búsqueda es client-side sobre los datos ya cargados en memoria (`useMemo`).

**Campos buscables:**
- `NOMBRE ESTABLECIMIENTO`
- `RBD`
- `COMUNA`
- `DIRECTOR/A`
- `TIPO`

**Comportamiento:** normaliza a minúsculas, filtra con `includes`. No distingue mayúsculas ni tildes.

**Mejora sugerida:** normalizar tildes con `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` para que "escuela" encuentre "Escuela" y "Básica" encuentre "basica".

---

## 8. Funcionalidades pendientes (próximos pasos)

### 8.1 Vista de mapa

Los datos ya tienen coordenadas `LATITUD` y `LONGITUD`. Se puede construir un mapa con `react-leaflet` o `maplibre-gl`.

**Pasos para activarlo:**

1. Instalar `react-leaflet` y `leaflet`.
2. Agregar normalización de coordenadas:
   ```ts
   function parseCoord(val: string | null) {
     if (!val) return null
     return parseFloat(val.replace(',', '.'))
   }
   ```
3. Filtrar escuelas con coordenadas válidas.
4. Renderizar un `<MapContainer>` con un `<Marker>` por escuela.
5. Al hacer clic en el marcador, abrir el mismo `SchoolDetailModal` existente.

**Columnas requeridas:** `LATITUD`, `LONGITUD`, `NOMBRE ESTABLECIMIENTO`, `TIPO`, `COMUNA`.

### 8.2 Filtros por columna

Filtros adicionales sobre `TIPO`, `RURAL/URBANO`, `COMUNA` y `ASESOR UATP` para segmentar la vista operativamente.

### 8.3 Vista de hallazgos por establecimiento

Desde la ficha de un establecimiento, navegar a sus observaciones/hallazgos de riesgo registrados.

**Tablas futuras requeridas en Supabase:**
- `visitas` → `{ id, establecimiento_rbd, fecha, tipo, inspector, estado, alcance }`
- `hallazgos` → `{ id, visita_id, titulo, nivel_riesgo, estado, responsable, fecha_cierre }`
- `planes_accion` → `{ id, hallazgo_id, medida, responsable, avance, fecha_limite }`

**Relación desde DatabasePage:**
```
Establecimiento (RBD)
    └── Visitas (JOIN por RBD)
            └── Hallazgos (JOIN por visita_id)
                    └── Planes de acción (JOIN por hallazgo_id)
```

### 8.4 Rutas de visita

Con los datos de `LATITUD`/`LONGITUD` y una tabla `visitas`, se puede construir una vista de rutas:
- Agrupar establecimientos por `ASESOR UATP` (ya disponible en la tabla).
- Generar una secuencia de visitas programadas en el mapa.
- Exportar a PDF o Google Maps.

**Asesores UATP presentes en los datos:**
- Vanessa Montalba
- Milton Sepulveda
- Jessica Arriagada
- Javiera Vega
- Patricia Leiva

### 8.5 Exportación

- Exportar la tabla filtrada a CSV o Excel.
- Generar ficha PDF de un establecimiento desde el modal.

### 8.6 Edición en línea

Permitir editar campos operativos (`DIRECTOR/A`, `CORREO ELECTRÓNICO`, `TELEFONO CELULAR`, `OBSERVACIONES`) directamente desde el modal con un botón "Editar" → `supabase.from(...).update(...)`.

---

## 9. Asesores UATP (campo operativo clave)

El campo `ASESOR UATP` define quién de la Unidad de Apoyo Técnico Pedagógico es responsable de cada establecimiento. Es la base natural para segmentar visitas, hallazgos y rutas.

| Asesor | Establecimientos asignados |
|---|---|
| Vanessa Montalba | Chimbarongo (varios), San Fernando (varios), Nancagua (varios) |
| Milton Sepulveda | Chimbarongo (varios), Nancagua, Placilla, San Fernando |
| Jessica Arriagada | Chimbarongo, Placilla, San Fernando, Nancagua |
| Javiera Vega | Chimbarongo, Placilla, Nancagua, San Fernando |
| Patricia Leiva | Jardines infantiles de todas las comunas |

---

## 10. Dependencias del componente

| Módulo | Uso |
|---|---|
| `react` | `useState`, `useEffect`, `useMemo` |
| `../lib/supabase` | cliente Supabase y flag `isSupabaseConfigured` |

No tiene dependencias externas de UI ni librerías de terceros.

---

## 11. Componentes internos

| Componente | Propósito |
|---|---|
| `DatabasePage` | Componente principal, orquesta carga y render |
| `SchoolDetailModal` | Modal de ficha completa del establecimiento |
| `SummaryPill` | Tarjeta resumen (N°, Tipo, Comuna, Zona) |
| `SearchIcon` | Ícono SVG del campo de búsqueda |
| `CloseIcon` | Ícono SVG del botón cerrar modal |
| `formatValue` | Formatea valores nulos/vacíos como "Sin dato" |
| `hasValue` | Filtra campos vacíos para no renderizar secciones vacías |
