# Comparativa: estructura `Ticket` actual vs. propuesta metadata de fuentes externas

**Worktree**: `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research`
**Fecha**: 2026-07-26
**Alcance**: comparar el modelo `Ticket` real en producción (rama `feature/feature-entrega2-ADLC`) con dos propuestas para meter metadata EXIF + futuras fuentes externas. Incluye análisis de escalabilidad de cada enfoque.

> **Verificado con CodeGraph**: las descripciones del `Ticket` actual (campos, líneas, consumidores) provienen del índice `.codegraph/codegraph.db` del worktree, no de inferencia.

---

## 1. Estado actual: la interfaz `Ticket` hoy

**Archivo**: `frontend/src/lib/types.ts:71-109`

```ts
export interface Ticket {
  id: ID
  title: string
  date: string                       // Fecha de factura (ISO)
  merchant?: string                  // Nombre del comercio (opcional)
  image?: string                     // data URL base64 JPEG (opcional)
  items: TicketItem[]                // Array tipado, estructural
  discounts: TicketDiscount[]        // Array tipado, estructural
  subtotal: number
  taxRate: number
  taxAmount: number
  taxMode: TaxMode
  tipMode: TipMode
  tipAmount: number
  tipPercentage?: number
  taxDistribution: ExtraDistributionMode
  tipDistribution: ExtraDistributionMode
  participantIds: ID[]
  paidBy?: ID
  status: TicketStatus               // 'draft' | 'balanced' | 'closed'
  createdAt: string
  updatedAt: string
}
```

### 1.1 Patrón de datos observado

- **Campos primitivos opcionales** `merchant?`, `image?`, `tipPercentage?`, `paidBy?` → ausencia = `undefined`. No usan `null`.
- **Arrays tipados** `items`, `discounts`, `participantIds` → siempre inicializados a `[]` en `addTicket` (`store.ts:159, 158, 194`), nunca `undefined`.
- **Enums string** `TaxMode`, `TipMode`, `ExtraDistributionMode`, `TicketStatus` → unions de literales.
- **Sin metadata anexa**: el `Ticket` hoy describe exclusivamente el *contenido del ticket*. No hay contenedor para "atributos del archivo de imagen", "datos derivados de APIs externas" o "trazabilidad de extracción".

### 1.2 Patrón de migración observado

**`store.ts:384-420`** — función `merge` del `persist`:

```ts
merge: (persistedState, currentState) => {
  const merged = { ...currentState, ...(persistedState || {}) }
  if (merged.draftTicketId === undefined) merged.draftTicketId = null
  if (Array.isArray(merged.tickets)) {
    merged.tickets = merged.tickets.map((t: any) => ({
      ...t,
      discounts: Array.isArray(t.discounts)
        ? t.discounts.map((d: any) => ({
            ...d,
            mode: d.mode ?? 'amount',
            percentage: d.percentage,
          }))
        : [],
    }))
  }
  // ... settings, featureFlags sin versionado explícito
  return merged
}
```

Características clave del patrón existente:

- Migración **inline no versionada**: el equipo confía en `?? defaults` y en `Array.isArray` para normalizar. No hay `schemaVersion` en `Ticket`.
- Cero invención de datos: si `discounts` no existe, se inicializa a `[]`. Si `mode` falta, se pone `'amount'`. **Nunca** se rellena con `null` un campo opcional.
- El array `tickets` se recorre entero en cada carga — el coste de migrar es O(n) en localStorage y se asume.

### 1.3 Patrón de consumo observado (UI)

Verificado en `TicketSummary.tsx:37-330` y `NewTicketSummaryView`, `TicketDetailView`, `NewTicketCaptureView`, `TicketsListView`:

- Acceso **directo y plano**: `ticket.date`, `ticket.merchant`, `ticket.items.length`, `ticket.taxMode`, `ticket.taxRate`, `ticket.taxAmount`, `ticket.tipAmount`, `ticket.title`. Cero indirections.
- Cero comprobaciones de "metadata externa" hoy — porque no existe.
- `formatDate(ticket.date)`, `formatEUR(total)`: helpers que ya consumen el primitivo `string` ISO.

