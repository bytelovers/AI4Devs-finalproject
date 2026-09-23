# Feature: reorganización documental del proyecto

> **Rama:** `docs/project-evolution`
> **Worktree:** `spliteat-docs-evolution`
> **Base:** `feature/feature-entrega2-ADLC` @ `c66fd3f`
> **Inicio:** 2026-09-22
> **Entregable:** `docs/plan-reorganizacion.md`

## Alcance autorizado

Crear, en un worktree aislado y su propia rama, el **listado de tareas** para reorganizar la
documentación del proyecto: índice por dominios, reencuadre del alcance no entregado, diagramas
Mermaid y reparación de enlaces. Incluye el diagnóstico verificado que sustenta cada tarea.

## Fuera de alcance (decidido por el usuario)

- Ejecutar las tareas T1–T12 del plan.
- Modificar código en `frontend/src`.
- Push, apertura de PR y merge.

## Revisiones del alcance

| Revisión | Qué cambió | Motivo |
| :--- | :--- | :--- |
| v1 | Plan de 9 tareas creando `docs/evolution/` con 8 documentos | Planteamiento inicial |
| v2 | **Descartado**: el apartado `evolución` no se crea. El trabajo es reorganizar la documentación existente. La base de datos sale del MVP y pasa a alcance evolutivo. Se añaden 3 diagramas Mermaid, se incluye la raíz del repo y se amplía a 12 tareas | Indicación del usuario tras revisar v1 |
| v2 | `docs/evolution/PLAN.md` → `docs/plan-reorganizacion.md`; se elimina `docs/evolution/` | No debe existir un apartado llamado «evolución» |
| v3 | Taxonomía: renombrado completo a dominios (`product/`, `architecture/`, `data/`, `integrations/`, `quality/`, `process/`, `traceability/`). `openspec/` se mantiene intacto. Motor OCR `'server'` documentado como **latente**. `skill-style-guide.md` sale de `docs/`. T10 pasa a reparación completa de enlaces (tamaño L) | Decisiones del usuario sobre la sección 8 del plan |
| v4 | Añadido el **estándar de escritura dual (personas y agentes)** como sección 3.4 y como **tarea T0**, que gobierna T1–T12. Nuevo entregable `docs/DOC-STANDARD.md`. Nuevo riesgo 9 (sobreestructurar). T9 exige acompañamiento textual de cada diagrama | La documentación debe ser legible por personas y utilizable por agentes de IA |

## Tareas de implementación

| # | Tarea | Estado | Evidencia |
| :--- | :--- | :--- | :--- |
| F1 | Crear worktree aislado y rama `docs/project-evolution` | Completada | `git worktree list` → `spliteat-docs-evolution` @ `c66fd3f` |
| F2 | Documento ODD de seguimiento | Completada | este archivo |
| F3 | Redactar el plan v1 | Completada | commit `6b57357` (luego reemplazado) |
| F4 | Mapear el árbol documental y su desfase | Completada | informe de `gentle-ai-explore`: 14 documentos de nivel superior, 42 historias, 9 diagramas, 5 huérfanos |
| F5 | Reescribir el plan como reorganización documental (v2) | Completada | `docs/plan-reorganizacion.md`: 12 tareas, 3 diagramas, 8 riesgos |
| F6 | Commit de la revisión | Pendiente | hash por registrar |
| F7 | Verificación y cierre | Pendiente | árbol limpio, sin push |

## Hallazgos verificados durante el mapeo

- 8 de 9 diagramas Mermaid describen el estado planificado.
- `qa/judgment_report.md:6,12,33` certifica PASS sobre documentos que describen otro producto y
  valida cumplimiento GDPR de un diseño de nube inexistente.
- Colisión de IDs TSK entre `technical_plan.md` y `backlog.md` (`TSK-2.1`, `TSK-3.1`) y `TSK-5.1`
  inexistente.
- Las 14 historias de usuario están duplicadas entre `backlog.md:44-493` y `user-stories/**`, y
  US-15 falta en el backlog.
- El contrato de datos está triplicado y se autocontradice (`readme.md:122-157` frente a
  `data_schema.md:7-114`); el de API enfrenta `processOcr` Callable con `POST /api/v1/ocr` REST.
- El epic 3 (cloud) está 100 % fuera del producto entregado (10 de 10 archivos).
- Más de 40 referencias de código apuntan a `src/**` en lugar de `frontend/src/**`.
- 5 documentos huérfanos y varios enlaces rotos (`.agents/skills/**`, `.env.example`,
  `firestore.rules`, 4 vistas de US-15).

## Registro de decisiones del usuario

| Decisión | Elección |
| :--- | :--- |
| Alcance de la primera entrega | Solo el listado de tareas |
| Idioma | Español; nombres de carpeta y fichero en inglés |
| Estructura | Índice a nivel de `docs/` y documentos divididos por dominios |
| Taxonomía | **Renombrar a nomenclatura de dominios**; un dominio puede tener más de un fichero |
| Alcance no entregado | Reencuadrar dentro de cada documento, sin apartado «evolución» |
| Archivos incluidos | `docs/` completo más `readme.md`, `ROUTING_FEASIBILITY.md` y `prompts.md` |
| `openspec/` | **Se mantiene como está**; fuera del alcance de todas las tareas |
| Motor OCR `'server'` | **Cambio pendiente**: se documenta como alcance latente, no descartado. Sin cambios de código |
| `skill-style-guide.md` | Artefacto interno: sale de `docs/` → `.agents/skill-style-guide.md` |
| Carpetas `backend/` y `db/` | **Se conservan**, cada una con un `README.md` que explica que se descartan por estar fuera de alcance. Nunca contuvieron código: su historial completo en todas las ramas es un commit (`ad7adc2`) y un archivo (`.keep`) |
| Diagramas | Casos de uso, arquitectura as-is y estado actual |
| Audiencia | **Dual: personas y agentes de IA.** Estándar de escritura con frontmatter, esqueleto fijo, vocabulario de estado único y acompañamiento textual de diagramas |
| Convención de ramas | Worktree hermano con prefijo `spliteat-`; rama propia; PR a la rama de integración |

## Commits

| Asunto | Alcance | Estado |
| :--- | :--- | :--- |
| `docs(evolution): add documentary backlog for project evolution` | plan v1 | Reemplazado por la revisión siguiente |
| `docs(plan): reframe as documentation reorganization by domain` | `docs/plan-reorganizacion.md`, este archivo | Vigente |

El hash exacto de cada commit se consulta con `git log --oneline` en la rama
`docs/project-evolution`.

## Siguiente paso

Ejecutar T0 → T12, un commit por tarea. **T0 (estándar de escritura dual)** va primero porque
gobierna cómo se escriben todos los documentos; T1 (índice maestro y renombrado a dominios)
desbloquea el resto; T10 crece a tamaño L porque el renombrado rompe las rutas relativas de las 42
historias de usuario.
