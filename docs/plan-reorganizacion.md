---
doc_id: docs/plan-reorganizacion
title: Plan de reorganización documental
domain: governance
audience: [human, agent]
status: entregado
source_of_truth_for:
  - plan de la reorganización documental y su diagnóstico
  - tareas T0-T12 y sus criterios de aceptación
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Plan de reorganización documental: SplitEat

> **Estado:** propuesto — pendiente de aprobación
> **Rama:** `docs/project-evolution`
> **Worktree:** `spliteat-docs-evolution`
> **Base:** `feature/feature-entrega2-ADLC` @ `c66fd3f`
> **Fecha:** 2026-09-22
> **Alcance de esta rama:** únicamente este plan. No incluye la ejecución de la reorganización.

---

## 1. Qué cambia respecto al plan anterior

El primer planteamiento creaba un apartado nuevo `docs/evolution/` con ocho documentos. Se
descarta por dos motivos:

1. **No hay que crear un apartado de evolución.** El trabajo consiste en **reorganizar la
   información y las explicaciones del proyecto**, no en añadir un silo paralelo.
2. **La base de datos sale del MVP.** Todo lo relativo a Firestore, Dexie e IndexedDB se
   reencuadra como **evolución del alcance**: qué se planificó, qué se descartó y por qué.

Decisiones tomadas por el usuario:

| Decisión | Elección |
| :--- | :--- |
| Estructura | Fichero índice a nivel de `docs/` y, a partir de él, documentos divididos por dominios |
| Taxonomía de carpetas | **Renombrar a nomenclatura de dominios.** Un dominio puede tener más de un fichero si mantiene coherencia |
| Alcance no entregado | Reencuadrar dentro de cada documento, sin apartado ni carpeta llamada «evolución» |
| Archivos incluidos | `docs/` completo **más** `readme.md`, `ROUTING_FEASIBILITY.md` y `prompts.md` de la raíz |
| `openspec/` | **Se mantiene como está.** No se reorganiza, no se reescribe, no se mueve |
| Motor OCR `'server'` | Sigue siendo **un cambio pendiente**: se documenta como alcance latente, no como descartado. Tocar código queda fuera de esta rama |
| `skill-style-guide.md` | Artefacto interno: sale de `docs/` |
| Diagramas | Tres: casos de uso, arquitectura as-is y estado actual |

---

## 2. Diagnóstico verificado

> Las rutas de esta sección son las del árbol **actual**, antes de la reorganización descrita en
> la sección 3.

### 2.1. El producto entregado

Base de contraste de todo el plan. Verificado sobre el código:

- PWA de cliente, sin backend: `grep -ril firebase frontend/src` → **0 archivos**.
- `dexie@4.4.4` está en `package.json` pero **no se importa en ninguna parte**; la persistencia
  real es `localStorage` mediante Zustand persist.
- OCR: Tesseract.js **y** Florence-2 VLM en dispositivo (`@huggingface/transformers`,
  WebGPU/WASM).
- Estilos: Tailwind CSS v4 + 27 paquetes Radix UI.
- Despliegue: Netlify + Vercel mediante GitHub Actions.
- `backend/` y `db/` no contienen código: solo `.keep` y una nota de ubicación.
- 181 commits, 19 commits de merge, etiquetas `v0.1.0` y `v0.2.0`, 23 archivos de test.

### 2.2. Inventario y estado de la documentación

| Documento | Líneas | Tipo | Estado |
| :--- | ---: | :--- | :--- |
| `readme.md` (raíz) | 211 | mixto | Mixto |
| `docs/prd/PRD.md` | 162 | producto | Mixto |
| `docs/prd/brief.md` | 54 | producto | Mixto |
| `docs/architecture/c4_model.md` | 174 | arquitectura | **Obsoleto** |
| `docs/db/data_schema.md` | 163 | arquitectura (datos) | **Obsoleto** |
| `docs/api/integration_contracts.md` | 113 | arquitectura (API) | **Obsoleto** |
| `docs/tech-lead/tech_stack.md` | 85 | arquitectura (stack) | **Obsoleto** |
| `docs/tech-lead/technical_plan.md` | 130 | mixto | **Obsoleto** |
| `docs/tech-lead/deployment_branching.md` | 141 | proceso (CI/CD) | **Obsoleto** |
| `docs/tech-lead/backlog.md` | 494 | producto (backlog) | Mixto |
| `docs/qa/testing_strategy.md` | 103 | proceso (QA) | Mixto |
| `docs/qa/judgment_report.md` | 41 | evidencia | **Obsoleto** |
| `docs/skill-style-guide.md` | 62 | proceso | Alineado (neutral al producto) |
| `docs/user_stories_traceability.md` | 39 | proceso (trazabilidad) | Mixto |

**Lo que sí coincide con el producto entregado:** PWA/Vite/React (`readme.md:73`,
`tech_stack.md:13-14`), el flujo 100 % local como núcleo del MVP (`PRD.md:46-60`,
`brief.md:17`), OCR en dispositivo con Tesseract.js (`tech_stack.md:17`, `TSK-1.3.md:10`) y las
URLs de Netlify y Vercel (`readme.md:42-43`).

### 2.3. Base de datos y nube: alcance declarado frente a realidad

La base de datos aparece como alcance vigente en **35 archivos**. Muestra representativa:

| Documento | Línea | Afirmación | Realidad |
| :--- | ---: | :--- | :--- |
| `readme.md` | 26, 56 | «sincronización en la nube (Firebase/Firestore)», «IndexedDB (vía Dexie.js)» | Sin Firebase; persistencia en `localStorage` |
| `readme.md` | 68 | «credenciales de Firebase en `VITE_FIREBASE_*`» | No existe `.env.example` |
| `readme.md` | 92, 99 | «SyncManager… entre Dexie.js y Firestore», «`/db`: reglas de Firestore» | No existe SyncManager; `db/` solo tiene `.keep` |
| `readme.md` | 104, 108 | «Firebase Hosting», «`firestore.rules`» | Netlify + Vercel; el archivo no existe |
| `readme.md` | 167-170 | «Firebase Client SDK… `processOcr` (Callable Function)» | Sin SDK ni Cloud Functions |
| `PRD.md` | 46 | «A. Funciones 100 % Locales… **Core MVP**» | Coincide: el MVP es local |
| `PRD.md` | 62-68 | «B. Funciones Premium / Con Registro (Requieren Infraestructura Nube)» F-12…F-14 | Declarado fuera del MVP local, pero contabilizado como alcance «Should» |
| `PRD.md` | 95, 103, 107 | métricas y registro ligados a «base de datos cloud» | No medibles: no existe registro ni BD |
| `brief.md` | 24 | «almacenada en memoria local (IndexedDB/localStorage)» | Solo `localStorage` |
| `brief.md` | 32-41 | «Funciones Premium con Registro», prioridades 3 y 4 ligadas a nube | Alcance no entregado |
| `c4_model.md` | 35, 45-48 | «backend services (Firebase cloud infrastructure)», subgrafo `FirebaseCloud` | No existe backend |
| `c4_model.md` | 60-66 | `SPA --> Firestore`, `SPA --> CloudFunctions`, `DexieDB -.-> Firestore` | Aristas inexistentes |
| `c4_model.md` | 96-97, 118-123 | `LocalDBRepo` (Dexie), `SyncManager`, `BizumHandler` | No existen |
| `data_schema.md` | 3, 7-11 | «local IndexedDB (via Dexie.js) and the cloud database (via Cloud Firestore)» + `import Dexie` | Ninguna de las dos |
| `data_schema.md` | 74-120 | «Cloud Database Schema (Cloud Firestore)» y estrategia de sync | No existe |
| `integration_contracts.md` | 3, 7-10 | «serverless backend (Firebase Functions)», «Cloud OCR API», Bearer `<Firebase_ID_Token>` | Endpoint inexistente |
| `tech_stack.md` | 15-21 | Vanilla CSS, Dexie.js, GCloud Vision, Firebase Functions, Firestore, Firebase Auth | Tailwind v4, sin Dexie, OCR en dispositivo |
| `tech_stack.md` | 33-36 | Justifica Vanilla CSS y **descarta explícitamente TailwindCSS** | Contradice el stack entregado |
| `tech_stack.md` | 80-83 | «Firebase Cloud Function Execution Cold Starts» | Servicio inexistente |
| `technical_plan.md` | 4 | MVP «con un backend mínimo… y sincronización en la nube opcional» | MVP entregado sin backend |
| `technical_plan.md` | 113-129 | «Task 5: Optional Auth & Cloud Synchronization», rama `release/mvp-offline`, TSK-5.1 | No entregado; TSK-5.1 no existe en ningún epic |
| `deployment_branching.md` | 12, 102-113 | `main` desplegado a Firebase App Hosting; `FirebaseExtended/action-hosting-deploy@v0` | Netlify + Vercel |
| `backlog.md` | 25-31, 342-440 | Epic 3 «Cloud & Sync» como trabajo pendiente | Alcance abandonado, no backlog vivo |
| `testing_strategy.md` | 14-15, 39-49, 66-70 | Integración con `fake-indexeddb`, transacciones Dexie, push a Firestore | No aplica al producto entregado |
| `judgment_report.md` | 6, 12, 33 | **PASS** sobre esos mismos documentos; certifica GDPR y cifrado de un diseño de nube inexistente | Valida como vigente lo no entregado |

**Definición del MVP entregado** (`PRD.md:46-60`, funciones F-01…F-11): OCR, entrada manual,
EXIF, asignación visual, división con cuadre, vista dictado, redondeo, ruleta, alertas de
huérfanos, asignador de entrantes e historial local con backup JSON. Nada de eso requiere
backend, cuenta ni base de datos en la nube.

### 2.4. Historias de usuario por epic

| Epic | Archivos | Dentro del MVP | Fuera | Ambiguas |
| :--- | ---: | :--- | :--- | :--- |
| Epic 1: Core (offline, sin registro) | 11 | US-01, US-02, US-03 y 6 TSK | 0 | TSK-1.5, TSK-1.2 |
| Epic 2: Advanced & Gamification | 14 | US-04…US-09, US-15 y 7 TSK | 0 | 0 |
| Epic 3: Cloud & Sync | 10 | 0 | **US-10, US-11, US-12 y 7 TSK** | 0 |
| Epic 4: Analytics & Exports | 7 | US-13, TSK-4.1, TSK-4.4, TSK-4.5 | 0 | US-14, TSK-4.2, TSK-4.3 |

- El **epic 3 está íntegramente fuera del producto entregado** (10 de 10 archivos) y es la mayor
  superficie de trabajo no realizado.
- `TSK-1.5.md:18` ramifica hacia una «API de Firebase Functions»; `TSK-1.2.md:10` declara una
  interfaz para «posterior migración/sync a Firestore».
- `TSK-4.2.md:6` depende de `TSK-3.4` (nube) y `TSK-4.3.md:17` apunta a Firebase Cloud
  Functions: dos tareas de un epic local que dependen de un epic no entregado.
- **US-15 no está en el backlog.** Solo existe en `user-stories/` y en la matriz
  (`user_stories_traceability.md:25`); `backlog.md` llega hasta US-14.

### 2.5. Diagramas Mermaid: 8 de 9 describen lo planificado

| Documento | Línea | Tipo | Veredicto |
| :--- | ---: | :--- | :--- |
| `readme.md` | 78 | `graph TD` | Planificado (Dexie, SyncManager, Firestore, Cloud Vision) |
| `readme.md` | 122 | `erDiagram` | Planificado **y contradictorio** con `data_schema.md`: introduce `USER` y una entidad `ALLOCATION` separada |
| `c4_model.md` | 11 | `graph TD` | Planificado (Cloud Vision, Bizum) |
| `c4_model.md` | 37 | `graph TB` | Planificado (FirebaseAuth, Firestore, CloudFunctions) |
| `c4_model.md` | 77 | `graph TD` | Planificado (`LocalDBRepo`, `SyncManager`) |
| `c4_model.md` | 116 | `graph TD` | Planificado (backend serverless completo) |
| `c4_model.md` | 137 | `classDiagram` | **Parcialmente alineado**: el algoritmo de céntimos existe (`frontend/src/lib/calc.ts`), las clases no |
| `data_schema.md` | 122 | `sequenceDiagram` | Planificado (sync Dexie ↔ Firestore) |
| `technical_plan.md` | 13 | `graph TD` | Planificado (Firebase Functions, Cloud Firestore) |