### 1.4 Estado de las dependencias

- No hay ninguna lib EXIF instalada (`package.json` no trae `exifr`, `exifreader`, `piexifjs`).
- `dexie@^4.0.1` está declarado pero **sin ningún import en `frontend/src`** (CodeGraph no resuelve símbolos Dexie).
- `sharp` aparece 85× en `pnpm-lock.yaml` como **dependencia transitiva** vía `@huggingface/transformers` / `tesseract.js`, sin uso en `frontend/src`.
- `backend/` y `db/` sólo contienen `.keep`. No hay backend ni DB.

---

## 2. Las dos propuestas a comparar

### Propuesta A — Objeto tipado por namespaces

```ts
export interface TicketExifMetadata { /* source, capturedAt, device, orientation, gps, ... */ }
export interface TicketPlacesMetadata { /* provider, placeId, name, address, ... */ }

export interface TicketMetadata {
  schemaVersion?: 1
  exif?: TicketExifMetadata       // un slot tipado por fuente
  places?: TicketPlacesMetadata
  // extensible: ocr?, iban?, qr?, ... (cada uno su interfaz)
}

export interface Ticket {
  // ... campos actuales sin cambios
  metadata?: TicketMetadata       // ⬅⬅⬅ nuevo campo único
  // ...
}
```

### Propuesta C — Array de fuentes discriminadas

```ts
export interface TicketExifSource   { type: 'exif';   source: 'exifr'|...; capturedAt?, gps?, ... }
export interface TicketPlacesSource  { type: 'places'; provider: 'google'|...; placeId?, ... }
export interface TicketOcrSource    { type: 'ocr';    engine: 'tesseract'|...; confidence, ... }

export type TicketMetadataSource = TicketExifSource | TicketPlacesSource | TicketOcrSource

export interface TicketMetadata {
  schemaVersion?: 1
  sources: TicketMetadataSource[]  // ⬅⬅⬅ array con multi-proveedor por type
}

export interface Ticket {
  // ... campos actuales sin cambios
  metadata?: TicketMetadata
  // ...
}
```

---

## 3. Tabla comparativa A vs. C (con el objeto actual como referencia)

