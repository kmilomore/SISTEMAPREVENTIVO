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

- Shell principal del portal con navegacion lateral.
- Navegacion simple por hash para separar paginas por modulo.
- Pagina de base de datos para guiar la carga inicial del dataset SQL.
- Deteccion automatica del archivo SQL fuente publicado en `public/`.
- Cliente Supabase listo para activarse con variables de entorno publicas.
- Pagina base del modulo de actas con datos demo.
- Modelo de datos mock para representar establecimientos, visitas, actas, observaciones y planes.
- Esquema SQL normalizado inicial para Supabase.
- Esquema SQL crudo para cargar la tabla original `BASE DE DATOS ESCUELAS SLEP`.

### Aun no implementado

- Persistencia real desde la UI hacia Supabase.
- Formularios CRUD de actas, visitas, observaciones y planes.
- Normalizacion automatica desde la tabla cruda hacia tablas operacionales.
- Paneles KPI en la interfaz.
- Exportacion documental o PDF.
- Gestion de usuarios, perfiles o permisos por rol.

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

- `src/pages/DatabasePage.tsx`: modulo de carga inicial de datos.
- `src/pages/ActaPage.tsx`: modulo base para gestionar actas.

### Datos y contratos

- `src/types/crm.ts`: contratos TypeScript para entidades del CRM.
- `src/data/mockData.ts`: datos demo usados por la UI mientras no exista persistencia real.
- `src/lib/supabase.ts`: inicializacion del cliente Supabase y deteccion de configuracion.

## 6. Navegacion actual

La aplicacion hoy expone dos rutas funcionales:

### 1. Base de Datos

Ruta: `#/database`

Responsabilidad:

- explicar la secuencia de carga de la base cruda en Supabase;
- leer el archivo SQL publicado;
- detectar nombre de tabla, cantidad de filas y columnas;
- mostrar la secuencia recomendada de importacion.

### 2. Acta

Ruta: `#/acta`

Responsabilidad:

- dejar creada la segunda pagina del sistema;
- mostrar un listado demo de actas;
- documentar el roadmap inmediato del modulo.

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

El modulo de actas ya existe como base visual y de arquitectura, pero todavia no como flujo transaccional completo.

### Lo que muestra hoy

- tabla demo de actas;
- codigo del acta;
- fecha de sesion;
- tema;
- estado.

### Roadmap del modulo

- formulario de acta;
- asistentes y acuerdos;
- responsables y fechas de cierre;
- relacion con establecimiento y visita;
- exportacion documental futura.

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

## 10. Supabase y persistencia

La integracion con Supabase esta preparada pero aun no consumida desde la UI.

### Variables de entorno requeridas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Comportamiento actual

- si ambas variables existen, la app crea el cliente de Supabase;
- si no existen, la app sigue funcionando en modo demo;
- la UI refleja ese estado en el modulo de base de datos.

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

- 3 establecimientos;
- 3 visitas;
- 3 observaciones;
- 3 actas;
- 3 planes de accion;
- 3 indicadores;
- 4 tarjetas de modulos futuros.

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

Ejemplos de modulos futuros coherentes con la arquitectura actual:

- Visitas
- Observaciones
- Planes de accion
- Dashboard KPI
- Documentos y exportaciones
- Normalizacion de datos

## 14. Riesgos y brechas actuales

Las principales brechas del portal hoy son:

1. La UI aun no escribe ni lee datos reales desde Supabase.
2. No existe aun un pipeline de normalizacion desde la tabla cruda.
3. No hay autenticacion funcional en pantalla.
4. No hay control de permisos por perfil.
5. No hay testing automatizado de flujos de negocio.
6. El modulo de actas aun es una base visual, no una operacion completa.

## 15. Prioridades recomendadas

Orden sugerido para evolucion del portal:

1. Normalizar establecimientos desde la tabla cruda a `public.establishments`.
2. Crear lectura real desde Supabase para reemplazar mock data.
3. Construir CRUD del modulo de actas.
4. Incorporar modulo de visitas y observaciones.
5. Conectar observaciones con planes de accion.
6. Agregar dashboard de indicadores.
7. Incorporar autenticacion y roles.

## 16. Archivos clave del proyecto

- `README.md`: resumen general del proyecto y puesta en marcha.
- `src/App.tsx`: entrada funcional de la app.
- `src/app/AppShell.tsx`: contenedor principal del portal.
- `src/app/routes.ts`: definicion de rutas disponibles.
- `src/app/useHashRoute.ts`: navegacion hash-based.
- `src/pages/DatabasePage.tsx`: pagina de carga inicial SQL.
- `src/pages/ActaPage.tsx`: pagina base del modulo de actas.
- `src/data/mockData.ts`: datos demo del CRM.
- `src/types/crm.ts`: contratos de entidades de negocio.
- `src/lib/supabase.ts`: configuracion del cliente Supabase.
- `supabase/base_datos_escuelas_slep_schema.sql`: esquema de tabla cruda.
- `supabase/schema.sql`: esquema normalizado inicial.
- `supabase/seed_base_datos_escuelas_slep.sql`: seed listo para SQL Editor de Supabase.

## 17. Conclusion

El portal ya tiene una base tecnica ordenada para crecer como CRM operacional de prevencion de riesgos.

Su estado actual no es el de un sistema cerrado, sino el de una plataforma inicial bien encaminada: ya existe la estructura, la navegacion, la integracion base con Supabase, el esquema de datos y el primer flujo tecnico de carga de establecimientos.

El siguiente salto de valor consiste en transformar esta base en operacion real: persistencia efectiva, normalizacion de datos, formularios de gestion y seguimiento completo por modulo.