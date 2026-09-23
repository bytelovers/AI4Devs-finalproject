---
doc_id: routing-feasibility
title: Informe de viabilidad del enrutado por URL
domain: process
audience: [human, agent]
status: mixto
source_of_truth_for:
  - comparativa de librerías de enrutado y análisis de riesgos de la migración
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Informe de viabilidad del enrutado por URL

**Naturaleza de este documento.** Es un **informe de investigación**, no un plan de registro: no
propone trabajo futuro y no debe leerse como una propuesta sin resolver. Su recomendación **se
adoptó** y está implementada: `react-router-dom` v7 en modo data con `createBrowserRouter` en
`frontend/src/main.tsx`, y la utilidad de guarda de navegación entregada en
`frontend/src/hooks/useBlocker.ts`. La decisión canónica es `DEC-ARCH-05` en
[docs/architecture/decisions.md](/docs/architecture/decisions.md), y el cambio se integró en el
pull request #11 (`3994bec`, 2026-07-25). El valor del documento no es la propuesta, que ya se
ejecutó, sino la **comparativa de alternativas** y el **análisis de riesgos**, que son la parte que
no se reconstruye leyendo el código. El apartado `## Estado` separa lo adoptado de lo que quedó
parcial.

**Contexto histórico de la redacción.** Fecha del informe: 2025-07-19. Se escribió en el worktree
`frontend-routing` (rama `refactor/routing`) con exploración de solo lectura, antes de la
migración. Ese worktree ya no existe; el registro del cambio se conserva en
`openspec/changes/archive/2026-07-25-routing-refactor/`, que queda fuera del conjunto documental.

---

## Resumen

La arquitectura previa usaba el estado global de Zustand (`currentView`) como enrutador virtual sin
URL. La conclusión del informe fue que migrar a un enrutador real (`react-router-dom` v7) era viable
y recomendable, a cambio de un refactor de unos 15 a 20 archivos y atención a los casos límite del
asistente de ticket nuevo, que entonces vivía en un solo componente. La recomendación se adoptó con
la migración en dos fases y hoy está entregada: las rutas de nivel superior, las rutas anidadas del
asistente y la separación del estado de navegación respecto de la persistencia. Queda parcial la
guarda de navegación, que existe como utilidad sin consumidores, y la restauración de la posición de
scroll, que no se implementó. Este documento es la fuente canónica de la comparativa de librerías y
del análisis de riesgos de la migración; la decisión y su motivo son canónicos en
[docs/architecture/decisions.md](/docs/architecture/decisions.md) como `DEC-ARCH-05`.

## Estado

| Área | Estado | Evidencia |
| :--- | :--- | :--- |
| Comparativa de librerías de enrutado y análisis de riesgos | `entregado` | Se conserva íntegra en `## Comparativa de librerías` y `## Riesgos y casos límite`; es la fuente canónica de ambos hechos |
| Recomendación: `react-router-dom` v7 en modo data | `entregado` | `frontend/package.json` declara `react-router-dom` `^7.18.1`; `createBrowserRouter` en `frontend/src/main.tsx:4` y `:37` |
| Rutas de nivel superior | `entregado` | `frontend/src/main.tsx` declara `/`, `/contacts`, `/groups`, `/groups/:groupId`, `/tickets`, `/tickets/:ticketId`, `/settings`, `/settings/feature-flags` y una ruta de captura para el 404 |
| Rutas anidadas del asistente de ticket nuevo | `entregado` | `frontend/src/main.tsx` anida `capture`, `review`, `participants`, `assign` y `summary` bajo `tickets/new`, con `frontend/src/views/NewTicketShell.tsx` como contenedor |
| Pasos transitorios fuera de las rutas | `entregado` | No hay rutas `scanning` ni `ocr-review` en `frontend/src/main.tsx`: los dos pasos se resuelven como estado interno, que es lo que el informe recomendaba |
| Separación del estado de navegación respecto de la persistencia | `entregado` | `partialize` en `frontend/src/lib/store.ts:465-475` persiste datos y `draftTicketId`, y ninguna bandera de vista |
| Guarda de navegación al salir del formulario | `parcial` | La utilidad entregada existe en `frontend/src/hooks/useBlocker.ts` y los predicados por paso en `frontend/src/lib/wizard-loaders.ts:168-169`; ningún archivo la importa (`grep -rn 'import.*useBlocker' frontend/src` → 0 líneas fuera de su propia definición), de modo que la confirmación al salir no está activada |
| Restauración de la posición de scroll | `parcial` | No hay `ScrollRestoration` ni llamada a `window.scrollTo` en `frontend/src` (`grep -rn 'ScrollRestoration' frontend/src` → 0 líneas); el informe lo incluía como mitigación |
| Lista de tickets | `parcial` | `frontend/src/views/TicketsListView.tsx` existe y está enrutada en `/tickets`, pero no pagina y ninguna pantalla enlaza a esa ruta |
| Pruebas con envoltura de enrutador | `entregado` | `frontend/src/test-utils/render-with-router.tsx` ofrece la envoltura que el informe pedía añadir en `frontend/src/setupTests.ts` |