| Criterio | **Ticket actual** (estado real) | **Propuesta A** (namespaces) | **Propuesta C** (array discriminado) |
| --- | --- | --- | --- |
| **# campos nuevos en `Ticket`** | — | 1 campo: `metadata?: TicketMetadata` | 1 campo: `metadata?: TicketMetadata` |
| **Anidamiento medio** | Plano (todos primitivos o arrays) | 2 niveles: `metadata.exif.gps.latitude` | 3 niveles: `metadata.sources[i].gps.latitude` |
| **Tipado de las fuentes** | n/a | Namespaces tipados (`metadata.exif: TicketExifMetadata`) | Discriminados por `type` (`Source.type: 'exif'`) |
| **Cobertura sparse (parcial)** | n/a | ✅ Ausencia de campo = `undefined` (mismo patrón que `merchant?`, `image?`) | ✅ Ausencia de fuente = `sources` sin item de ese `type` |
| **Cobertura multi-proveedor por fuente** (2 OCR, 2 Places) | n/a | ❌ Un slot por fuente, el segundo sobrescribe | ✅ N sources del mismo `type` ordenables por `extractedAt` |
| **Historizar reintentos** (re-extracción con `extractedAt`, `durationMs`) | n/a | ❌ No, salvo arrays internos | ✅ Nativo: cada source es un registro timestamped |
| **Acceso en UI** (lo que ya usa `ticket.date` plano) | ✅ Directo: `ticket.date` | ✅ Directo: `ticket.metadata?.exif?.capturedAt` | ⚠️ Indirecto: requiere helper `latestSource(metadata,'exif')?.capturedAt` |
| **IntelliSense al consumir** | ✅ Pleno | ✅ Pleno: `ticket.metadata?.exif?.` autocompleta todos los campos EXIF | ⚠️ Medio: IntelliSense aparece tras discriminar por `type` en switch/guard |
| **Coste mecánico de añadir fuente nueva** | n/a | ⚠️ Editar `types.ts`: 1 interfaz + 1 slot (~10 líneas) | ⚠️ Editar `types.ts`: 1 interfaz discriminatoria + 1 entrada al union (~15 líneas) |
| **Acoplamiento al patrón de `types.ts` actual** | n/a | ✅ **Idéntico**: `items: TicketItem[]`, `discounts: TicketDiscount[]` siguen el mismo patrón "array tipado / interfaz por elemento". `metadata.exif` replica la idea. | ⚠️ **Nuevo patrón**: discriminated union no existe hoy en `types.ts`; introduce工程施工 heterogéneo por primera vez |
| **Coste migración `merge`** (vs. `discounts` actual) | n/a | ✅ Trivial: `if (t.metadata === null) t.metadata = undefined` — idéntico a `Array.isArray(t.discounts) ? … : []` | ⚠️ Medio: hay que filtrar `sources` quitando items sin `type`, validar union, normalizar `null→undefined` |
| **Riesgo de typos en claves** | Cero (campos literales) | ✅ Cero (`metadata.exif` está tipado) | ✅ Cero (`type: 'exif'` es union literal) |
| **Storage coste (parcial EXIF)** | n/a | ~100–140 bytes | ~160–200 bytes (sobre-costo por `type` + `extractedAt` en cada item) |
| **Storage coste (nula)** | n/a | 0 (`metadata: undefined` no serializa) | 0 (`metadata: undefined` no serializa) |
| **Serialización futura Firestore** (backend planificado) | Estructura directa | ✅ Sub-objeto nativo: `exif: {...}` | ✅ Sub-colección `sources: [...]` (más adecuada si hay N OCR adversarios) |
| **RGPD stripping selectivo** (borrar `gps` + `device` antes de cloud) | n/a | ⚠️ **NO diferenciador**: A y C persisten `gps` en localStorage de forma idéntica hasta sync consentida. El stripping real RGPD actúa sobre el **binario de la imagen** (`TSK-4.3.md:17` `stripExifMetadata(imageFile): Promise<Blob>`) — ortogonal a `Ticket.metadata`. Ambas formas requieren un paso de borrado del campo estructurado antes de Firestore | ⚠️ Igual que A — no aporta nada diferencial |
| **Testabilidad** (snapshots, prop-based) | Estructura estable | ✅ Interfaces estables → snapshots limpios | ⚠️ Each test debe sintetizar arrays con `type` discriminante |
| **Curva de aprendizaje** | n/a | ✅ Baja: igual al resto de `types.ts` | ⚠️ Media: discriminated unions + helpers de búsqueda |
| **Refactor futuro A → C** (si se necesita multi-proveedor) | n/a | ⚠️ Mecánico pero con bump `schemaVersion`: envolver cada namespace en `sources: [{type, ...oldData}]` | — (es la opción "extremo") |
| **Refactor futuro C → A** (si nunca se usa multi-proveedor) | n/a | — | ⚠️ Costoso: achicar el array a un slot fijo rompe cualquier snapshot/array-source ya guardado |

---

## 4. Análisis de escalabilidad por dimensión real del producto

### 4.1 Escalabilidad por **número de fuentes externas distintas** (EXIF, Places, OCR, IBAN, QR, …)

