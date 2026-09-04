# Informe de Viabilidad: Migración a Enrutador Basado en URL

**Fecha:** 2025-07-19  
**Proyecto:** Cuadra / SplitEat (Vite + React 18 + TS + Zustand + PWA)  
**Worktree:** `frontend-routing` (rama `refactor/routing`) — exploración de solo lectura

---

## Resumen Ejecutivo

La arquitectura actual usa **estado global Zustand (`currentView`)** como "router" virtual sin URLs. Migrar a un enrutador real (`react-router-dom` v7) es **viable y recomendado**, pero requiere **refactor significativo** (≈ 15-20 archivos, ~500 líneas de cambios) y atención a edge cases del flujo multi-paso `NewTicketView`.

**Recomendación:** **Adoptar `react-router-dom` v7 (data mode)** con migración en **2 fases**:
1. **Fase 1 (S):** Vistas de nivel superior (`/`, `/contacts`, `/groups`, `/tickets`, `/settings`...) + persistencia de scroll + PWA sin cambios.
2. **Fase 2 (M):** Rutas anidadas para el wizard `NewTicketView` (`/tickets/new/*`) + bloqueadores de navegación + deep-linking seguro.

---

## Arquitectura Actual

| Componente | Responsabilidad |
|------------|-----------------|
| `main.tsx` → `AppRouter` | Switch basado en `currentView` (Zustand) |
| `store.ts` | `currentView: ViewName`, `setView()`, `openTicket()`, `openGroup()`, `activeTicketId`, `activeGroupId` |
| `types.ts` | `ViewName = 'home' \| 'contacts' \| 'groups' \| 'new-ticket' \| 'ticket-detail' \| 'settings' \| 'feature-flags' \| 'group-detail'` |
| `AppShell` | Layout wrapper + bottom nav + transiciones Framer Motion (`motionKey` = `currentView + activeTicketId + activeGroupId`) |
| `NewTicketView` | **Estado interno crítico:** `step` ∈ `['capture'→'scanning'→'ocr-review'→'review'→'participants'→'assign'→'summary']` — todo en un solo componente, sin URLs |
| SW (`sw.js`) | `request.mode === 'navigate'` → `caches.match('/')` fallback. Funciona con SPA porque toda navegación es `mode: navigate` a `/` |

---

## Comparativa de Librerías

| Criterio | `react-router-dom` v7 | `wouter` | `@tanstack/router` |
|----------|----------------------|----------|-------------------|
| **Bundle (gz)** | ~12 KB | ~1.5 KB | ~8 KB (core) + codegen |
| **Type safety** | Buena (v7 `RouteObject` + loader types) | Básica | **Excelente** (file-based o code-based, full inference) |
| **Nested routes** | Nativo (`children[]`) | Manual | Nativo (file-based o code-based) |
| **Data loading** | `loader`/`action` (Remix-style) | No | Sí (loaders con caching) |
| **Blockers/Navigation guards** | `useBlocker` (v7) | No | `beforeLoad` |
| **PWA/SSR ready** | Sí (React Router 7 = Remix) | Solo CSR | Sí |
| **Curva de aprendizaje** | Media (v7 = nuevo API) | Baja | Media-Alta (conceptos nuevos) |
| **Integración Zustand** | Manual (`useNavigate` wrappers) | Manual | Manual |
| **Madurez ecosistema** | **Muy alta** (Meta/Remix) | Alta (pequeño) | Creciente (TanStack) |

### ✅ **Elección recomendada: `react-router-dom` v7 (Data Mode)**

**Razones:**
1. **PWA + offline-first**: RR7 es la base de Remix, diseñado para SSR/SSG/SPA híbrido — el SW actual funciona sin cambios.
2. **Nested routes nativos**: El wizard `NewTicketView` encaja perfecto en `children[]` con `outlet`.
3. **`useBlocker`**: Necesario para el back-button custom que borra borradores vacíos.
4. **Bundle acceptable**: +12 KB gz es razonable para una PWA que ya carga ~175 KB JS (transformers).
5. **Comunidad y longevidad**: Meta lo mantiene, migración futura a Remix trivial si se desea SSR.