### 2.6. Duplicación, huérfanos y enlaces rotos

**Duplicación y contradicción:**

- Las 14 historias de usuario están **duplicadas literalmente** entre `backlog.md:44-493` y
  `docs/user-stories/**`, y ya divergen (US-15 falta en el backlog).
- El **contrato de datos está triplicado** y se autocontradice: `readme.md:122-157` frente a
  `data_schema.md:7-114`.
- El **contrato de API está duplicado y contradicho**: `readme.md:167-174` define `processOcr`
  como Callable Function; `integration_contracts.md:7-14` define `POST /api/v1/ocr` como REST.
- **Colisión de identificadores TSK** entre `technical_plan.md` y `backlog.md`:
  `TSK-2.1` (UI Framework vs Penny Adjustment), `TSK-3.1` (OCR Processing vs SDK de Firebase) y
  `TSK-5.1`, que no existe en ningún epic.
- `readme.md:181` define US-02 como «Soporte Offline»; `backlog.md:78` la define como «Manual
  Editing and OCR Fallback».

**Documentos huérfanos** (sin ninguna referencia entrante): `skill-style-guide.md`,
`tech-lead/backlog.md`, `tech-lead/technical_plan.md`, `prd/PRD.md` y `qa/judgment_report.md`.

**Enlaces rotos y referencias inexistentes:**

| Documento | Línea | Objetivo | Estado |
| :--- | ---: | :--- | :--- |
| `judgment_report.md` | 32 | `../../.agents/skills/product-owner/SKILL.md`, `tech-lead/SKILL.md` | Rotos: `.agents/` no existe |
| `readme.md` | 68, 108, 195 | `.env.example`, `firestore.rules` | Rotos: no existen |
| `US-15.md` | 91-95 | `OCRScanner.tsx`, `Allocation.tsx`, `BillingHUD.tsx`, `PayerWheel.tsx` | Rotos: ninguna existe |
| Varios | — | anclas `#Lx` y `#Lx-Ly` sobre archivos `.md` | No resolubles en GitHub |

**Rutas de código desalineadas:** las US y TSK referencian `src/**` mientras el código entregado
vive en `frontend/src/**` (por ejemplo `src/services/db/SplitEatDatabase.ts` en `TSK-1.2.md:16`,
`src/utils/mathHelper.ts` en `TSK-2.1.md:14`, `functions/src/ocr/ocrHandler.ts` en
`TSK-3.5.md:13`; **las tres son rutas retiradas que nunca existieron**). Son más de 40 referencias
que no resuelven.

---

## 3. Estructura destino

### 3.1. Índice maestro

Se crea **`docs/README.md`** como única puerta de entrada. Agrupa los documentos en siete
dominios, indica para cada uno qué contiene y en qué estado se encuentra, y advierte de forma
explícita qué pertenece al **MVP entregado** y qué al **alcance evolutivo**. Enlaza también
`docs/DOC-STANDARD.md`, el estándar de escritura dual que gobierna todos los documentos.

### 3.2. Dominios

| # | Carpeta | Dominio | Ficheros |
| :--- | :--- | :--- | :--- |
| 1 | `product/` | Producto y alcance | `brief.md`, `prd.md`, `backlog.md`, `user-stories/**` |
| 2 | `architecture/` | Arquitectura | `overview.md`, `stack.md`, `decisions.md` |
| 3 | `data/` | Datos y persistencia | `local-model.md`, `scope-evolution.md` |
| 4 | `integrations/` | Integraciones | `contracts.md` |
| 5 | `quality/` | Calidad | `testing-strategy.md`, `judgment-report.md` |
| 6 | `process/` | Proceso y entrega | `technical-plan.md`, `delivery-and-branching.md`, `ai-workflow.md` |
| 7 | `traceability/` | Trazabilidad y evidencia | `user-stories-traceability.md`, `evidence.md` |

Los nombres de carpeta y de fichero van en **inglés**, por coherencia con la convención de
artefactos técnicos del repositorio; el **contenido** va en español.

Dos dominios llevan más de un fichero porque su contenido tiene naturalezas distintas que conviene
no mezclar: `data/` separa el modelo local real de la evolución del alcance, y `architecture/`
separa la vista del sistema, el stack y el registro de decisiones.

`docs/skill-style-guide.md` **no forma parte de esta estructura**: es un artefacto interno y sale
de `docs/` (ver secciones 3.3 y 9).

### 3.3. Migración de archivos

Renombrado completo a nomenclatura de dominios. **Las 42 historias de usuario referencian estos
documentos con rutas relativas, por lo que el renombrado rompe enlaces**: repararlos es el objeto
de T10 y no es opcional.