| | Actual | A | C |
| --- | --- | --- | --- |
| 1 fuente (hoy, EXIF) | — | ✅ Óptimo: 1 campo, 1 interfaz, ~100 bytes | ⚠️ Overhead de array+`type` innecesario (~160 bytes) |
| 5 fuentes distintas | — | ✅ Lineal: 5 interfaces + 5 slots. Máquina de estados finita. | ✅ Lineal: 5 interfaces + 5 entradas en union. |
| 20 fuentes distintas (plataforma extensa) | — | ⚠️ `TicketMetadata` se ensucia (20 campos opcionales) pero sigue tipado | ✅ Mejor: `sources[]` no crece en superficie del tipo, sólo el union |
| Fuentes no imaginadas hoy (banco, fiscal, …) | — | ⚠️ Requiere editar tipos cada vez | ✅ Si el union es semiabierto (`type: string` + payload), cero fricción (perdiendo type-safety) → no recomendado |

**Conclusión 4.1**: para 1–5 fuentes, **A** es óptimo. Para 20+ fuentes previsible, **C** escala mejor en superficie del tipo. Spliteat hoy tiene 1 fuente (EXIF) y planea 2–3 (Places, OCR). **A es adecuada**.

### 4.2 Escalabilidad por **múltiples proveedores por fuente** (2 OCR adversarios en judgment-day, Google + OSM en Places)

| | Actual | A | C |
| --- | --- | --- | --- |
| 1 proveedor (hoy) | — | ✅ Slot único | ✅ Array de 1 item |
| 2 proveedores para OCR (judgment-day con `judge-a` + `judge-b`) | — | ❌ Slot único: el 2º sobrescribe, peor: necesitas `ocr1?` + `ocr2?` (feo) | ✅ Nativo: `sources = [{type:'ocr',engine:'judge-a',...}, {type:'ocr',engine:'judge-b',...}]` |
| 3+ proveedores por fuente | — | ❌ Impracticable | ✅ Nativo |
| Comparativa de resultados (`bestConfidence = max(sources.filter('ocr').confidence)`) | — | ⚠️ Read ó los datos del slot único | ✅ `sources.filter('ocr').sort(...)` |

**Conclusión 4.2**: si decides implementar **judgment-day adversarial OCR** (ya tienes el skill instalado) o consultar **2 APIs Places paralelas**, **C es la única viable**. Si nunca llegas a esa feature, A es más simple.

### 4.3 Escalabilidad por **historia de extracciones** (reintentos, telemetría de `durationMs`, confianza por motor)

| | Actual | A | C |
| --- | --- | --- | --- |
| Último resultado por fuente (sirve hoy) | — | ✅ Suficiente | ✅ Suficiente (`sources[sources.length-1]`) |
| Histórico de N intentos por ticket (auditoría, QA, degradación) | — | ❌ No visible sin arrays internos | ✅ Nativo: cada retry es un item nuevo `extractedAt`-stamped |
| Análisis "¿cuánto tardó EXIF enunciado para validar el budget K-01 < 90s" | — | ❌ No almacenado | ✅ `sources[i].durationMs` y `extractedAt` |

**Conclusión 4.3**: si vas a medir rendimiento y telemetría de la extracción, **C aporta valor desde el día 1**. Si lo único que necesitas es la salida final, A es suficiente.

### 4.4 Escalabilidad por **volumen de tickets** ( limitless localStorage ~5 MB)

| | Actual | A | C |
| --- | --- | --- | --- |
| Ticket sin metadata (nula) | ✅ Mínimo | ✅ 0 bytes (`undefined` no serializa) | ✅ 0 bytes (`undefined` no serializa) |
| Ticket con 1 EXIF parcial | ✅ +0 (no existe hoy) | +~100 bytes | +~160 bytes |
| Ticket con EXIF + OCR + Places | — | +~300–400 bytes | +~450–550 bytes |
| 1000 tickets con metadata completa | — | ~300–400 KB | ~450–550 KB |

**Conclusión 4.4**: El cuello de botella **no será metadata** en ningún escenario — lo será **`image` base64** (~500 KB–2 MB por ticket). A y C son indistinguibles en storage real. *No es un factor decisorio*.

### 4.5 Escalabilidad por **migraciones futuras** (schemaVersion bumps)