> **Nota:** `wouter` es tentador por tamaño, pero **no tiene blockers ni nested routes declarativos** — habría que reimplementar lógica de guardias manualmente. `@tanstack/router` es excelente pero añade complejidad (codegen, virtual routes) que no justifica el ROI para este proyecto.

---

## Estructura de URLs Propuesta

```
/                                    → HomeView
/contacts                            → ContactsView
/groups                              → GroupsView
/groups/:groupId                     → GroupDetailView
/tickets                             → (nuevo) TicketsListView (todos, paginados)
/tickets/new                         → NewTicketView /capture (redirect)
/tickets/new/capture                 → step=capture
/tickets/new/review                  → step=review
/tickets/new/participants            → step=participants
/tickets/new/assign                  → step=assign
/tickets/new/summary                 → step=summary
/tickets/new/ocr-review              → step=ocr-review (transient, no deep-linkable)
/tickets/new/scanning                → step=scanning (transient, no deep-linkable)
/tickets/:ticketId                   → TicketDetailView
/settings                            → SettingsView
/settings/feature-flags              → FeatureFlagsView (sub-ruta opcional)
```

### Notas de diseño:
- **Pasos transitorios** (`scanning`, `ocr-review`): **no** deben ser deep-linkables (refresh → redirige a `/tickets/new`). Se manejan como estados internos o `searchParams` (`?mode=scanning`).
- **`/tickets` (lista)**: Requerido por Bug 1 ("Ver todo"). Nueva vista `TicketsListView` que usa `tickets` del store sin `slice(0,5)`.
- **Params tipados**: `:ticketId`, `:groupId` → `useParams()` + validación Zod en loader.

---

## Plan de Migración (Fase 1 + Fase 2)

### Archivos a modificar — Fase 1 (Vistas de nivel superior)

| Archivo | Cambio |
|---------|--------|
| `package.json` | `+ react-router-dom@^7` |
| `main.tsx` | `<BrowserRouter>` + `<Routes>` + `<Route>` tree |
| `store.ts` | **Mantener** `currentView`/`setView` como **wrappers** sobre `useNavigate()` para compatibilidad gradual. **Eliminar** `activeTicketId`/`activeGroupId` (→ `useParams`). `partialize`: **no persistir** `currentView`. |
| `types.ts` | `ViewName` → `string` (o union de paths) |
| `AppShell.tsx` | `<Outlet />` en lugar de `{children}`; bottom nav usa `useLocation()` / `NavLink` |
| `NavigationBar.tsx` (deprecated) | Eliminar o adaptar a `NavLink` |
| `HomeView.tsx` | `onClick={() => navigate('/tickets')}` para "Ver todo" |
| `ContactsView`, `GroupsView`, `SettingsView`, `FeatureFlagsView`, `TicketDetailView`, `GroupDetailView` | `activeTicketId`/`activeGroupId` → `useParams()` |
| `NewTicketView.tsx` | **No tocar aún** — Fase 2 |

### Archivos a modificar — Fase 2 (Wizard multi-paso)

| Archivo | Cambio |
|---------|--------|
| `NewTicketView.tsx` | **Refactor mayor**: extraer cada step a componente propio (`CaptureStep`, `ReviewStep`, `ParticipantsStep`, `AssignStep`, `SummaryStep`). Usar `<Routes><Route path="capture" element={<CaptureStep/>} ...>` anidados bajo `/tickets/new/*`. |
| `NewTicketView` (nuevo contenedor) | `loader`: si no hay `ticketId` en store → `createTicket({status:'draft'})` y redirect a `/tickets/new/capture`. `action`: handle form submits por step. |
| `useBlocker` | En cada step: `useBlocker(({currentLocation, nextLocation}) => !canLeaveStep && nextLocation.pathname !== currentLocation.pathname)` |
| `back button` | `navigate(-1)` + lógica de borrar borrador si `step===capture` y ticket vacío (usa `loader`/`action` para limpiar). |
| `deep-link protection` | Loader en `/tickets/new/assign` verifica `ticket.participantIds.length > 0` → redirect a `/tickets/new/participants` si no. |

### Archivos **sin cambios** (compartidos)

- `store.ts` (data: people, groups, tickets, profile, settings, featureFlags — ya persistidos)
- `components/ui/*`, `components/scan/*`, `components/onboarding/*`, `lib/scan/*`, `lib/calc.ts`, `styles/*`
- `sw.js`, `manifest.webmanifest`, `index.html` (PWA intacto)