| Origen | Destino | Acción |
| :--- | :--- | :--- |
| `prd/brief.md` | `product/brief.md` | Renombrar carpeta y fichero |
| `prd/PRD.md` | `product/prd.md` | Renombrar carpeta y fichero |
| `tech-lead/backlog.md` | `product/backlog.md` | Mover a producto |
| `user-stories/**` (42) | `product/user-stories/**` | Mover a producto |
| `architecture/c4_model.md` | `architecture/overview.md` | Renombrar y reescribir como as-is |
| `tech-lead/tech_stack.md` | `architecture/stack.md` | Mover a arquitectura |
| — | `architecture/decisions.md` | Nuevo |
| `db/data_schema.md` | `data/local-model.md` | Renombrar y reescribir |
| — | `data/scope-evolution.md` | Nuevo: evolución de la BD |
| `api/integration_contracts.md` | `integrations/contracts.md` | Renombrar y reencuadrar |
| `qa/testing_strategy.md` | `quality/testing-strategy.md` | Renombrar y reencuadrar |
| `qa/judgment_report.md` | `quality/judgment-report.md` | Renombrar y reencuadrar con nota de estado |
| `tech-lead/technical_plan.md` | `process/technical-plan.md` | Renombrar y reencuadrar |
| `tech-lead/deployment_branching.md` | `process/delivery-and-branching.md` | Renombrar y reencuadrar |
| — | `process/ai-workflow.md` | Nuevo |
| `user_stories_traceability.md` | `traceability/user-stories-traceability.md` | Renombrar |
| — | `traceability/evidence.md` | Nuevo |
| — | `docs/README.md` | Nuevo índice maestro |
| — | `docs/DOC-STANDARD.md` | Nuevo: estándar de escritura dual (sección 3.4) |
| `skill-style-guide.md` | `.agents/skill-style-guide.md` | Sale de `docs/`: artefacto interno |

Carpetas que desaparecen de `docs/`: `prd/`, `db/`, `api/`, `qa/`, `tech-lead/` y
`user-stories/` (esta última pasa a `product/user-stories/`).

---

### 3.4. Estándar de escritura dual (personas y agentes)

Los documentos deben ser legibles por una persona y utilizables por un agente de IA **sin
reinterpretación**. Eso no se consigue escribiendo «más estructurado» ni «más narrativo», sino
separando lo que cada audiencia necesita:

| Audiencia | Qué necesita | Dónde vive |
| :--- | :--- | :--- |
| Persona | Por qué se decidió, contexto, alternativas, consecuencias | Prosa |
| Agente | Qué es cierto, con qué identificador y desde cuándo | Tablas y frontmatter |

**Regla de balanceo: los hechos van en tablas, las razones en prosa.** Un hecho que solo existe
en un párrafo obliga al agente a interpretar; una razón que solo existe en una tabla obliga a la
persona a descifrar. El estándar no pide documentos más densos, pide que cada cosa esté donde se
puede consumir.

Este repositorio ya tiene un precedente: `skill-style-guide.md` define un esqueleto con secciones
marcadas y un bucle de autoverificación. El estándar de documentación adopta esa misma disciplina
sin perder la narrativa que necesita una persona.

#### a) Frontmatter obligatorio

```yaml
---
doc_id: architecture/overview
title: Arquitectura del sistema (as-is)
domain: architecture
audience: [human, agent]
status: entregado        # entregado | parcial | latente | descartado | planificado | mixto
source_of_truth_for:
  - arquitectura de contenedores
  - integración de OCR
supersedes:
  - architecture/c4_model
last_verified: 2026-09-22
verified_against: c66fd3f
---
```

`doc_id` es un identificador **estable**: los documentos se referencian por `doc_id`, no por
ruta, porque las rutas cambian y los identificadores no. `status` y `verified_against` son los dos
campos que atacan el problema central del proyecto: permiten detectar de forma mecánica si un
documento describe algo entregado y si sigue vigente respecto a un commit.

#### b) Esqueleto fijo de documento de dominio

1. `## Resumen` — un párrafo; primero la conclusión.
2. `## Estado` — tabla con el vocabulario de estado.
3. `## Detalle` — prosa y tablas de soporte.
4. `## Decisiones` — tabla con identificadores `DEC-xx`.
5. `## Cómo verificar este documento` — checklist con comandos ejecutables.
6. `## Referencias` — rutas canónicas y documentos relacionados.

Los títulos son legibles para una persona; el contenido de los apartados 2, 4 y 5 es directamente
consumible por un agente.

#### c) Vocabulario de estado único

| Término | Significado |
| :--- | :--- |
| `entregado` | Existe en el producto y funciona |
| `parcial` | Existe con alcance reducido o incompleto |
| `latente` | Pendiente, con vía de retorno abierta |
| `descartado` | No se hará; sin vía de retorno |
| `planificado` | Previsto, sin trabajo iniciado |
| `mixto` | El documento cubre más de un estado y lo declara por secciones |

Este vocabulario sustituye a las expresiones ambiguas («previsto», «se usará», «está definido»)
que produjeron el desfase de la sección 2.

#### d) Diagramas con acompañamiento textual

Todo bloque Mermaid lleva debajo una tabla o lista con los mismos nodos y relaciones. Un agente
puede no renderizar el diagrama; sin el acompañamiento, el contenido se pierde. Los nombres de los
nodos deben coincidir con los del código y con los del texto que los rodea.

#### e) Rutas canónicas

Las referencias se escriben **relativas a la raíz del repositorio** (`frontend/src/lib/scan/`), no
con enlaces relativos profundos (`../../`). El renombrado de la sección 3.3 rompe las rutas
relativas de las 42 historias de usuario: es la prueba de por qué existe esta regla.

#### f) Identificadores

| Prefijo | Uso |
| :--- | :--- |
| `DEC-xx` | Decisión de arquitectura o alcance |
| `F-xx` | Función del producto (ya en uso) |
| `US-xx` | Historia de usuario (ya en uso) |
| `TSK-x.y` | Tarea técnica (ya en uso) |
| `RISK-xx` | Riesgo |
| `doc_id` | Documento |

#### g) Fuente canónica declarada

Cada hecho que hoy está triplicado (contrato de datos, contrato de API, historias de usuario)
declara **un** documento como fuente canónica mediante `source_of_truth_for`. Los demás
referencian; no repiten.

#### h) Dónde vive el estándar

Este apartado es el resumen normativo. La versión completa y autosuficiente, con plantillas
copiables para cada tipo de documento, vive en **`docs/DOC-STANDARD.md`**, creado en T0.

---

## 4. Tratamiento del alcance no entregado

Regla única, aplicada a todos los documentos **salvo `openspec/`**, que se mantiene intacto
(decisión 4 de la sección 8): **lo planificado no se borra, se reencuadra**.

Cada documento que hoy declara la base de datos o la nube como alcance vigente pasa a separar
explícitamente tres bloques:

1. **Alcance entregado (MVP):** lo que existe y funciona sin backend.
2. **Alcance evolutivo:** qué se planificó, en qué punto quedó y por qué. Se distingue entre
   **descartado** y **latente** según la sección 8.1.
3. **Trazabilidad:** qué partes del documento original se conservan como registro histórico.

Casos concretos:

- **`product/prd.md`**: F-01…F-11 quedan como MVP entregado; F-12…F-14 y las métricas ligadas a
  «base de datos cloud» pasan a alcance evolutivo, no a requisitos «Should».
- **`data/local-model.md`** y **`data/scope-evolution.md`**: el primero describe el modelo real
  (`localStorage` + Zustand); el segundo conserva Dexie/IndexedDB y Cloud Firestore como
  evolución, con el motivo de descarte y la mitigación que sobrevivió (backup JSON).
- **`process/technical-plan.md`**: el OCR de servidor se marca como **latente**, no como
  abandonado, coherente con que el motor `'server'` sigue declarado en el código.
- **`product/backlog.md`**: el epic 3 deja de figurar como trabajo pendiente y pasa a alcance
  abandonado. Se resuelve la colisión de IDs TSK contra `process/technical-plan.md`.
- **`quality/judgment-report.md`**: se conserva íntegro pero se antepone una nota de estado que
  aclara que certificó documentos hoy obsoletos y que su veredicto **no** valida el producto
  entregado. Es el punto de mayor riesgo del conjunto.
- **`quality/testing-strategy.md`**: se sustituye la integración con `fake-indexeddb` por la
  estrategia real (Vitest + Testing Library sobre `localStorage`).

---

## 5. Diagramas

### 5.1. Diagramas obsoletos: se conservan como registro histórico

Los nueve bloques Mermaid existentes describen el estado planificado, y ocho de ellos son
diagramas de la arquitectura de datos y nube que se descartó. **No se borran**: se trasladan a
`data/scope-evolution.md`, que es el documento donde ese alcance se documenta como evolución. Allí
quedan como registro de lo que se planificó, con una nota que aclara que no describen el producto
entregado.

El `classDiagram` de céntimos es el único parcialmente alineado: el algoritmo existe
(`frontend/src/lib/calc.ts`), las clases no. Se corrige en `architecture/overview.md`.

### 5.2. Diagramas nuevos: entregados

| # | Diagrama | Ubicación | Qué muestra |
| :--- | :--- | :--- | :--- |
| D1 | Casos de uso | `product/prd.md` | Actores y los flujos del MVP entregado, derivados de las rutas reales de `frontend/src/main.tsx` |
| D2 | Arquitectura as-is | `architecture/overview.md` | Contenedores reales: PWA, `localStorage`/Zustand, worker de OCR, capa de dominio, service worker y despliegue estático; **sin** nodos de nube |
| D3 | Estado actual | `traceability/evidence.md` | Los 42 elementos del backlog por área funcional, contra los cuatro estados |

Los tres se entregaron en T9 y cada uno lleva su acompañamiento textual obligatorio (sección 3.4.d).

---

## 6. Backlog de tareas

### 6.1. Resumen

| # | Tarea | Fase | Depende de | Tamaño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T0 | Estándar de escritura dual (personas y agentes) | Andamiaje | — | M | `entregado` |
| T1 | Índice maestro y migración de archivos | Andamiaje | T0 | M | `entregado` |
| T2 | Dominio producto y alcance | Reescritura | T1 | L | `entregado` |
| T3 | Dominio arquitectura | Reescritura | T1 | L | `entregado` |
| T4 | Dominio datos y persistencia | Reescritura | T1 | M | `entregado` |
| T5 | Dominio integraciones | Reescritura | T1 | S | `entregado` |
| T6 | Dominio calidad | Reescritura | T1 | M | `entregado` |
| T7 | Dominio proceso y entrega | Reescritura | T1 | M | `entregado` |
| T8 | Dominio trazabilidad y evidencia | Reescritura | T1 | M | `entregado` |
| T9 | Diagramas Mermaid (D1, D2, D3) | Diagramas | T2, T3, T8 | M | `entregado` |
| T10 | Reparación transversal de enlaces y rutas | Reparación | T2–T8 | M | `entregado`, absorbida por T10a y T10b |
| T11 | Raíz: `readme.md`, `ROUTING_FEASIBILITY.md`, `prompts.md` | Reparación | T2, T3 | L | `planificado` |
| T12 | Verificación y cierre | Cierre | T1–T11 | S | `entregado` |

El commit que cierra cada tarea es su evidencia y está en el historial de la rama
`docs/project-evolution`. Esta columna es el único lugar donde se declara el avance de la
ejecución; no se duplica en otro documento.

Orden de ejecución: **T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12**.
Un commit de unidad de trabajo por tarea.

Todas las tareas de reescritura (T2–T8 y T11) incorporan a su definición de terminado el
cumplimiento del estándar de la sección 3.4: frontmatter completo, esqueleto fijo, vocabulario de
estado, acompañamiento textual de cada diagrama y fuente canónica declarada.

### 6.2. Fichas

#### T0 — Estándar de escritura dual

- **Objetivo:** definir el estándar que gobierna todos los documentos y dejarlo en
  `docs/DOC-STANDARD.md`, para que T1–T12 lo apliquen en lugar de improvisarlo.
- **Contenido obligatorio:** frontmatter con `doc_id`, `status`, `source_of_truth_for`,
  `last_verified` y `verified_against`; esqueleto fijo de seis apartados; vocabulario de estado
  único; regla de acompañamiento textual de diagramas; convención de rutas canónicas; tabla de
  identificadores; regla de fuente canónica; plantillas copiables para documento de dominio,
  índice y registro de decisiones.
- **Pasos:** redactar el estándar; incluir un ejemplo completo resuelto de cada plantilla; añadir
  la sección de autoverificación del propio estándar.
- **Criterios de aceptación:** el estándar permite escribir un documento de dominio nuevo sin
  consultar nada más; cada regla es verificable mecánicamente; incluye al menos una plantilla
  completa y un ejemplo resuelto.