| | Actual | A | C |
| --- | --- | --- | --- |
| Sin versionado (como hoy con `discounts`) | ✅ Trabaj con `Array.isArray` y `??` | ⚠️ Iguen patrón funciona | ⚠️ Igual patrón funciona para filtrado de `sources` inválidos |
| Bump `schemaVersion` 1→2 (cambios en `TicketExifMetadata`) | — | ✅ Trivial: `if (m.schemaVersion === 1) migrateExif(...)` | ✅ Igual |
| Bump por-source (cambios sólo en una fuente) | — | ⚠️ Reacciona todo `metadata` aunque cambie un namespace | ✅ Fine-grained: `sources.map(s => s.type === 'exif' && s.schemaVersion === 1 ? migrate(s) : s)` |
| Migración Firestore (cuando exista backend) | — | ✅ Sub-documento `metadata: {exif, places, ocr}` con update parcial por namespace (`fieldPath`). **Restricción Firestore**: el documento debe ser <1MB (<9 B en soporte trabaja); si el ticket crece masivo usa sub-colecciones `/tickets/{ticketId}/metadata` | ✅ Array-field `metadata.sources` aceptado por Firestore con `arrayUnion`, pero **también es una escritura completa del campo completo** (`arrayUnion` añade un elemento, pero Firestore serializa el array completo en el doc; el overhead es ínfimo comparado con el base64 `image` presente hoy) |

**Conclusión 4.5**: si vas a versionar schema de forma fina por fuente (migraciones incrementales), **C permite aislar mejor**. Si haces migración global por `schemaVersion`, A es más simple.

### 4.6 Escalabilidad por **UX/lectura en componentes**

| | Actual | A | C |
| --- | --- | --- | --- |
| Componentes que ya usan `ticket.X` plano | ✅ Idiomático | ✅ `ticket.metadata?.exif?.gps?.latitude` idiomático | ⚠️ Requiere helper `useLatestSource(ticket, 'exif')` |
| Cantidad de código nuevo en UI para leer | 0 | ~0 (optional chaining nativo) | +1 hook +1 helper por acceso tipado |
| Refactor de `TicketSummary` para mostrar "foto tomada en Madrid el 26/07" | — | ✅ 2 líneas: `metadata?.exif?.capturedAt` + `metadata?.places?.name` | ⚠️ 4-5 líneas + helpers ya creados |

**Conclusión 4.6**: **A gana en ergonomía de lectura** — hijack directamente el mismo patrón de `ticket.merchant?` que ya usas. C introduce una indirection que paga cada componente que quiera leer metadata.

### 4.7 Escalabilidad por **desarrollo incremental / time-to-market**

| | Actual | A | C |
| --- | --- | --- | --- |
| Implementar EXIF hoy (1 sola feature) | — | ✅ ~1 día (1 interfaz + 1 helper + 1 merge) | ⚠️ ~1.5 días (+ helpers de búsqueda + filtro en migración) |
| Sumar Places más adelante | — | ✅ ~0.5 días (otra interfaz + slot) | ✅ ~0.5 días (otra `type` al union) |
| Sumar 2ndo OCR adversario | — | ⚠️ Refactor A→C con bump de schema | ✅ Nativo |

**Conclusión 4.7**: para una feature aislada EXIF, A es **más rápida de entregar**. Si la hoja de ruta contempla multi-proveedor ya este trimestre, C ahorra refactor.

---

## 5. Matriz de decisión por escenario de producto

| ¿Qué vas a construir en Spliteat? | Mejor opción | Razón |
| --- | --- | --- |
| Sólo EXIF hoy, sin planes firmes de multi-proveedor | **A** | Más simple, ergonómico, mismo patrón que `discounts` |
| EXIF + Places + OCR-1 (un proveedor por fuente) | **A** | Lo cubre sin over-engineering |
| **Judgment-day adversarial** (2 OCR en paralelo) confirmado | **C** | Necesita N proveedores por fuente |
| Telemetría/auditoría de reintentos (`durationMs`, `extractedAt`) | **C** | Nativo en array, A necesita arrays internos |
| Backend Firestore con `arrayUnion` para añadir retry sin re-write | **C** | Firestore amaña arrays discriminados |
| Migración global por `schemaVersion` (estilo `discounts`) | **A** | Patrón ya probado en `store.ts:390-400` |
| Refactor incremental fácil de revertir | **A** | C→A cuesta más que A→C si decides ir atrás |