## Arquitectura previa a la migración

Fotografía del estado en el momento de escribir el informe, conservada como punto de partida del
análisis. Describe el sistema que se sustituyó, no el entregado: la vista actual se guardaba como
una bandera en el estado global y no había URL. El componente del asistente que aparece en la última
fila era un único archivo y hoy está sustituido por el contenedor y las vistas por paso.

| Componente previo | Responsabilidad | Ruta actual |
| :--- | :--- | :--- |
| `frontend/src/main.tsx` → `AppRouter` | Conmutación basada en `currentView` del estado global | `frontend/src/main.tsx` (hoy monta `createBrowserRouter`) |
| `frontend/src/lib/store.ts` | `currentView: ViewName`, `setView()`, `openTicket()`, `openGroup()`, `activeTicketId`, `activeGroupId` | `frontend/src/lib/store.ts` (hoy no hay bandera de vista: la ruta es la única fuente de verdad) |
| `frontend/src/lib/types.ts` | `ViewName`, la unión de vistas que hacía de tabla de rutas | `frontend/src/lib/types.ts` |
| `frontend/src/components/layout/AppShell.tsx` | Envoltura de las vistas con la navegación inferior y las transiciones; clave de animación `currentView + activeTicketId + activeGroupId` | `frontend/src/components/layout/AppShell.tsx` (hoy la clave es `location.pathname` y la navegación usa `NavLink`) |
| `frontend/src/views/NewTicketView.tsx` → vista de ticket nuevo previa | Estado interno de los pasos `capture → scanning → ocr-review → review → participants → assign → summary` en un solo componente, sin URLs | Ya no existe: lo sustituyen `frontend/src/views/NewTicketShell.tsx` y las vistas por paso bajo `frontend/src/views/` |
| `frontend/public/sw.js` | Respuesta desde caché para las peticiones de navegación | `frontend/public/sw.js` (sin cambios por la migración) |

## Comparativa de librerías

| Criterio | `react-router-dom` v7 | `wouter` | `@tanstack/router` |
| :--- | :--- | :--- | :--- |
| **Peso del bundle (gz)** | ~12 KB | ~1.5 KB | ~8 KB (núcleo) + generación de código |
| **Tipado** | Bueno (`RouteObject` en v7 y tipos de loader) | Básico | **Excelente** (por archivo o por código, con inferencia completa) |
| **Rutas anidadas** | Nativas (`children[]`) | Manuales | Nativas (por archivo o por código) |
| **Carga de datos** | `loader` y `action` al estilo de Remix | No ofrece | Sí (loaders con caché) |
| **Guardas de navegación** | `useBlocker` (v7) | No ofrece | `beforeLoad` |
| **Idoneidad para PWA y SSR** | Sí (la base de React Router 7 se comparte con Remix) | Solo cliente | Sí |
| **Curva de aprendizaje** | Media (la API de v7 es nueva) | Baja | Media-alta (conceptos nuevos) |
| **Integración con Zustand** | Manual (envolturas sobre `useNavigate`) | Manual | Manual |
| **Madurez del ecosistema** | **Muy alta** (Meta y Remix) | Alta, con comunidad pequeña | Creciente (TanStack) |