- **Evidencia esperada:** `docs/DOC-STANDARD.md` con las plantillas y el ejemplo.
- **Tamaño:** M.

#### T1 — Índice maestro y migración de archivos

- **Objetivo:** crear `docs/README.md` como puerta de entrada por dominios y ejecutar el
  renombrado completo de la tabla 3.3.
- **Pasos:** crear el índice con los siete dominios, el estado de cada documento y la advertencia
  MVP frente a evolutivo; ejecutar el renombrado con `git mv` para conservar el historial; crear
  los cinco documentos nuevos con su encabezado (`decisions.md`, `scope-evolution.md`,
  `ai-workflow.md`, `evidence.md` y el propio índice).
- **Criterios de aceptación:** el índice enlaza todos los documentos existentes; ningún enlace
  del índice apunta a un archivo inexistente; los movimientos conservan el historial de git; no
  queda ninguna carpeta de la taxonomía anterior en `docs/`.
- **Evidencia esperada:** árbol de `docs/` y salida de `git status`.

#### T2 — Dominio producto y alcance

- **Objetivo:** separar el MVP entregado del alcance evolutivo y eliminar las contradicciones de
  este dominio.
- **Documentos:** `product/brief.md`, `product/prd.md`, `product/backlog.md`,
  `product/user-stories/**` (42).
- **Puntos obligatorios:**
  1. F-01…F-11 como MVP entregado; F-12…F-14 como alcance evolutivo.
  2. Resolver la **duplicación literal de las 14 US** entre backlog y `user-stories/`.
  3. Resolver la **colisión de IDs TSK** con `technical_plan.md` (`TSK-2.1`, `TSK-3.1`, `TSK-5.1`).
  4. Incorporar **US-15** al backlog.
  5. Marcar el **epic 3** como alcance abandonado, no como pendiente.
  6. Corregir la definición contradictoria de **US-02** (`readme.md:181` frente a `backlog.md:78`).
  7. Corregir las rutas `src/**` → `frontend/src/**` en US y TSK.
- **Criterios de aceptación:** una sola fuente de verdad por historia de usuario; ningún ID TSK
  duplicado o inexistente; ninguna ruta de código que no resuelva.
- **Tamaño:** L.

#### T3 — Dominio arquitectura

- **Objetivo:** que la arquitectura documentada sea la del producto entregado.
- **Documentos:** `architecture/overview.md`, `architecture/stack.md`,
  `architecture/decisions.md` y `data/scope-evolution.md` (recepción de los diagramas).
- **Puntos obligatorios:**
  1. Reescribir el C4 como as-is: PWA, `localStorage`/Zustand, worker de OCR, capa de dominio.
  2. Trasladar los cuatro diagramas de nube de `overview.md` a `data/scope-evolution.md` como
     registro histórico, con nota de que no describen el producto entregado. **No se borran.**
  3. Corregir `stack.md`: Tailwind v4 + Radix UI, persistencia real, OCR en dispositivo; retirar
     la justificación que descarta Tailwind y los apartados de CVEs de dependencias no usadas.
  4. Redactar `decisions.md` con las decisiones de arquitectura y stack, con identificadores
     `DEC-ARCH-xx`: contexto, alternativas, elección, motivo, fecha y estado, incluidas las
     descartadas.
  5. Corregir el `classDiagram` de céntimos para que refleje `frontend/src/lib/calc.ts`.
- **No incluye:** generar los diagramas nuevos D1, D2 y D3, diferidos a T9 (sección 5.2).
- **Criterios de aceptación:** ningún nodo, arista o tecnología del C4 sin correspondencia en el
  código; cada decisión de `decisions.md` con los cinco campos y fuente citada.
- **Tamaño:** L.

#### T4 — Dominio datos y persistencia

- **Objetivo:** documentar el modelo de datos real y convertir la base de datos en evolución del
  alcance.
- **Documentos:** `data/local-model.md` y `data/scope-evolution.md` (dos ficheros: el modelo real
  y la evolución del alcance).
- **Puntos obligatorios:**
  1. Modelo local real: claves de `localStorage`, estructura de Zustand persist, ciclo de vida.
  2. Sección de evolución: Dexie/IndexedDB y Cloud Firestore planificados, motivo del descarte
     y qué se conserva (por ejemplo, el backup JSON como mitigación de la pérdida de datos).
  3. Retirar el `import Dexie` y el esquema de Firestore como vigentes.
  4. Reemplazar el `sequenceDiagram` de sincronización.
- **Criterios de aceptación:** el modelo descrito coincide con lo que persiste la aplicación;
  toda afirmación de nube está marcada como no entregada.
- **Tamaño:** M.

#### T5 — Dominio integraciones

- **Objetivo:** resolver el contrato de API contradictorio.
- **Documentos:** `integrations/contracts.md`.
- **Puntos obligatorios:**
  1. Declarar qué integraciones existen realmente en el producto entregado.
  2. Resolver la contradicción `processOcr` (Callable) frente a `POST /api/v1/ocr` (REST).
  3. Conservar los contratos planificados como evolución.
- **Criterios de aceptación:** un único contrato por integración; ninguna integración
  documentada como vigente sin implementación.
- **Tamaño:** S.

#### T6 — Dominio calidad

- **Objetivo:** alinear la estrategia de calidad con lo realmente verificado y neutralizar el
  riesgo del reporte de juicio.
- **Documentos:** `quality/testing-strategy.md`, `quality/judgment-report.md`.
- **Puntos obligatorios:**
  1. Estrategia real: Vitest + Testing Library sobre `localStorage`; retirar `fake-indexeddb`,
     transacciones Dexie y verificación de push a Firestore.
  2. Documentar el gate de CI real (build, lint con `max-warnings 0`, typecheck, tests).
  3. Anteponer a `judgment_report.md` una **nota de estado** que aclare que certificó documentos
     hoy obsoletos y que su veredicto no valida el producto entregado.
- **Criterios de aceptación:** ninguna práctica de prueba documentada sin correspondencia en el
  repositorio; el reporte de juicio no puede leerse como validación vigente.