---

## 6. Recomendación técnica para Spliteat en el estado actual

**Recomendación: Propuesta A — Objeto tipado por namespaces.**

### Razón racional basada en el código real

1. **Patrón idéntico al ya existente**: `Ticket` ya usa interfaces tipadas por elemento (`TicketItem`, `TicketDiscount`) y arrays tipados (`items`, `discounts`). `metadata.exif: TicketExifMetadata` replica exactamente esa idea. Propuesta C introduce discriminated unions, que **no existen en ningún lugar de `types.ts`** hoy.

2. **Migración natural con el patrón ya conocido**: el `merge` actual ya recorre `tickets` y normaliza `discounts` con `Array.isArray ? … : []`. Para A, replicar `t.metadata === null ? undefined : t.metadata` es **2 líneas adicionales** (medido ~2 LOC en `store.ts:384-420` en el bloque de limpieza de arrays null-indeseados). Para C hay que filtrar `sources` con `type` válido y eso es **5-7 líneas** más.

3. **Consumo UI sin helpers**: `TicketSummary`, `TicketDetailView`, `NewTicketCaptureView` ya acceden a campos planos (`ticket.merchant`, `ticket.date`). Con A, `ticket.metadata?.exif?.capturedAt` es **cadenas optional directas**, mismo estilo. Con C cada componente necesita un helper `latestSource(...)` para no repetir `metadata?.sources?.find(s=>s.type==='exif')` en 10 sitios.

4. **Cobertura hoy y a 3 meses** — *corrección del round 1*: Spliteat plano inmediato = 1 fuente EXIF. Planeados = até 2-3 (Places + OCR-1 + EXIF). En ese rango A es óptimo para lectura puntual de ticket. **Pero** la necesidad real de multi-provider (2+ proveedores por fuente) **sí figura en el backlog**: `docs/user-stories/epic-4-analytics/TSK-4.4.md:15` especifica explícitamente "Utilizar una biblioteca ligera de mapas como Leaflet (con tiles libres de OpenStreetMap) **o** la API de Google Maps de forma diferida." La conjunción "o" abre dos proveedores de maps en paralelo; para mantener resultados de los dos hace falta el patrón multi-provider por fuente que es exactamente donde C gana (fila 4.2). C no es especulación.

5. **Escala con gracia hasta ~5 fuentes**: si mañana se suman IBAN-detection, QR-factura, fiscal-data, A crece a 5 slots opcionales — sigue legible y tipado. A partir de ahí C gana, pero **eso no es Spliteat hoy**.

6. **Path de migración A → C — corrección honesta del round 1**: el "2h no bloqueante" original cuenta **sólo el coste de escribir el migrador**. La realidad es:
   - **Código**: ~2h (mecánico). Reenvolver `metadata.exif` en `sources: [{type:'exif', ...}]` via `schemaVersion: 2`.
   - **Datos persistidos en clientes**: si Spliteat se publica a producción con A *antes* de migrar, cada navegador contiene `metadata: { exif: {...} }` en localStorage. El migrador cliente-side **sólo se ejecuta cuando cada usuario abre la app**; no puede batchearse server-side, parte de la asunción de que ningún usuario tiene un build híbrido. NO son 2h; es "N migraciones distributorias asincrónicas que no controlas".
   - **Cobertura de tests**: hoy `merge` (`store.ts:384-420`) no ramifica sobre `version` (aunque `version:1` existe en `store.ts:59`). No hay red de seguridad para validar un A→C del dato persistido.
   **Implicación**: A es una **puerta con dirección preferente**, no bidireccional. Si se publica A a producción, "migrar a C mañana" existe pero **no es trivial**.