### Elección recomendada: `react-router-dom` v7 (modo data)

Razones del informe, tal como se escribieron:

1. **PWA y uso sin conexión**: la base de React Router 7 comparte diseño con Remix para SSR, SSG y
   SPA híbrida, y el service worker existente funcionaba sin cambios.
2. **Rutas anidadas nativas**: el asistente de ticket nuevo encaja en `children[]` con `outlet`.
3. **`useBlocker`**: necesario para el botón de retroceso que borra los borradores vacíos.
4. **Peso aceptable**: +12 KB gz es razonable para una PWA que ya carga el motor de OCR.
5. **Comunidad y longevidad**: la mantiene Meta y la migración futura a Remix es directa si se
   quiere SSR.

`wouter` era tentador por tamaño, pero no ofrece guardas ni rutas anidadas declarativas, de modo que
la lógica de guardias habría que reimplementarla a mano. `@tanstack/router` es excelente y añade
generación de código y conceptos nuevos que el proyecto no necesitaba.

## Estructura de URLs

Estructura que el informe propuso y que la migración adoptó. La columna de detalle indica qué existe
hoy de cada línea; las dos desviaciones están declaradas al final de la sección.

```text
/                                    → HomeView
/contacts                            → ContactsView
/groups                              → GroupsView
/groups/:groupId                     → GroupDetailView
/tickets                             → TicketsListView (existe; sin paginación)
/tickets/new                         → NewTicketShell (redirige a /capture)
/tickets/new/capture                 → NewTicketCaptureView
/tickets/new/review                  → NewTicketReviewView
/tickets/new/participants            → NewTicketParticipantsView
/tickets/new/assign                  → NewTicketAssignView
/tickets/new/summary                 → NewTicketSummaryView
/tickets/:ticketId                   → TicketDetailView
/settings                            → SettingsView
/settings/feature-flags              → FeatureFlagsView
*                                    → vista de 404
```

Notas de diseño del informe, con su resultado:

| Nota de diseño | Resultado |
| :--- | :--- |
| Los pasos transitorios `scanning` y `ocr-review` no deben ser enlazables: al refrescar se redirige a `/tickets/new` | Adoptado: ninguno de los dos es una ruta de `frontend/src/main.tsx` |
| `/tickets` requiere una vista de lista que muestre todos los tickets y no los cinco primeros | Entregado como vista, sin paginación y sin pantalla que enlace a ella |
| Los parámetros `:ticketId` y `:groupId` se tipan y se validan al resolver la ruta | Entregado: las vistas leen el parámetro con `useParams()` |

## Plan de migración ejecutado

Tablas del informe conservadas como registro del plan. La columna «Cambio» describe lo que había que
hacer en el momento de escribir el informe; el apartado `## Estado` declara qué se materializó.

### Fase 1 — Vistas de nivel superior

| Archivo | Cambio |
| :--- | :--- |
| `frontend/package.json` | `+ react-router-dom@^7` |
| `frontend/src/main.tsx` | Árbol de rutas con `createBrowserRouter` |
| `frontend/src/lib/store.ts` | Retirar `currentView`, `activeTicketId` y `activeGroupId`: la ruta pasa a ser la única fuente de verdad, y `partialize` deja de incluirlos |
| `frontend/src/lib/types.ts` | `ViewName` deja de ser la tabla de rutas |
| `frontend/src/components/layout/AppShell.tsx` | `Outlet` en lugar de `children`; navegación inferior con `useLocation()` y `NavLink` |
| `frontend/src/components/NavigationBar.tsx` | Retirar o adaptar a `NavLink` |
| `frontend/src/views/HomeView.tsx` | Enlace de «Ver todo» hacia la lista de tickets |
| `frontend/src/views/` restantes | Sustituir `activeTicketId` y `activeGroupId` por `useParams()` |

