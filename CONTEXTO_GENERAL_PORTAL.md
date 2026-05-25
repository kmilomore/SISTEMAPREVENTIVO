# Contexto General del Portal

## 1. Resumen ejecutivo

Este proyecto corresponde a un portal CRM para la Unidad de Prevencion de Riesgos del SLEP Colchagua.

Su objetivo es centralizar informacion operativa de establecimientos educacionales, visitas en terreno, actas, observaciones de riesgo, planes de accion y seguimiento de indicadores.

Actualmente el portal se encuentra en una fase base funcional, con foco en:

- preparar la carga inicial de establecimientos en Supabase;
- dejar una arquitectura frontend modular y extensible;
- establecer el modelo de datos inicial del CRM;
- habilitar un segundo modulo de actas como punto de partida para crecimiento funcional.

## 2. Objetivo del sistema

El portal busca resolver cuatro necesidades principales:

1. Consolidar una base unica de establecimientos y contactos operativos.
2. Estandarizar el seguimiento de visitas, hallazgos, acuerdos y medidas correctivas.
3. Dar trazabilidad a compromisos, responsables y fechas de cumplimiento.
4. Servir como base para analitica operativa y control de gestion.

## 3. Estado actual del producto

### Implementado hoy

- Shell principal del portal con navegacion lateral (4 modulos activos).
- Navegacion simple por hash para separar paginas por modulo.
- Pagina de login dedicada para configuracion, validacion de sesion y acceso con Google.
- Pagina de base de datos para guiar la carga inicial del dataset SQL.
- Deteccion automatica del archivo SQL fuente publicado en `public/`.
- Cliente Supabase listo para activarse con variables de entorno publicas.
- Autenticacion Google via Supabase Auth y autorizacion centralizada por RLS.
- Modulo de actas funcional con persistencia en Supabase, generacion de PDF y subida de archivos de asistencia.
- Modulo de metricas con KPIs calculados desde actas: cobertura de establecimientos visitados, compromisos por estado, cobertura por comuna.
- Modulo de compromisos con tabla filtrable, cambio de estado y historial de seguimiento por comentarios.
- Modelo de datos mock para todos los modulos con fallback automatico cuando Supabase no esta configurado.
- Esquema SQL normalizado inicial para Supabase.
- Esquema SQL crudo para cargar la tabla original `BASE DE DATOS ESCUELAS SLEP`.
- Tipos TypeScript para entidades CRM (`src/types/crm.ts`) y compromisos (`src/types/compromisos.ts`).

### Aun no implementado

- Tabla `public.compromisos` en Supabase (el modulo opera en modo mock hasta que se cree).
- Generacion automatica de compromisos desde acuerdos del acta al registrar un acta nueva.
- Formularios CRUD de visitas y observaciones.
- Normalizacion automatica desde la tabla cruda hacia tablas operacionales.
- Exportacion documental de compromisos a CSV o PDF.
- Gestion administrativa de usuarios, perfiles o permisos por rol desde la UI.
- Paginacion en tablas con grandes volumenes de datos.

## 4. Stack tecnologico

El proyecto fue construido con el siguiente stack:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase JS
- ESLint

## 5. Arquitectura del frontend

La aplicacion sigue una arquitectura simple y modular.

### Punto de entrada

- `src/main.tsx`: monta la aplicacion en React StrictMode.
- `src/App.tsx`: delega toda la interfaz al `AppShell`.

### Shell de la aplicacion

- `src/app/AppShell.tsx`: contiene la estructura general del portal, el menu lateral y el render de paginas.
- `src/app/routes.ts`: define las rutas disponibles y su metadata visual.
- `src/app/useHashRoute.ts`: implementa navegacion por hash (`#/database`, `#/acta`) sin router externo.

### Modulos actuales

- `src/pages/DatabasePage.tsx`: modulo de carga inicial de datos y directorio SLEP.
- `src/pages/ActaPage.tsx`: gestor completo de actas con PDF, asistencia y detalle.
- `src/pages/LoginPage.tsx`: acceso institucional y estados previos al montaje del portal.
- `src/pages/MetricasPage.tsx`: panel de KPIs calculados desde actas y directorio SLEP.
- `src/pages/CompromisosPage.tsx`: gestor de compromisos con filtros, cambio de estado e historial de comentarios.

### Datos y contratos

- `src/types/crm.ts`: contratos TypeScript para entidades del CRM (Establishment, Visit, Observation, MeetingMinute, ActionPlan, Indicator).
- `src/types/actas.ts`: tipos del modulo de actas (ActaVisita, AcuerdoActa, ParticipanteActa).
- `src/types/compromisos.ts`: tipos del modulo de compromisos (Compromiso, ComentarioCompromiso, EstadoCompromiso).
- `src/data/mockData.ts`: datos demo para todos los modulos; exporta `crmData` con compromisos incluidos.
- `src/lib/supabase.ts`: inicializacion del cliente Supabase y deteccion de configuracion.