- **Tamaño:** M.

#### T7 — Dominio proceso y entrega

- **Objetivo:** documentar el proceso real de entrega y el uso de IA.
- **Documentos:** `process/technical-plan.md`, `process/delivery-and-branching.md`,
  `process/ai-workflow.md`.
- **Nota:** `skill-style-guide.md` **no** entra aquí; sale de `docs/` por ser artefacto interno
  (sección 3.3).
- **Puntos obligatorios:**
  1. `technical_plan.md`: MVP sin backend; retirar la «Task 5: Optional Auth & Cloud
     Synchronization», la rama `release/mvp-offline` y el `TSK-5.1` inexistente.
  2. `deployment_branching.md`: Netlify + Vercel reales; retirar Firebase Hosting,
     `VITE_FIREBASE_*` y `VISION_API_KEY`.
  3. `ai-workflow.md`: ciclo de trabajo con IA, skills y sus disparadores, puertas de
     aprobación, subagentes, worktrees aislados y qué decidió la persona frente a qué ejecutó la IA.
- **Criterios de aceptación:** el pipeline documentado coincide con los cinco workflows reales;
  separación explícita entre decisión humana y ejecución asistida.
- **Tamaño:** M.

#### T8 — Dominio trazabilidad y evidencia

- **Objetivo:** que la trazabilidad apunte a código que existe y que las métricas sean
  reproducibles.
- **Documentos:** `traceability/user-stories-traceability.md` (movido),
  `traceability/evidence.md` (nuevo).
- **Puntos obligatorios:**
  1. Reparar las 4 rutas inexistentes de US-15 y el resto de referencias a vistas que no existen.
  2. Enlazar cada US con su evidencia real (commits o PRs) cuando exista.
  3. `evidence.md`: commits, merges, etiquetas, archivos de test, workflows, URLs de despliegue y
     estado de acceso, cada métrica con el comando que la produce.
- **Criterios de aceptación:** cero referencias a archivos inexistentes; cada métrica
  reproducible con el comando indicado.
- **Tamaño:** M.

#### T9 — Diagramas Mermaid

> **Ejecutada.** Los tres diagramas y sus acompañamientos están entregados; ver la sección 5.2.

- **Objetivo:** generar los tres diagramas acordados y revisar los nueve existentes.
- **Entregables:** D1 en `product/prd.md`, D2 en `architecture/overview.md`, D3 en
  `traceability/evidence.md`.
- **Puntos obligatorios:** corregir el `classDiagram` de céntimos para que refleje
  `frontend/src/lib/calc.ts`; eliminar o reemplazar los ocho diagramas planificados; añadir a cada
  uno de los tres diagramas nuevos su **acompañamiento textual** obligatorio (sección 3.4.d), de
  modo que un agente que no renderice Mermaid reciba igualmente nodos y relaciones.
- **Criterios de aceptación:** los tres diagramas renderizan; ningún nodo sin correspondencia en
  el código; sin diagramas duplicados entre documentos; los tres tienen tabla o lista de
  acompañamiento con los mismos nodos y relaciones.
- **Tamaño:** M.

#### T10 — Reparación transversal de enlaces y rutas

> **Ejecutada en su mayor parte** en la pasada de coherencia previa a T5 (commit `9ea52bd`).

- **Objetivo:** que ningún enlace del conjunto esté roto tras el renombrado de T1.
- **Ya hecho:** reparados los 21 enlaces de la matriz de trazabilidad y los 6 del reporte de juicio;
  convertidos a texto los 2 enlaces a `.agents/skills/**`, que apuntan a rutas locales fuera del
  versionado; eliminadas las anclas `#Lx`, que no son resolubles; y convertidos los **97 enlaces del
  conjunto** a la forma relativa a la raíz con barra inicial, que resuelve tanto en el renderizador
  de GitHub como en un script. Verificado: 0 problemas.
- **Pendiente:**
  1. Revisar las **12 historias de usuario que enlazan a `data/local-model.md` esperando el esquema
     descartado de Dexie** (`Participant`, `ItemAllocation`, `allocations`, `pennyAdjustment`,
     `isGroup`, y en US-14 «persistencia anónima local antes de su envío a Firestore»). El enlace
     resuelve, pero el documento describe ahora el esquema entregado: el texto debe dejar de
     prometer entidades que no existen.
  2. Reparar `.env.example` y `firestore.rules` en `readme.md`, que se resuelven en T11.
- **Criterios de aceptación:** cero enlaces rotos y cero anclas no resolubles en `docs/` y en la
  raíz; ninguna historia promete entidades que no existen.
- **Tamaño:** L.

#### T11 — Raíz del repositorio

- **Objetivo:** alinear la puerta de entrada del proyecto con la realidad.
- **Documentos:** `readme.md`, `ROUTING_FEASIBILITY.md`, `prompts.md`.
- **Puntos obligatorios:**
  1. `readme.md`: corregir las afirmaciones sobre Firebase, Dexie, IndexedDB, Vanilla CSS y
     Firebase Hosting; reemplazar sus dos diagramas; enlazar `docs/README.md`.
  2. `readme.md`: corregir las definiciones de US-02 y la asignación de `TSK-2.1`, que
     contradicen el backlog.
  3. `prompts.md`: actualizar el registro de uso de IA o marcarlo como histórico.
  4. `ROUTING_FEASIBILITY.md`: reencuadrar como documento de investigación, indicando si sus
     conclusiones se aplicaron.
- **Criterios de aceptación:** ninguna afirmación del `readme.md` contradice el código; los tres
  documentos de la raíz aparecen enlazados desde el índice.
- **Tamaño:** L.

#### T12 — Verificación y cierre

- **Objetivo:** garantizar coherencia del conjunto y entregarlo.
- **Verificación ejecutada el 2026-09-22:**

