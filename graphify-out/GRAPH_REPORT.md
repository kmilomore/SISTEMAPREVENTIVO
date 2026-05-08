# Graph Report - .  (2026-05-08)

## Corpus Check
- Corpus is ~36,998 words - fits in a single context window. You may not need a graph.

## Summary
- 213 nodes · 307 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `generarActaPdf()` - 7 edges
2. `ActaVisita` - 5 edges
3. `ActaVisitaRow` - 5 edges
4. `TipoActa` - 4 edges
5. `AppShell()` - 3 edges
6. `useHashRoute()` - 3 edges
7. `ActaDetailModal()` - 3 edges
8. `ActaForm()` - 3 edges
9. `fetchActas()` - 3 edges
10. `updateActaPdf()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `useHashRoute()`  [EXTRACTED]
  src/app/AppShell.tsx → src/app/useHashRoute.ts

## Hyperedges (group relationships)
- **Acta Form Components** — acta_form, acuerdos_field_array, participantes_field_array, auto_resize_textarea, establecimiento_select [INFERRED]
- **Acta Page Module** — acta_page, acta_tipo_selector, acta_form, acta_detail_modal [INFERRED]
- **Backend Services** — actas_service, pdf_acta_service, storage_actas_service, supabase_client [INFERRED]
- **Build & Development Configuration** — vite_config, tailwind_config, postcss_config, eslint_config [INFERRED]
- **CRM Data Layer** — supabaseClient, actas_visita_table, base_datos_escuelas_slep_table, establishments_table, visits_table, observations_table, meeting_minutes_table, action_plans_table [INFERRED]
- **TypeScript Type System** — ActaVisita, ParticipanteActa, AcuerdoActa, EscuelaSLEP, Establishment, Visit, Observation, MeetingMinute, ActionPlan [INFERRED]
- **Service Layer** — actasService, storageActasService, pdfActaService, supabaseClient [INFERRED]
- **UI Layer** — AppShell, ActaPage, DatabasePage [INFERRED]
- **Project Documentation** — README, CONTEXTO_GENERAL_PORTAL, CONTEXTO_ACTAPAGE, CONTEXTO_DATABASEPAGE [INFERRED]

## Communities (18 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (21): ActaDetailModal(), ActaDetailModalProps, estadoChip(), TIPO_LABELS, insertActa(), updateActaAsistencia(), updateActaEstado(), updateActaPdf() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (35): Acta Page, ActaVisita Type, Action Plan Type, Acuerdo Acta Type, App Shell, CONTEXTO_ACTAPAGE.md, CONTEXTO_DATABASEPAGE.md, CONTEXTO_GENERAL_PORTAL.md (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (20): ActaForm(), ActaFormProps, FormErrors, FormState, TIPO_LABELS, todayIso(), AcuerdosFieldArray(), AcuerdosFieldArrayProps (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (19): actionPlans, crmData, establishments, indicators, meetingMinutes, modules, observations, visits (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (9): AppShell(), pageTag, pageTitle, AppRoute, AppRouteId, appRoutes, useHashRoute(), ActaPage() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.0
Nodes (13): fetchActas(), actaTypeLabels, detailSections, formatActaDate(), formatValue(), isActaRelatedToSchool(), LoadState, normalizeComparableIdentifier() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.0
Nodes (19): ActaDetailModal Component, ActaForm Component, ActaPage, ActaTipoSelector Component, Acta Types, actasService, AcuerdosFieldArray Component, AutoResizeTextarea Component (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.0
Nodes (5): ActaTipoSelector(), ActaTipoSelectorProps, TipoOption, TIPOS, TipoActa

### Community 8 - "Community 8"
Cohesion: 0.0
Nodes (6): App.tsx, AppShell, DatabasePage, ESLint Configuration, Route Configuration, useHashRoute Hook

### Community 10 - "Community 10"
Cohesion: 0.0
Nodes (3): PostCSS Configuration, Tailwind Configuration, Vite Configuration

## Knowledge Gaps
- **41 isolated node(s):** `ImportMetaEnv`, `ImportMeta`, `pageTitle`, `pageTag`, `AppRoute` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.