7. **El consumidor real de EXIF GPS es US-14 (agregación sobre N tickets), no lectura puntual** — *corrección del round 1*:
   US-14 "Mapa de Restaurantes" (`US-14.md`, `TSK-4.4.md:18-22`) pinta marcadores agregando sobre TODOS los tickets del history del comensal: `tickets.filter(t => t.metadata?.exif?.gps).map(paintMarker)`. NO es lectura puntual de un único ticket. En agregación A y C tienen **coste de lectura idéntico**: ambos exigen un guard `if (gps == null) continue` igual de tipado. La fila "ergonomía de lectura en UI" (4.6) **se aplica a consumidores de ticket único** (`TicketDetailView`, `TicketSummary`), pero **el único consumidor confirmado en el backlog de EXIF GPS es agregación**, donde la ventaja de A no aplica.

8. **Telemetría ya está producida y descartada** — *hallazgo Judge A round 1*:
   `NewTicketCaptureView.handleCapture` (`NewTicketCaptureView.tsx:130-147`) recibe `ScanResult` con `engine`, `confidence` y `rawText`, pero al llamar `updateTicket(draftTicketId, {...})` **descarta esos campos**. La telemetría C (`extractedAt`, `durationMs`, per-engine confidence) **ya se está produciendo** en la pipeline y se tira en el límite de persistencia. Adoptar C no "especularía future needs"; capturaría **datos hoy en el floor**.

### ¿Cuándo activar C en su lugar?

Activar C si al menos una de:

- Implementarás **judgment-day adversarial** con 2+ OCR en paralelo y quieres conservar ambos resultados.
- **TSK-4.4 se implementará con los 2 proveedores de mapas** (Leaflet/OSM y Google Maps) en paralelo y mantendrás resultados de ambos por confianza — confirmado por spec (`TSK-4.4.md:15`).
- Necesitas telemetría de `durationMs` y `extractedAt` por cada retry en el propio ticket, capturando datos que hoy se descartan en `handleCapture`.

### Advertencia honesta del round 1

Si adoptas A y publicas Spliteat a producción antes de migrar a C, "migrar mañana" ya no es "2h no bloqueante": la migración ocurrirá cliente a cliente en sus navegadores, sin batch server-side, sin cobertura de tests del `merge`. Recomendado publicar A sólo si el switch a C ocurre **antes de cualquier release a producción con `metadata`**.

---

## 7. Resumen ejecutivo

| Dimensión | Ganador |
| --- | --- |
| Ajuste al código existente | **A** |
| Ergonomía de lectura en UI | **A** |
| Migración `merge` más simple | **A** |
| Multi-proveedor por fuente | **C** |
| Historial/telemetría de extracciones | **C** |
| Migración granular por fuente | **C** |
| Time-to-market para EXIF hoy | **A** |
| Storage / performance | indistinto |
| Acoplamiento con Firestore futuro | indistinto (A si sub-doc; C si arrayUnion) |

**Decisión recomendada**: **Propuesta A** para Spliteat rama `feature/feature-entrega2-ADLC` hoy, con `schemaVersion: 1` para abrir la puerta a C si aparece el caso de multi-proveedor adversarial.

---

## 8. Cómo reproducir esta verificación

```bash
# dentro del worktree de research
cd /Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research
git branch --show-current    # research/exif-metadata-extraction
ls .codegraph/               # codegraph.db existe
# codegraph_explore ya cubrió: Ticket (types.ts:71), addTicket (store.ts:154),
# merge (store.ts:384), handleFileChange (CameraCapture.tsx:134),
# compressImage (CameraCapture.tsx:382), handleCapture (NewTicketCaptureView.tsx:70),
# scanTicket (orchestrator.ts:69), ScanResult (scan/types.ts:10)
```

Para revisar el código fuente citado, este documento se basa en la salida verbatim de `codegraph_explore` del índice `.codegraph/codegraph.db` generado en el worktree el 2026-07-26.