| Comprobación | Resultado |
| :--- | ---: |
| Enlaces en `docs/` y en la raíz | 288, con **0 problemas** |
| Documentos con frontmatter | **64 de 64** |
| Estados fuera del vocabulario cerrado | 0 |
| Diagramas sin acompañamiento textual | 0 |
| Expresiones ambiguas en uso | 0 |
| Colisiones de identificadores `DEC-<DOM>-xx` | 0 |
| Discrepancias entre el índice y los frontmatter | 0 |
| Registros `entregado` que citan ficheros inexistentes sin bloque de correspondencia | 0 |
| Anclas internas del índice del `readme.md` | 10, **las 10 resuelven** |

- **Criterios de aceptación:** cero enlaces rotos, cumplido; sin contradicciones cruzadas,
cumplido; el PR queda pendiente de la decisión del usuario.
- **Pendiente de decisión del usuario:**
  1. Abrir el PR hacia `feature/feature-entrega2-ADLC`.
  2. Qué hacer con las **cuatro limitaciones de código** encontradas durante la reorganización. Son
     cambios de código, no de documentación, y por eso quedan fuera de esta rama:

| Limitación | Evidencia |
| :--- | :--- |
| El listado de historial no es alcanzable | Ningún archivo navega a `'/tickets'`; la vista existe y está enrutada |
| `frontend/src/components/Drawer.tsx` es código muerto | Nadie lo importa; declara cinco enlaces a rutas inexistentes |
| `frontend/src/hooks/useBlocker.ts` es código muerto | Nadie lo importa; el bloqueo de cambios sin guardar no está conectado |
| `settings.roundingMode` no tiene efecto | Declarado y persistido; no alimenta ningún cálculo |

- **Tamaño:** S.

---

## 7. Riesgos

| # | Riesgo | Mitigación |
| :--- | :--- | :--- |
| 1 | `judgment_report.md` certifica PASS sobre documentos obsoletos y cierra con firmas de auditoría; puede leerse como validación vigente | T6 antepone nota de estado; se conserva íntegro como registro histórico |
| 2 | Colisión de IDs TSK entre `technical_plan.md` y `backlog.md` rompe la trazabilidad cruzada | T2 resuelve el conflicto antes de cualquier consolidación |
| 3 | Las 14 US están duplicadas y ya divergieron (US-15 ausente del backlog) | T2 declara una única fuente de verdad y sincroniza ambas |
| 4 | El contrato de datos y API está triplicado y se autocontradice | T4 y T5 declaran explícitamente la fuente canónica |
| 5 | El epic 3 puede presentarse como backlog vivo en lugar de alcance abandonado | T2 lo marca como abandonado con su motivo |
| 6 | Cinco documentos son huérfanos: moverlos sin índice deja la navegación sin puerta de entrada | T1 crea el índice antes de mover nada |
| 7 | Más de 40 referencias de código apuntan a `src/**` en lugar de `frontend/src/**` | T2 y T8 las corrigen; cualquier inventario posterior heredaría el error |
| 8 | El motor OCR `'server'` sigue declarado en el código entregado (`frontend/src/lib/types.ts:133`, `frontend/src/workers/ocr.worker.ts:18`) sin contraparte de servidor | Decidido: es un cambio pendiente, se documenta como **alcance latente**. Cualquier cambio de código queda fuera de esta rama |
| 9 | Sobreestructurar los documentos hasta hacerlos ilegibles para una persona | El estándar de la sección 3.4 fija el balanceo: hechos en tablas, razones en prosa. T12 verifica legibilidad, no solo estructura |

---

## 8. Decisiones resueltas

| # | Decisión | Resolución |
| :--- | :--- | :--- |
| 1 | Taxonomía de carpetas | **Renombrar a nomenclatura de dominios.** Un dominio puede tener más de un fichero si mantiene coherencia. Aplicado en la tabla 3.3; el coste es que T10 pasa a ser una reparación completa de enlaces |
| 2 | Motor OCR `'server'` | **Es un cambio todavía pendiente.** Se documenta como alcance **latente**, no descartado. No se toca código en esta rama |
| 3 | `skill-style-guide.md` | **Artefacto interno**: sale de `docs/` y pasa a `.agents/skill-style-guide.md` |
| 4 | `openspec/` | **Se mantiene como está.** No se reorganiza, no se reescribe, no se mueve, y no forma parte del alcance de ninguna tarea de este plan |
| 5 | Audiencia de los documentos | **Dual: personas y agentes de IA.** Se aplica el estándar de la sección 3.4, con frontmatter, esqueleto fijo y acompañamiento textual de diagramas. Gobierna todas las tareas de reescritura |

### 8.1. Consecuencia sobre el relato del alcance

Como el motor OCR `'server'` sigue siendo un cambio pendiente, la nube **no** se documenta como
alcance descartado sin matices. La regla de la sección 4 se aplica así:

- **Descartado en el MVP:** Firebase Auth, Firestore, Cloud Functions y Firebase Hosting, que no
tienen ninguna vía de retorno abierta en el producto entregado.
- **Latente:** el motor OCR de servidor y, con él, la posibilidad de un OCR remoto de mayor
  precisión. Se documenta como pendiente, no como abandonado.
- **Descartado con mitigación conservada:** Dexie/IndexedDB, sustituido por `localStorage` con
  backup JSON.

---

## 9. Fuera de alcance de esta rama

- La ejecución de T1–T12: esta rama contiene únicamente el plan.
- **`openspec/`**: se mantiene exactamente como está (decisión 4 de la sección 8).
- Modificar código en `frontend/src`: el motor OCR `'server'` es un cambio pendiente y se aborda,
  si procede, en un PR separado.
- Push, apertura de PR y merge: decisiones del usuario.
- Estado en red de las URLs de despliegue: no verificado.

---

## 10. Trazabilidad

- Rama de trabajo: `docs/project-evolution`
- Rama de integración destino: `feature/feature-entrega2-ADLC`
- Política del proyecto: rama de trabajo → PR → rama de integración → `main`. El merge no es
  automático y requiere revisión explícita del usuario.
- Diagnóstico de la sección 2 obtenido por lectura directa de los 14 documentos de nivel superior
  y los 42 archivos de `user-stories/`, con `grep` y `find` sobre el árbol. Sin modificación de
  archivos durante el mapeo.