---

## Persistencia & PWA

### Zustand `partialize` (líneas 409-418 en `store.ts`)
```ts
partialize: (state) => ({
  people: state.people,
  groups: state.groups,
  tickets: state.tickets,
  profile: state.profile,
  settings: state.settings,
  featureFlags: state.featureFlags,
  version: state.version,
  // currentView, activeTicketId, activeGroupId, _startManual → NO persistidos
})
```
✅ **Correcto**: el estado de navegación **no se persiste**. El router es la única fuente de verdad tras la migración.

### Service Worker (`sw.js`)
- `request.mode === 'navigate'` → `caches.match('/')` → **funciona tal cual** con RR7 (toda navegación SPA termina en `/`).
- **No se requieren cambios en SW**.
- Precaché de `/` + backfill en `activate` cubre todos los assets JS/CSS.

---

## Riesgos & Edge Cases

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Deep-link a `/tickets/new/assign` sin ticket en memoria** | Usuario refresca en medio del wizard → store vacío → crash | `loader` en ruta padre `/tickets/new/*`: si no hay `activeTicketId` → `createTicket({status:'draft'})` + redirect a `/tickets/new/capture` |
| **Back button borra borrador inesperadamente** | UX confusa si el usuario navega atrás desde step 1 | `useBlocker` en step `capture`: si ticket vacío → `navigate('/')` + `deleteTicket(id)`; si tiene datos → confirm dialog nativo (`window.confirm`) |
| **Scroll position restoration** | UX rota al navegar | `<ScrollRestoration />` (RR7) + `window.scrollTo(0,0)` en layout cambios |
| **Tests existentes** (`ScanEngineSelector.test.tsx`) | Necesitan `<MemoryRouter>` wrapper | Añadir `renderWithRouter` helper en `setupTests.ts` |
| **Bundle size** | +12 KB gz | Acceptable (actual ~175 KB gz). Code-split por ruta reduce carga inicial. |
| **Type safety de params** | `:ticketId` string → validar | Zod schema en `loader` + `parseParams` en RR7 |

---

## Esfuerzo Estimado

| Fase | Archivos | Líneas ~ | Riesgo | Tiempo |
|------|----------|----------|--------|--------|
| **Fase 1** (top-level routes) | 12 | ~35 | Bajo | 1-2 días |
| **Fase 2** (wizard nested routes + blockers) | 8 | ~250 | **Alto** | 3-5 días |
| **Tests & QA** | 5 | ~100 | Medio | 1 día |
| **Total** | **~25** | **~400** | **Medio-Alto** | **5-8 días** |

> **S/M/L:** Fase 1 = **S**, Fase 2 = **M**, Total = **M-L** (por complejidad del wizard).

---

## Recomendación Final

### ✅ **HACERLO — Enfoque por fases**

1. **Semana 1**: Fase 1 completa. Entrega valor inmediato: URLs compartibles, "Ver todo" funcional, back button nativo, PWA sin regresiones.
2. **Semana 2-3**: Fase 2. Requiere diseño cuidadoso de loaders/actions/blockers. Probar exhaustivamente:
   - Refresh en cada step
   - Navegación atrás/adelante
   - Offline + refresh
   - Deep-link directo a `/tickets/:id`
3. **No bloquea features actuales** — el router convive con Zustand wrappers durante la migración.

### ❌ **NO HACER (por ahora)**
- Migrar a file-based routing (RR7 convention) — añade build complexity innecesaria.
- Usar `@tanstack/router` — over-engineering para este scope.
- Persistir `currentView` en localStorage — rompe deep-linking.

---

## Próximos Pasos (si se aprueba)

1. `cd frontend && pnpm add react-router-dom@7`
2. Crear branch `feat/router-phase1`
3. Implementar tabla "Fase 1" → PR → merge
4. Crear branch `feat/router-phase2-wizard`
5. Implementar tabla "Fase 2" → PR → merge
6. Actualizar `setupTests.ts` con `renderWithRouter`
7. Ejecutar suite completa + pruebas manuales offline + PWA audit (Lighthouse)

---

*Fin del informe. Generado en worktree `frontend-routing` (rama `refactor/routing`) — sin modificaciones de código.*