### Fase 2 — Asistente de varios pasos

| Archivo | Cambio |
| :--- | :--- |
| Vista de ticket nuevo | Extraer cada paso a su propio componente: captura, revisión, participantes, asignación y resumen |
| Contenedor del asistente | `loader` que crea un ticket en estado borrador si no existe y redirige a `/tickets/new/capture` |
| `useBlocker` | Guarda por paso que impide salir con cambios sin guardar |
| Botón de retroceso | `navigate(-1)` y borrado del borrador si el paso es la captura y el ticket está vacío |
| Protección de enlaces directos | `loader` que redirige a un paso anterior si faltan sus condiciones previas |

### Archivos sin cambios

- `frontend/src/lib/store.ts` en su parte de datos: personas, grupos, tickets, perfil, ajustes y
  banderas, ya persistidos.
- `frontend/src/components/ui/`, `frontend/src/components/scan/`, `frontend/src/lib/scan/`,
  `frontend/src/lib/calc.ts` y `frontend/src/styles/`.
- `frontend/public/sw.js`, `frontend/public/manifest.webmanifest` y `frontend/index.html`: la PWA
  quedó intacta.

## Persistencia y PWA

### `partialize` del estado

El informe pedía excluir el estado de navegación de la persistencia. Es lo que hace hoy
`frontend/src/lib/store.ts:465-475`: se persiste el dato y el puntero al borrador, y ninguna bandera
de vista, porque no existe.

```ts
partialize: (state) => ({
  people: state.people,
  groups: state.groups,
  tickets: state.tickets,
  profile: state.profile,
  settings: state.settings,
  featureFlags: state.featureFlags,
  version: state.version,
  // Persistir draftTicketId para que refresh en wizard restaure el draft
  draftTicketId: state.draftTicketId,
})
```

El estado de navegación no se persiste, así que el enrutador es la única fuente de verdad de la
vista actual. `draftTicketId` sí se persiste, y esa es la pieza que permite recargar en medio del
asistente sin perder el borrador: el `id` del ticket vive con el dato, no con la ruta.

### Service worker

| Hecho | Valor |
| :--- | :--- |
| Respuesta a las navegaciones | `request.mode === 'navigate'` responde desde caché con el shell |
| Cambios que la migración exigió | Ninguno: toda navegación de la SPA termina en el mismo documento |
| Ruta del archivo | `frontend/public/sw.js` |
| Lo que la migración no cambió | El precargado del shell y el relleno de cachés al activarse |

## Riesgos y casos límite

| Riesgo | Impacto | Mitigación prevista |
| :--- | :--- | :--- |
| Enlace directo a `/tickets/new/assign` sin ticket en memoria | Recargar en medio del asistente con el almacén vacío | `loader` en la ruta padre de `/tickets/new/*`: crear un borrador y redirigir a la captura |
| El botón de retroceso borra el borrador sin avisar | Experiencia confusa al salir del primer paso | Guarda en el paso de captura: si el ticket está vacío, borrar y volver al inicio; si tiene datos, confirmar |
| Restauración de la posición de scroll | Navegación que parece rota | `ScrollRestoration` y `window.scrollTo(0, 0)` al cambiar de vista |
| Pruebas existentes con `useParams` | Necesitan una envoltura de enrutador | Envoltura de pruebas en `frontend/src/test-utils/render-with-router.tsx`, usada desde `frontend/src/setupTests.ts` |
| Peso del bundle | +12 KB gz | Aceptable; la división de código por ruta reduce la carga inicial |
| Tipado de los parámetros de ruta | `:ticketId` es una cadena sin validar | Esquema de validación en el `loader` |