## 6. Navegacion actual

La aplicacion expone cuatro rutas funcionales. La navegacion es hash-based (sin router externo). Las rutas validas se derivan dinamicamente desde `appRoutes` en `src/app/routes.ts`, por lo que agregar una ruta nueva no requiere modificar el hook `useHashRoute`.

Antes de renderizar la shell autenticada, `AppShell` resuelve tres estados previos usando `LoginPage`:

- `setup`: faltan variables `VITE_SUPABASE_URL` y/o `VITE_SUPABASE_ANON_KEY`;
- `loading`: se esta verificando la sesion actual;
- `login`: el usuario debe autenticarse con Google.

### 1. Base de Datos

Ruta: `#/database`

Responsabilidad:

- mostrar el directorio de establecimientos educacionales cargado en Supabase;
- leer el archivo SQL publicado y detectar tabla, filas y columnas;
- mostrar la secuencia recomendada de importacion.

Contexto detallado: `CONTEXTO_DATABASEPAGE.md`

### 2. Acta

Ruta: `#/acta`

Responsabilidad:

- registrar actas de visita (asesoria, observacion, reunion, solicitud);
- gestionar participantes, acuerdos y archivos de asistencia;
- generar y descargar PDF del acta;
- consultar el historial de actas con filtros y modal de detalle.

Contexto detallado: `CONTEXTO_ACTAPAGE.md`

### 3. Metricas

Ruta: `#/metricas`

Responsabilidad:

- mostrar KPIs operativos: compromisos asignados, escuelas visitadas, cobertura global, compromisos pendientes;
- visualizar la cobertura de visitas por comuna con barra de progreso;
- listar compromisos pendientes y en proceso derivados de los acuerdos registrados en las actas.

Contexto detallado: `CONTEXTO_METRICASPAGE.md`

### 4. Compromisos

Ruta: `#/compromisos`

Responsabilidad:

- listar todos los compromisos impuestos a los establecimientos con filtros por escuela, comuna y estado;
- cambiar el estado de un compromiso (Pendiente / En proceso / Cumplido / Vencido);
- registrar notas de seguimiento tipo historial con autor y fecha;
- mostrar chips KPI con el resumen cuantitativo por estado.

Contexto detallado: `CONTEXTO_COMPROMISOSPAGE.md`

## 7. Modulo de base de datos

El modulo de base de datos es la primera pantalla operativa del portal y cumple una funcion de onboarding tecnico.

### Lo que hace

- consulta el archivo `public/BASE DE DATOS ESCUELAS SLEP_rows.sql`;
- analiza el `INSERT INTO` para detectar la tabla objetivo;
- estima el numero de columnas desde la cabecera del INSERT;
- estima el numero de filas desde la seccion `VALUES`;
- muestra una vista previa del SQL;
- indica si Supabase esta configurado o si la app sigue en modo demo.

### Flujo recomendado de carga

1. Ejecutar `supabase/base_datos_escuelas_slep_schema.sql`.
2. Ejecutar `public/BASE DE DATOS ESCUELAS SLEP_rows.sql` o el seed consolidado generado para Supabase.
3. Verificar la tabla cruda en Supabase.
4. Usar esa tabla como fuente para procesos futuros de normalizacion.

## 8. Modulo de actas

El modulo de actas ya opera como flujo transaccional sobre Supabase.

### Lo que hace hoy

- lista actas reales ordenadas por fecha;
- registra nuevas actas por tipo;
- genera PDF y lo almacena en Supabase Storage;
- permite ver detalle completo con modal responsive y scroll interno;
- permite cargar o reemplazar la lista de asistencia.

### Roadmap del modulo

- edicion de actas existentes;
- cierre formal de actas;
- filtros avanzados de listado;
- exportacion documental adicional.

## 9. Modelo de datos funcional del CRM

La aplicacion ya define entidades funcionales en frontend y su equivalente inicial en esquema SQL.

### Entidades de negocio presentes

#### Establishment

Representa un establecimiento educacional.

Campos relevantes en frontend:

- id
- name
- commune
- category
- staff
- totalStudents
- riskIndex
- lastVisitAt

Campos equivalentes en esquema SQL normalizado:

- id
- name
- commune
- category
- address
- director_name
- staff_count
- student_count
- risk_index

#### Visit

Representa una visita en terreno.

Incluye:

- establecimiento asociado;
- fecha;
- tipo de visita;
- inspector;
- estado;
- alcance.

#### MeetingMinute

Representa un acta o minuta.

Incluye:

- codigo unico;
- establecimiento asociado;
- fecha de sesion;
- tema;
- estado;
- cantidad de compromisos.

#### Observation

Representa un hallazgo detectado en una visita o asociado a un establecimiento.

Incluye:

- titulo;
- nivel de riesgo;
- estado;
- responsable;
- fecha compromiso.

#### ActionPlan

Representa una accion correctiva asociada a una observacion.

Incluye:

- medida;
- responsable;
- fecha objetivo;
- porcentaje de avance.

#### Compromiso

Representa un compromiso formal derivado de un acuerdo de acta, con ciclo de vida independiente.

Archivo de tipos: `src/types/compromisos.ts`

Incluye:

- id del compromiso;
- referencia al acta de origen (acta_id, acta_folio);
- establecimiento asociado (id, nombre, comuna);
- descripcion del compromiso;
- responsable de cumplimiento;
- plazo de cumplimiento;
- estado: Pendiente / En proceso / Cumplido / Vencido;
- historial de comentarios de seguimiento (ComentarioCompromiso[]).

#### ComentarioCompromiso

Representa una nota de seguimiento dentro de un compromiso.

Incluye:

- id generado en cliente;
- texto del comentario;
- autor (nombre libre o default 'Unidad de Prevencion');
- fecha del comentario.

## 10. Supabase y persistencia

La integracion con Supabase ya esta consumida desde la UI para autenticacion, lectura y persistencia de los modulos principales.

### Variables de entorno requeridas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Comportamiento actual

- si ambas variables existen, la app crea el cliente de Supabase y habilita el flujo de acceso institucional;
- si no existen, `LoginPage` muestra el modo de configuracion inicial;
- la autorizacion real de datos se decide en backend mediante RLS y no por una whitelist hardcodeada en frontend.

### Esquemas SQL disponibles

#### `supabase/base_datos_escuelas_slep_schema.sql`

Define la tabla cruda `public."BASE DE DATOS ESCUELAS SLEP"` con columnas compatibles con el archivo fuente entregado.

Uso:

- recibir la carga original tal como viene desde el SQL externo;
- mantener una fuente de datos sin transformar.

#### `supabase/schema.sql`

Define el modelo normalizado inicial del CRM:

- `public.establishments`
- `public.visits`
- `public.meeting_minutes`
- `public.observations`
- `public.action_plans`

Tambien habilita Row Level Security y crea politicas abiertas para usuarios autenticados.

## 11. Datos demo actualmente presentes

El frontend usa datos mock para acelerar el desarrollo visual y de arquitectura.

Actualmente existen datos demo para:

- 3 establecimientos (San Fernando, Placilla, Nancagua);
- 3 visitas;
- 3 observaciones;
- 3 actas;
- 3 planes de accion;
- 3 indicadores;
- 4 tarjetas de modulos futuros;
- 5 compromisos (distribuidos en los 3 establecimientos, cubriendo los 4 estados posibles).

Esto permite evolucionar la UI sin bloquearse por backend.

## 12. Relacion entre tabla cruda y modelo normalizado

Hoy conviven dos niveles de datos:

### Nivel 1: tabla cruda

`BASE DE DATOS ESCUELAS SLEP`

Caracteristicas:

- mantiene nombres originales de columnas;
- incluye espacios, tildes y formato heredado;
- sirve como staging o fuente inicial.

### Nivel 2: modelo operacional CRM

Tablas normalizadas como `establishments`, `visits`, `meeting_minutes`, `observations` y `action_plans`.

Caracteristicas:

- nombres consistentes para desarrollo y consultas;
- relaciones claras entre entidades;
- mejor base para formularios, reportes y automatizaciones.

## 13. Convenciones de crecimiento del proyecto

El proyecto esta planteado para crecer por modulos.

Principios actuales:

- una pagina o dominio por archivo o carpeta dedicada;
- rutas centralizadas en `src/app/routes.ts`;
- shell desacoplado del contenido de cada pagina;
- posibilidad de agregar paginas futuras sin tocar la estructura principal;
- mock data y tipos separados de la UI.

Modulos activos hoy:

- Base de Datos (`#/database`)
- Acta (`#/acta`)
- Metricas (`#/metricas`)
- Compromisos (`#/compromisos`)

Modulos futuros coherentes con la arquitectura actual:

- Visitas (tabla `public.visitas`, programacion y seguimiento de visitas en terreno)
- Observaciones (hallazgos por visita, nivel de riesgo, responsable)
- Planes de accion (medidas correctivas por observacion)
- Exportaciones (CSV / Excel de cualquier listado)
- Normalizacion de datos (pipeline desde tabla cruda hacia tablas operacionales)

## 14. Riesgos y brechas actuales

Las principales brechas del portal hoy son:

1. La tabla `public.compromisos` no existe aun en Supabase; el modulo opera en modo mock.
2. Los compromisos del modulo de compromisos y los acuerdos internos de las actas son entidades paralelas sin sincronizacion automatica.
3. No existe aun un pipeline de normalizacion desde la tabla cruda de establecimientos.
4. No existe aun gestion administrativa de permisos o perfiles desde la UI; hoy el acceso se controla con Auth + RLS en Supabase.
5. No existe aun un panel interno para administrar usuarios autorizados.
6. No hay testing automatizado de flujos de negocio.
7. Sin paginacion en tablas; carga completa de registros en memoria.

## 15. Prioridades recomendadas

Orden sugerido para evolucion del portal:

1. Crear tabla `public.compromisos` en Supabase con el esquema definido en `CONTEXTO_COMPROMISOSPAGE.md` (seccion 13.1).
2. Generar compromisos automaticamente desde acuerdos al registrar un acta nueva (trigger Supabase o logica en `insertActa`).
3. Normalizar establecimientos desde la tabla cruda a `public.establishments`.
4. Extender la autenticacion actual para ligar autores, auditoria y perfiles a la sesion autenticada.
5. Incorporar modulo de visitas y observaciones.
6. Conectar observaciones con planes de accion.
7. Agregar paginacion en listados de actas y compromisos.

## 16. Archivos clave del proyecto

### Shell y navegacion

- `src/App.tsx`: entrada funcional de la app.
- `src/app/AppShell.tsx`: contenedor principal, menu lateral, render condicional de paginas.
- `src/app/routes.ts`: definicion centralizada de rutas (`database`, `acta`, `metricas`, `compromisos`).
- `src/app/useHashRoute.ts`: navegacion hash-based, deriva rutas validas desde `appRoutes`.

### Paginas

- `src/pages/DatabasePage.tsx`: directorio de establecimientos y carga inicial SQL.
- `src/pages/ActaPage.tsx`: gestor de actas con PDF, asistencia y detalle.
- `src/pages/LoginPage.tsx`: acceso institucional, configuracion inicial y estado de carga de autenticacion.
- `src/pages/MetricasPage.tsx`: panel de KPIs e indicadores operativos.
- `src/pages/CompromisosPage.tsx`: gestor de compromisos con filtros, estados e historial.

### Datos, tipos y servicios

- `src/data/mockData.ts`: datos demo para todos los modulos (establecimientos, actas, compromisos, etc.).
- `src/types/crm.ts`: contratos de entidades generales del CRM.
- `src/types/actas.ts`: contratos del modulo de actas.
- `src/types/compromisos.ts`: contratos del modulo de compromisos.
- `src/lib/supabase.ts`: configuracion del cliente Supabase.
- `src/lib/actasService.ts`: CRUD de actas en Supabase.
- `src/lib/compromisosService.ts`: lectura y escritura de compromisos con fallback a mock.
- `src/lib/pdfActaService.ts`: generacion de PDF de actas.
- `src/lib/storageActasService.ts`: subida de archivos al bucket `actas-visita`.

### Esquemas Supabase

- `supabase/base_datos_escuelas_slep_schema.sql`: esquema de tabla cruda.
- `supabase/schema.sql`: esquema normalizado inicial (establishments, visits, meeting_minutes, observations, action_plans).
- `supabase/seed_base_datos_escuelas_slep.sql`: seed listo para SQL Editor de Supabase.

### Documentacion de modulos

- `CONTEXTO_GENERAL_PORTAL.md`: este archivo — vision y arquitectura general del portal.
- `CONTEXTO_DATABASEPAGE.md`: detalle del modulo Base de Datos.
- `CONTEXTO_ACTAPAGE.md`: detalle del modulo Actas.
- `CONTEXTO_METRICASPAGE.md`: detalle del modulo Metricas.
- `CONTEXTO_COMPROMISOSPAGE.md`: detalle del modulo Compromisos.

## 17. Conclusion

El portal cuenta con cuatro modulos funcionales y una arquitectura consolidada para seguir creciendo como CRM operacional de prevencion de riesgos.

- El modulo de **Actas** ya persiste en Supabase con PDF y archivos de asistencia.
- El modulo de **Metricas** calcula KPIs en tiempo real desde los datos reales.
- El modulo de **Compromisos** opera en modo demo hasta que se cree la tabla en Supabase, pero la UI esta completamente construida.
- El **directorio de establecimientos** esta listo para cargarse desde el SQL fuente.
- El acceso institucional ya cuenta con pantalla dedicada de login y autorizacion centralizada en Supabase.

El siguiente salto de valor esta en consolidar la administracion de usuarios autorizados, conectar la generacion automatica de compromisos desde actas y profundizar la trazabilidad por sesion autenticada.