El apartado `## Estado` declara qué mitigaciones existen hoy. Las dos que quedaron parciales son la
guarda de navegación, entregada como utilidad sin consumidores, y la restauración de la posición de
scroll, que no llegó a montarse en ninguna vista.

## Esfuerzo

| Fase | Archivos estimados | Líneas estimadas | Riesgo estimado | Tiempo estimado |
| :--- | ---: | ---: | :--- | :--- |
| Fase 1 — rutas de nivel superior | 12 | ~35 | Bajo | 1-2 días |
| Fase 2 — asistente anidado y guardas | 8 | ~250 | **Alto** | 3-5 días |
| Pruebas y QA | 5 | ~100 | Medio | 1 día |
| **Total** | **~25** | **~400** | **Medio-alto** | **5-8 días** |

La tabla anterior es la estimación que el informe escribió antes de la migración; se conserva como
parte del análisis. El tamaño observado del cambio se registró al revisarlo: `fc54af0`, 28 archivos,
1664 líneas añadidas y 1265 eliminadas, según
[docs/process/ai-workflow.md](/docs/process/ai-workflow.md). La migración se planificó como talla S
en la fase 1 y M en la fase 2.

## Recomendación final

Recomendación del informe, confirmada por el resultado:

1. **Fase 1, ejecutada**: rutas de nivel superior. El valor inmediato eran las URL compartibles, la
   lista de tickets, el botón de retroceso nativo y una PWA sin regresiones.
2. **Fase 2, ejecutada**: rutas anidadas del asistente. Exigía diseñar con cuidado los `loader`, las
   `action` y las guardas, y probar la recarga en cada paso, la navegación hacia atrás y adelante,
   el uso sin conexión con recarga y el enlace directo a `/tickets/:id`.
3. **Convivencia**: la migración no bloqueó ninguna función, porque el enrutador convivió con las
   envolturas de Zustand durante las dos fases.

Lo que el informe descartó sigue descartado:

| Alternativa descartada | Comprobación |
| :--- | :--- |
| Enrutado por archivos del propio React Router | `frontend/src/main.tsx` declara el árbol de rutas a mano |
| `@tanstack/router` | No aparece en `frontend/package.json` |
| Persistir la vista actual en `localStorage` | Ninguna bandera de vista existe en `frontend/src/lib/store.ts` |

## Cierre y registro

| Hecho | Evidencia |
| :--- | :--- |
| El cambio se integró con el pull request #11, de la rama `refactor/routing`, el 2026-07-25 | `git log --merges` → `3994bec` |
| El cambio tiene registro de archivo con su propuesta, su diseño y su cierre | `openspec/changes/archive/2026-07-25-routing-refactor/` |
| El cambio pasó por revisión adversarial y sus hallazgos se corrigieron en un commit acotado | `openspec/changes/archive/2026-07-25-routing-refactor/judgment-day-report.md` y el commit `3e369a5` |
| La decisión de arquitectura con su contexto y sus alternativas descartadas es canónica en otro documento | `DEC-ARCH-05` en [docs/architecture/decisions.md](/docs/architecture/decisions.md) |

## Decisiones

Este informe no toma decisiones propias: recomienda y compara. La decisión que su recomendación
provocó es `DEC-ARCH-05`, cuyo registro canónico, con su contexto y sus alternativas descartadas,
está en [docs/architecture/decisions.md](/docs/architecture/decisions.md). Si esa decisión se
repitiera aquí, quedaría escrita en dos sitios y empezaría a divergir, que es justo lo que el
estándar prohíbe.

## Cómo verificar este documento

- [ ] Frontmatter completo:

```bash
for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do
  grep -q "^$k:" ROUTING_FEASIBILITY.md && echo "OK: $k" || echo "FALLO: $k"
done
```

- [ ] Estado dentro del vocabulario cerrado del estándar:

```bash
grep -qE '^status: (entregado|parcial|latente|descartado|planificado|mixto)$' ROUTING_FEASIBILITY.md \
  && echo "OK: status" || echo "FALLO: status"
```

- [ ] El H1 repite el campo `title`:

```bash
grep -n '^# ' ROUTING_FEASIBILITY.md
```

- [ ] La adopción de la recomendación es verificable en el código:

```bash
grep -n 'react-router-dom' frontend/package.json
grep -n 'createBrowserRouter' frontend/src/main.tsx
grep -n 'useRouterBlocker' frontend/src/hooks/useBlocker.ts
```

- [ ] Las rutas citadas existen donde el documento dice:

```bash
for p in frontend/src/main.tsx frontend/src/lib/store.ts frontend/src/lib/types.ts \
         frontend/src/components/layout/AppShell.tsx frontend/src/hooks/useBlocker.ts \
         frontend/src/lib/wizard-loaders.ts frontend/src/views/NewTicketShell.tsx \
         frontend/src/views/TicketsListView.tsx frontend/src/test-utils/render-with-router.tsx \
         frontend/src/setupTests.ts frontend/public/sw.js frontend/package.json; do
  test -f "$p" && echo "OK: $p" || echo "FALLO: $p"
done
```

- [ ] El partialize documentado coincide con el del código:

```bash
grep -q 'draftTicketId: state.draftTicketId' frontend/src/lib/store.ts && echo "OK: partialize" || echo "FALLO: partialize"
grep -n 'currentView' frontend/src/lib/store.ts || echo "OK: sin bandera de vista persistida"
```

- [ ] Las dos filas parciales del apartado de estado describen el código real:

```bash
grep -rn 'import.*useBlocker' frontend/src --include='*.ts*' | grep -v 'hooks/useBlocker.ts'
grep -rn 'ScrollRestoration' frontend/src
```

→ sin salida en ambos: la guarda no tiene consumidores y la restauración de scroll no está montada.

- [ ] No hay expresiones ambiguas ni enlaces que suban directorios:

```bash
grep -rniE 'previsto|se usará|está definido|planificado para|se implementará|\[Pending\]|\bReady\b' ROUTING_FEASIBILITY.md | grep -viE '«|»|`'
grep -n '](\.\./' ROUTING_FEASIBILITY.md
```

## Referencias

- [docs/architecture/decisions.md](/docs/architecture/decisions.md) — registro canónico de las decisiones `DEC-ARCH-xx`, con `DEC-ARCH-05` y las alternativas descartadas de esta comparativa
- [docs/architecture/overview.md](/docs/architecture/overview.md) — arquitectura entregada, con el `Router` y las rutas anidadas del asistente
- [docs/architecture/stack.md](/docs/architecture/stack.md) — posición del enrutado dentro del stack entregado
- [docs/process/ai-workflow.md](/docs/process/ai-workflow.md) — ciclo de trabajo, revisión adversarial y tamaño observado del cambio de enrutado
- [docs/process/delivery-and-branching.md](/docs/process/delivery-and-branching.md) — modelo de ramas y flujos que integraron el cambio
- [docs/DOC-STANDARD.md](/docs/DOC-STANDARD.md) — estándar de escritura dual que gobierna este documento
- `frontend/src/main.tsx` — árbol de rutas entregado con `createBrowserRouter`
- `frontend/src/hooks/useBlocker.ts` — utilidad de guarda de navegación
- `frontend/src/lib/wizard-loaders.ts` — condiciones de guarda y protección de los pasos del asistente
- `frontend/src/lib/store.ts` — estado global, `partialize` y persistencia
- `openspec/changes/archive/2026-07-25-routing-refactor/` — registro del cambio, con su informe de juicio adversarial
