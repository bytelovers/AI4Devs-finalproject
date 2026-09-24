# Informe de Investigación Técnica: Extracción de Metadatos EXIF en SplitEat

**Worktree investigado**: `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research`
**Fecha**: 2026-07-26
**Naturaleza**: Investigación solo-lectura. No se modificó ningún archivo.

> **Aclaración preliminar sobre "api web"**: Tras revisar el repositorio, la app Spliteat es **100% frontend, mobile-first y offline-first**. No existe backend real implementado (`backend/` contiene solo `.keep`). Por tanto, la expresión "api web" debe interpretarse en este contexto como **Web APIs del navegador** (Canvas, `MediaDevices`, `ImageCapture`, `createImageBitmap`, `OffscreenCanvas`) y/o bibliotecas npm que corren en el navegador. En la documentación (`docs/api/integration_contracts.md`, `docs/tech-lead/tech_stack.md`) se planifica un backend Firebase Functions + Google Cloud Vision, **pero no está implementado**. El informe cubre ambas posibilidades y clarifica la ambigüedad en la sección 3.

---

## 1. Flujo actual de captura/subida de tickets

### 1.1 Arquitectura del flujo (frontend)

El flujo "Nuevo Ticket" es un **wizard de 5 pasos** gestionado por `react-router-dom` v7 con loaders en `frontend/src/lib/wizard-loaders.ts`:

- Pasos (en orden): `capture` → `review` → `participants` → `assign` → `summary`
- URL base: `/tickets/new/...` (ver `STEP_URL` en `wizard-loaders.ts:159-165`)
- Orquestador del wizard: `frontend/src/views/NewTicketShell.tsx` y loaders `newTicketParentLoader` (`wizard-loaders.ts:50-65`), `captureLoader`, `reviewLoader`, etc.
- Datos: el "draft ticket" persiste en el store Zustand apuntado por `draftTicketId` (`store.ts:29-37`).

### 1.2 Captura de la imagen

**Componente**: `frontend/src/components/camera/CameraCapture.tsx` (419 líneas).

Modos (`CameraCapture.tsx:20`):

1. **Cámara en vivo** con `getUserMedia` y `facingMode: 'environment'` (`:55-62`). Captura vía `canvas.drawImage(video)` y `canvas.toDataURL('image/jpeg', 0.92)` (`:97-110`).
2. **Cámara nativa** vía `<input type="file" accept="image/*" capture="environment">` (`:362-369`).
3. **Subir archivo** vía `<input type="file" accept="image/*">` (`:370-376`), que pasa por `compressImage()` (`:382-418`) — **re-dibuja el File en canvas** a max 1600px / calidad 0.85 y emite `toDataURL('image/jpeg', 0.85)`.
4. **Vista previa** confirma antes de subir (`:168-204`).

> **Punto crítico para EXIF**: Tanto la captura en vivo (`canvas.drawImage` + `toDataURL`) como la subida desde galería (`compressImage`) **re-dibujan en canvas y re-encadenan como JPEG**, lo cual **preserva la mayoría de EXIF en la mayoría de navegadores, pero los navegadores modernos (Safari iOS 14.4+, Chrome Android, Firefox) **descartan por defecto los metadatos EXIF** del binario de salida de `canvas.toDataURL`. Es decir, en el camino actual, los datos EXIF MAY se descartan para la ruta "cámara en vivo". Para la ruta "subir archivo", el `File` original **conserva los EXIF hasta el momento del `compressImage`**, momento donde se pierden. El punto correcto para extraer EXIF es **antes** de llamar a `compressImage`, leyendo del `File` original.

Existe además un hook `frontend/src/hooks/useCamera.ts` (210 líneas) con `MAX_DIMENSION=1920` y `JPEG_QUALITY=0.8` y soporte `ImageCapture.grabFrame()`, usado por el `CameraViewfinder`/`CameraScanFlow` (no por `CameraCapture`).

### 1.3 Procesamiento OCR tras captura

**Vista or Quest**: `frontend/views/NewTicketCaptureView.tsx` (312 líneas):

- `handleCapture(imageDataUrl)` (`:70-164`): guarda la imagen en el draft (`updateTicket(draftTicketId, { image: imageDataUrl })`), preprocesa con `preprocessReceiptImage` (`preprocessor.ts`, max 1280px), y dispara el **worker OCR** vía Comlink (`workers/ocr.worker.ts`).
- Worker: `frontend/src/workers/ocr.worker.ts` (65 líneas) — expone `processImage(imageSrc, options, onProgress)` que llama a `scanTicket` del `orchestrator.ts`.
- Orquestador: `frontend/src/lib/scan/orchestrator.ts:69-145` con fallback en cadena `florence2` → `tesseract-ner` → `tesseract`. El motor `server` está **excluido del build** (`orchestrator.ts:10-11, 216`).
- Resultado `ScanResult` se persiste de vuelta al draft con `updateTicket` (`NewTicketCaptureView.tsx:130-147`).

### 1.4 Contrato API (planned vs implemented)

**Implementado**: **No existe API HTTP**. La "API" interna es la firma del worker Comlink:

```ts
// frontend/src/lib/scan/types.ts:10-38
interface ScanResult {
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  discounts?: Array<{...}>
  merchant?: string
  date?: string        // << ya existe campo, pero NO se llena desde EXIF hoy
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  engine: ScanEngineName
  preprocessedImageDataUrl?: string
  rawText?: string
}
```

Entrada del pipeline (`types.ts:3-8`): `{ imageDataUrl: string; forceServer?: boolean }`.

**Planificado en docs** (NO implementado): `POST /api/v1/ocr` con payload `{ image: base64, locale, clientTimestamp }` y respuesta `{ success, data: { metadata: { restaurantName, date, taxAmount, subtotal, totalAmount }, items: [...] } }` — ver `docs/api/integration_contracts.md:7-61`. La respuesta planificada **ya contempla un bloque `metadata`** donde encajarían los datos EXIF (GPS, fecha de captura, etc.) como extensión natural.

---

## 2. Modelo de datos actual

### 2.1 Modelo en uso (Zustand + localStorage)

**Archivo**: `frontend/src/lib/types.ts:71-109` — interfaz `Ticket`:

| Campo | Tipo | Línea | Notas |
| --- | --- | --- | --- |
| `id` | `string` | 72 | `genId()` |
| `title` | `string` | 73 | |
| `date` | `string` (ISO) | 75 | **Fecha de la factura** — candidata a sobrescribirse con EXIF DateTimeOriginal |
| `merchant?` | `string` | 77 | |
| **`image?`** | `string` (data URL) | **79** | **Aquí vive la imagen (base64 JPEG)**. Punto donde se adjunta EXIF |
| `items` | `TicketItem[]` | 81 | |
| `discounts` | `TicketDiscount[]` | 83 | |
| `subtotal`, `taxRate`, `taxAmount`, `taxMode` | numéricos | 85-91 | |
| `tipMode`, `tipAmount`, `tipPercentage` | | 93-97 | |
| `taxDistribution`, `tipDistribution` | `'proportional'\|'equal'` | 99-101 | |
| `participantIds` | `ID[]` | 103 | |
| `paidBy?` | `ID` | 105 | |
| `status` | `'draft'\|'balanced'\|'closed'` | 106 | |
| `createdAt`, `updatedAt` | `string` ISO | 107-108 | |

`ScanResult` (texto del escaneo) está en `types.ts:10-38`; no se persiste, pero es la fuente implícita.

> **No existe campo `metadata` ni `exif` en `Ticket`**. Es el lugar natural para añadir, por ejemplo, `exifMetadata?: { latitude?, longitude?, capturedAt?, device?, orientation? }`.

### 2.2 Estado global persistido

**`AppData` en `types.ts:112-140`** → persistido en `localStorage` clave `'spliteat-app-v1'` (`store.ts:369`). El store Zustand completa la persistencia con `persist` + `partialize` (`store.ts:367-422`) y **función `merge` con migraciones inline** (`store.ts:384-420`) — patrón a replicar para añadir el nuevo campo EXIF con saneamiento de tickets antiguos.

`addTicket(partial)` en `store.ts:154-202` es el **punto único de construcción** del ticket, donde se inyectaría el campo EXIF desde el `partial.image`.

### 2.3 Modelo planificado (Dexie + Firestore) — NO implementado

`docs/db/data_schema.md` describe un modelo **paralelo no implementado aún**:

- **Dexie (IndexedDB)**: interfaz `Ticket` (`data_schema.md:38-52`) con `restaurantName, date, subtotal, ..., syncStatus, lastUpdated`. **No contempla EXIF**. Schema Dexie `version(1).stores({...})` en `data_schema.md:61-65` — sin índices sobre GPS.
- **Firestore**: `/tickets/{ticketId}` (`data_schema.md:85-111`) con `participants` y `items` como sub-arrays. **Tampoco contempla EXIF ni GPS**. Aquí habría que añadir un sub-documento `exif: { latitude, longitude, capturedAt, device, orientation }` o un campo `geoPoint: GeoPoint` nativo de Firestore.
- **Sincronización LWW** (`data_schema.md:122-148`) con `syncStatus: 'pending-*'` — el EXIF debería propagarse como parte del doc y respetar el LWW.

> **Discrepancia importante**: `package.json` declara `dexie@^4.0.1` (línea 48) pero el **código real NO usa Dexie** — usa Zustand+localStorage. La doc `data_schema.md` describe aspiracional. Cualquier implementación EXIF debe partir del estado **real**: Zustand + localStorage + types.ts.

### 2.4 Dónde se adjuntaría EXIF

Tres niveles coexistentes:

1. **`Ticket.image`** (`types.ts:79`): el binario JPEG data URL. NO debe portar EXIF al云端 por RGPD (se debe "stripear" antes de cualquier sync cloud — ver `docs/user-stories/epic-4-analytics/TSK-4.3.md:9-17`).
2. **Nuevo campo `Ticket.exifMetadata?`** (añadir a `types.ts:71-109`): JSON plano con `{ latitude, longitude, capturedAt, device, orientation }`. Persiste en localStorage con el resto.
3. **Pipeline de scan**: extender `ScanResult.date` (`types.ts:25`) hoy vacío, o añadir `ScanResult.capturedAt` llenado desde EXIF en el preprocesado — útil para que el OCR pueda validar que la `date` impresa en el ticket coincide con la fecha de toma.

---

## 3. APIs Web disponibles para extraer EXIF

### 3.1 Clarificación de la ambigüedad "api web"

Existen **tres interpretaciones posibles**; el informe las desambieza con base en el repo:

| Interpretación | Significado | Viabilidad en Spliteat |
| --- | --- | --- |
| A. **Web API nativa del navegador** | `ImageDecoder` (WCG), `createImageBitmap`, `HTMLImageElement` + acceso a bytes | `createImageBitmap` ya se usa en `frontend/src/lib/scan/preprocessor.ts` (vía `loadImageElement`) y se planifica en worker (`openspec/changes/ocr-pipeline-rewrite/design.md:103`). **`ImageDecoder` NO expone EXIF** en su API actual (sólo decodifica frames). Por tanto, una "Web API pura" no es suficiente. |
| B. **Biblioteca npm que corre en el navegador** | `exifreader`, `exifr`, `piexifjs`, `exif-js` | **Es lo que el equipo ya planificó**: `exifreader` se menciona literalmente en `docs/user-stories/epic-4-analytics/TSK-4.3.md:14` ("Instalar `exifreader` o una librería de lectura EXIF ligera compatible con navegadores móviles"). |
| C. **API HTTP de terceros** | Servicio externo al que se envía la imagen y devuelve EXIF | **Descartada** por RGPD y filosofía offline (`docs/prd/PRD.md:152`: "procesar datos EXIF y fotos de forma local y anónima"). |

**Conclusión**: En Spliteat, "api web" se materializa como **biblioteca npm elección local (preferida `exifreader` o `exifr`)** corriendo en el navegador, usando `File`/`ArrayBuffer` como entrada. Lo nativo del navegador **no basta** para EXTRAER metadatos EXIF (sólo para leer píxeles).

### 3.2 Opciones browser-side (npm)

| Lib | Bundle (min+gzip) | Mantenimiento | Pros | Contras |
| --- | --- | --- | --- | --- |
| **`exifreader`** | ~40-60 kB | Activo, MIT, actualizado a 2024+ | Soporta JPEG/TIFF/PNG/HEIC(parcial/Web). API tipada. Ya planificado en TSK-4.3 (`TSK-4.3.md:14`). Soporta lectura desde `ArrayBuffer` y `Blob`. | HEIC válido sólo en algunos builds. Documentación algo críptica. |
| **`exifr`** | ~5-8 kB (modular hasta ~3 kB) | Mantenimiento activo, ESM/tree-shakeable, MIT | **Más pequeño**, API moderna `exifr.parse(file, {tiff:true, gps:true})`. Funciona con `File`, `Blob`, `URL`, `dataURL`. ESM puro. Soporta filtros por tag. | Menos tags exóticos que exiftool. HEIC sin soporte. |
| **`exif-js`** | ~12 kB | **Abandonado** (última release 2014-2017) | Histórico | Inmantenible, sin soporte ESM, sin TS types builtin, sin HEIC. **No recomendado**. |
| **`piexifjs`** | ~9 kB | Bajo mantenimiento | Permite **modificar** EXIF además de leer — útil para "sanitizar" reescribiendo EXIF limpio | Sólo JPEG (no PNG, no HEIC), API callback (no Promise), sin TS types. |

**Recomendación**: **`exifr`** si prima el tamaño del bundle y la integración ESM moderna en el store/preprocesado; **`exifreader`** si se necesita soporte HEIC o si se sigue el plan literal de TSK-4.3. Ambos son < 60 kB.

### 3.3 Opciones server-side (npm)

| Lib | Pros | Contras / Aplicabilidad aquí |
| --- | --- | --- |
| **`exiftool-vendored`** | El vendored de ExifTool perl, **el más exhaustivo** del mercado; soporte HEIC/HEIF/MOV/RAF/etc. | Requiere `spawn` de binarios perl. **No corre en browser** ni en Firebase Functions salvo build específico. Sobredimensionado para una PWA. |
| **`sharp`** | Ya aparece en `pnpm-lock.yaml` (`frontend/pnpm-lock.yaml:3151,3841,6431`) y en `frontend/pnpm-workspace.yaml:5` (`allowBuilds: sharp: true`). Lee `sharp.metadata` con EXIF, orientation, ICC. Reescritura muy eficiente. | **Sólo Node**: requiere backend. Hoy no se usa en `frontend/src` (`grep` confirmó 0 `import` de sharp). Sería la opción **si/se implementa el backend Firebase Functions planificado** (`docs/tech-lead/tech_stack.md:19`). |
| **`exifreader`** (server mode) | El mismo `exifreader` funciona también en Node, leyendo `Buffer`. | Si la app suma backend, vale la pena **re-usar el mismo parser client-side y server-side**. |

### 3.4 Opción "Web API nativa" reinterpretada

Some browser APIs tangential:

- **`createImageBitmap`** — ya usado (`useCamera.ts:48`, design `ocr-pipeline-rewrite:103`). Decodifica a `ImageBitmap` pero **no retorna EXIF**, sólo pixels. Útil, no suficiente.
- **`ImageDecoder`** (WebCodecs) — Chrome/Edge only; moderno pero **no expone metadatos EXIF**, sólo frames+config del códec. No útil para EXIF.
- **`File` + `arrayBuffer()`** — es la entrada típica para `exifr`/`exifreader`.

**Por tanto, nativo puro NO es solución**. Se requiere una librería que parsea los segmentos APP1/APP3 del JPEG.

---

## 4. Campos EXIF relevantes para un ticket Spliteat

| Tag EXIF | CampoSpliteat sugerido | Valor de negocio | Justificación |
| --- | --- | --- | --- |
| **GPSLatitude / GPSLongitude** (`GPSLatitudeRef`, `GPSLongitudeRef`) | `exifMetadata.latitude/longitude` | **Alto** — alimenta US-14 "Mapa de Restaurantes" (`docs/user-stories/epic-4-analytics/US-14.md`) y F-03 (`PRD.md:52`). | Localización del restaurante. Requiere desambiguar "dónde se tomó la foto" ≠ "dónde se pagó", pero es la mejor proxy gratuita. |
| **DateTimeOriginal** (tag 0x9003) / DateTimeDigitized (0x9004) | `exifMetadata.capturedAt` → candidato a sobrescribir `Ticket.date` si está vacío | **Alto** | El ticket tiene `Ticket.date` (`types.ts:75`) que hoy se rellena con `now` (`store.ts:155`). La fecha de toma EXIF verifica/encuentra la fecha impresa en el ticket. |
| **Make / Model** (0x010F, 0x0110) | `exifMetadata.device` | **Medio** | Útil para debugging de calidad de OCR por modelo y para filtrar posibles bugs de foco/procesado. **Debe minimizarse/anónimizar para RGPD** (`PRD.md:152`). |
| **Orientation** (0x0112) | `exifMetadata.orientation` | **Medio** | Permite **auto-rotar** la imagen para OCR. Hoy el preprocesado (`preprocessor.ts`) no corrige orientación — EXIF orientation es la causa nº1 de tickets rotados que fallan OCR. |
| **Software** / **XPTitle** etc. | — | Bajo | Ruido, descartar. |
| **GPSAltitude, GPSTimeStamp, GPSDateStamp** | sub-campos opcionales en `exifMetadata.gps` | Bajo | Métrica secundaria "a qué hora real cenaron". |

**Sugerencia de tipo** (añadir a `types.ts`):

```ts
export interface TicketExifMetadata {
  latitude?: number
  longitude?: number
  capturedAt?: string  // ISO 8601
  device?: string       // 'Apple iPhone 13' etc. — opcional, RGPD
  orientation?: 1|3|6|8
}
// añadir a Ticket:
exifMetadata?: TicketExifMetadata
```

---

## 5. Implicaciones de almacenamiento

### 5.1 Almacenamiento local (real, hoy: Zustand + localStorage)

**Cambio mínimo y natural**:

- Añadir `exifMetadata?: TicketExifMetadata` a `Ticket` en `frontend/src/lib/types.ts:79` (junto al `image?`).
- Migración `merge` en `store.ts:384-420`: iterar `merged.tickets` y **asegurar `t.exifMetadata` definido como `undefined` si no existe** (no hace falta asignar default; basta no romper).
- El coste es despreciable: ~80 bytes extra por ticket en localStorage.
- **Riesgo storage**: localStorage tiene límite ~5 MB y **las imágenes base64 ya comen la mayoría del cupo** (`Ticket.image`). Añadir EXIF empeora marginalmente, pero el problema real ya existe por `image`. Para mitigar, plantear migrar `image` a IndexedDB (Dexie ya declarado en deps pero no usado).

**Recomendación de cara a futuro**:

- Si Spliteat implementa el `data_schema.md` planificado (Dexie `tickets` store), añadir el campo `exifMetadata` al `Ticket` Dexie y **no indexar** GPS (no se consulta por GPS salvo US-14, que recorre todos los tickets — indexación innecesaria).
- Para Firestore: añadir `exifMetadata: { latitude, longitude, capturedAt, orientation }` como sub-mapa del doc `/tickets/{ticketId}` (`data_schema.md:85-111`). Para queries de US-14 "Mapa", usar `GeoPoint` + `geohash` si se quiere clusterizar.

### 5.2 Migraciones / Prisma

**No aplica Prisma**: no existe ORM alguno en el repo. No hay `prisma/schema.prisma` ni `backend/prisma` ni `db/migrations`. La carpeta `db/` contiene sólo `.keep`. El "ORM" implícito planificado es Firestore (NoSQL), sin schema formal ni migraciones.

### 5.3 Tipos en el frontend

- `frontend/src/lib/types.ts:71-109` — añadir `TicketExifMetadata` y el campo en `Ticket`.
- `frontend/src/lib/types.ts:10-38` (`ScanResult`) — opcionalmente añadir `capturedAt?: string` o `exifMetadata?` para propagación explícita del capture → review.
- `frontend/src/lib/store.ts:154-202` (`addTicket`) — propagar `partial.exifMetadata` al crear el ticket.
- `frontend/src/views/NewTicketCaptureView.tsx:130-147` — añadir `exifMetadata` al `updateTicket(draftTicketId, {...})`.

---

## 6. Riesgos / casos límite

| Riesgo | Detalle / Evidencia repo | Mitigación |
| --- | --- | --- |
| **HEIC/HEIF de iPhone** | iOS sube HEIC por defecto a partir de iOS 11. La cámara nativa vía `capture="environment"` (`CameraCapture.tsx:366`) puede llegar a entregar HEIC en algunos navegadores iOS Safari. `compressImage` (`:382-418`) usa `Image()`+`canvas` que **sí decodifica HEIC en Safari**, pero el `File` original conserva EXIF. `exifr` **no parsea HEIC**; `exifreader` literalmente lo declara en su README ("HEIC reading support is limited"). | (a) Convertir HEIC→JPEG antes de parsear EXIF usando `canvas.toBlob` ; (b) parsear EXIF del `File` HEIC **antes** de cualquier transformación; c) forzar `accept="image/jpeg,image/png"` en los `<input>` (`CameraCapture.tsx:365,373`) para evitar HEIC en upload. |
| **EXIF "stripeado" por apps/redes** | Fotos descargadas de WhatsApp/Telegram/Instagram NO traen EXIF (y a veces ni GPS en fotos de cámara Android). | Detectar EXIF vacío y degradar con elegancia: `exifMetadata = {}` → fallback a `Ticket.date = new Date().toISOString()` como hoy (`store.ts:155`). |
| **RGPD — GPS privado** | `PRD.md:152` exige "procesar datos EXIF y fotos de forma local y anónima. El envío a la nube de cualquier dato geolocalizado requiere consentimiento explícito e inicio de sesión". | (a) **Extraer EXIF siempre en cliente**; (b) **NO sincronizar `exifMetadata` a Firestore salvo usuarios registrados con consentimiento**; la guía explícita está en `TSK-4.3.md:9-17` ("eliminar estos metadatos del binario de la imagen antes de subirla a la nube") mediante `stripExifMetadata(imageFile): Promise<Blob>` (reconstrucción por canvas). |
| **`canvas.toDataURL` descarta EXIF** | Tanto `CameraCapture.captureFrame` (`:97-110`) como `compressImage` (`:382-418`) re-dibujan. | **Parsear EXIF del `File` original antes** de cualquier `toDataURL`/`drawImage`. Para la ruta "cámara en vivo", el EXIF no existe (el frame viene de `MediaStream`), así que para esa ruta GPS/capturedAt **no se podrá obtener** salvo `MediaStreamTrack` `getSettings()` (no expone GPS). GPS EXIF sólo aplicará a la ruta "upload". |
| **Payloads base64 grandes** | El store guarda `image` como data URL (`types.ts:79`) en localStorage — fácil superar 5 MB con 2 tickets. EXIF agrava levemente. | Migrar `image` a IndexedDB (Dexie ya en `deps`), o **no añadir `exifMetadata` a localStorage y mantenerlo sólo en memoria del draft** hasta que el ticket se cierre. |
| **Orientation** | EXIF orientation 6 (rotado 90° CCW) causa OCR fail en tickets envertical. Hoy `preprocessor.ts` no corrige orientación. | Tras leer `orientation` con exifr, en `preprocessReceiptImage` aplicar `ctx.rotate`/`ctx.translate` según valor antes del grayscale. |
| **Sobrescritura de `Ticket.date`** | El usuario puede haber editado manualmente la fecha en `NewTicketReviewView` (`:74-81` el título se edita, pudiendo extender a fecha). | Sólo usar `exifMetadata.capturedAt` como **sugerencia** en `/review`, no auto-sobrescribir si `Ticket.date` ya fue tocada por el usuario. |
| **Permisos** | `PRD.md:140` ya aclara que debe "handle permission denials gracefully, falling back to gallery image uploads and manual entry without geo-tagging". | EXIF no requiere permiso cámara adicional; el GPS EXIF viene INS en el binario. No hay nothing to decline. |

---

## 7. Recomendación de arquitectura

**Recomendación: EXTRACCIÓN CLIENTE, ANTES DEL UPLOAD.**

### 7.1 Razones técnicas basadas en el repo

1. **Filosofía offline-first** (`PRD.md:11, 139`): Spliteat funciona sin backend. Server-side supone añadir una dependencia que rompe el modo offline (impacto UX crítico alineado con personas KPI K-01 < 90s).
2. **No existe backend**: `backend/` está vacío (`/Users/develop/.../backend/.keep`). Implementar server-side requeriría levantar Firebase Functions (planificado en `docs/tech-lead/tech_stack.md:19` pero **no materializado**).
3. **RGPD explícito** (`PRD.md:152`, `TSK-4.3.md:9-17`): el documento de requerimientos exige extraer EXIF localmente y **stripear antes de enviar a la nube**. Esto por definición descarta la extracción server-side para los datos sensibles (GPS).
4. **Pipeline ya es cliente**: `preprocessor.ts` y `orchestrator.ts` ya procesan la imagen en el navegador (con Web Worker vía Comlink `ocr.worker.ts`). Insertar `exifr.parse(file)` antes de `preprocessReceiptImage` es **una línea nueva en el flujo existente**, sin añadir hop de red.
5. **Ancho de banda**: extraer EXIF en el cliente permite adjuntar sólo ~80 bytes (`exifMetadata`) al ticket, no re-envía megabytes de imagen a un server que ya estaban en el navegador.
6. **`sharp` ya permitido en build pero sin uso**: la presencia de sharp en `pnpm-workspace.yaml:5` y `pnpm-lock.yaml:3151` sugiere que el equipo contempló pasarlo a un futuro worker/backend. Si se implementase un backend OCR con Cloud Vision (`docs/tech-lead/tech_stack.md:18`), sharp podría **re-leer EXIF como validación cross-check** en el servidor — rol complementario, no primario.

### 7.2 Flujo recomendado en pseudocódigo

Insertar un paso en `CameraCapture.tsx` (ruta upload) y exponer a `preprocessor.ts`:

```ts
// En CameraCapture.tsx, dentro de handleFileChange, ANTES de compressImage:
import { exifr } from 'exifr'
const exif = await exifr.parse(file, { tiff: true, gps: true, ifd0: ['Make','Model','DateTimeOriginal','Orientation'] })
// exif = { latitude, longitude, DateTimeOriginal, Make, Model, Orientation }
// Pasar exif al onCapture junto al dataUrl comprimido
```

En `NewTicketCaptureView.handleCapture` extender (`NewTicketCaptureView.tsx:70-164`):

```ts
updateTicket(draftTicketId, {
  image: imageDataUrl,
  exifMetadata: {
    latitude: exif?.latitude, longitude: exif?.longitude,
    capturedAt: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString() : undefined,
    device: exif?.Make ? `${exif.Make} ${exif.Model}`.trim() : undefined,
    orientation: exif?.Orientation,
  },
})
```

Para US-14 (Mapa futuro, `TSK-4.4.md`), ya queda listo `exifMetadata.latitude/longitude` sin re-procesar imágenes.

### 7.3 "Stripping" RGPD antes de cloud sync

Implementar `stripExifMetadata(imageFile): Promise<Blob>` en `frontend/src/utils/exifHelper.ts` (ruta ya reservada en `TSK-4.3.md:14-17`) usando `createImageBitmap` (ya usado en `useCamera.ts:48`) + `canvas.toBlob('image/jpeg')`. Re-dibujar elimina APP1. Validar con `exifr.parse(blobResult)` → debe devolver `{}`.

### 7.4 Comparativa explícita

| | Client-side | Server-side |
| --- | --- | --- |
| Offline | **Sí** | No |
| RGPD | **Cumple sin esfuerzo** | Requiere stripping + log adicional |
| Bundle | +~5 kB (exifr) | 0 kB frontend |
| Backend | **No requiere** | Requiere Firebase Functions (no existe) |
| Precisión GPS | Excelente (raw EXIF) | Idéntica — no aporta |
| Mantenimiento | 1 lib npm | Binarios backend + deploys |
| Híbrido futuro | Compatible con sharp server-side cross-check | compatible con sharp server-side cross-check | N/A |

---

## 8. Archivos relevantes existentes (con rutas absolutas y contexto)

### 8.1 Frontend — flujo de ticket/captura/subida

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/types.ts` — tipos centrales; `Ticket` en líneas 71-109 (campo `image?` línea 79, `date` 75, sin EXIF). `ScanResult` en 10-38.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/store.ts` — store Zustand; `addTicket` 154-202, `merge` migración 384-420, persist 367-422.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/wizard-loaders.ts` — loaders del wizard, define `WizardStep` (18), `STEP_URL` (159), `BLOCKER_CHECKS` (174).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/components/camera/CameraCapture.tsx` — captura 3 modos; `captureFrame` 97-110, `compressImage` 382-418, inputs file 362-376.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/components/camera/CameraScanFlow.tsx` y `CameraViewfinder.tsx` y `index.ts` — variante del flujo de cámara.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/hooks/useCamera.ts` — hook de cámara (210 líneas), `MAX_DIMENSION=1920`, `JPEG_QUALITY=0.8`, ya usa `ImageCapture.grabFrame()` y `createImageBitmap` implícitamente.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/views/NewTicketCaptureView.tsx` — vista de captura; `handleCapture` 70-164, `updateTicket(draftTicketId,…` 130-147.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/views/NewTicketReviewView.tsx` — revisión; preview imagen 56-71, edición título 73-81.

### 8.2 Frontend — pipeline OCR/existentes (donde encajaría EXIF antes del preprocesado)

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/scan/preprocessor.ts` — preprocesador Canvas (grayscale, histograma, mediana); `loadImageElement` 195-203. **No corrige orientation**.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/scan/types.ts` — `ScanInput`, `ScanResult`, `ScanEngineName`, `ScanProgress` (líneas 3-87).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/scan/orchestrator.ts` — `scanTicket` 69-145, fallback chain, motor `server` excluido 10-11, 216.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/scan/capabilities.ts` — `detectCapabilities`, `isOnline = navigator.onLine` (13), `getRecommendedEngine` (170).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/workers/ocr.worker.ts` — Comlink worker 64-65 con `processImage`.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/lib/scan/tesseract-engine.ts`, `tesseract-ner-engine.ts`, `ner-engine.ts`, `florence-engine.ts`, `mini-agent.ts`, `model-manager.ts`, `receipt-parser.ts`, `storage-manager.ts`, `download-tracker.ts` — motores OCR planificados/excluidos.

### 8.3 Frontend — componentes ticket/review

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/src/components/ticket/TicketItemsEditor.tsx` — editor de items.
- `…/ticket/TicketSummary.tsx`, `…/ticket/AssignmentEditor.tsx`, `…/ticket/ParticipantPicker.xaml` — resto del wizard.
- `…/scan/ScanEngineSelector.tsx` — selector de motor.

### 8.4 Configuración / deps

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/package.json` — deps; **no hay ninguna lib EXIF instalada**; `dexie@4.0.1` (48) aunque no se usa; `@huggingface/transformers` (16), `tesseract.js` (61), `comlink` (46).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/pnpm-workspace.yaml` — `allowBuilds` incluye `sharp: true` (5), `tesseract.js: true` (6).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/frontend/pnpm-lock.yaml` — `sharp@0.34.5` resolverse (3151, 6431) y sus binarios vendored (566-709) — sharp está descargado pero **no importado** en `frontend/src`.

### 8.5 Documentación (PRD, brief, tech-lead, US)

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/prd/PRD.md` — feature **F-03 Extracción Segura de Metadatos EXIF** (52); **RGPD EXIF explícito** (152); Camera & Geolocation permissions (140).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/prd/brief.md` — mapa de visitas con EXIF (35); procesamiento RGPD local (51).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/user-stories/epic-4-analytics/US-14.md` — Mapa de restaurantes + analíticas.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/user-stories/epic-4-analytics/TSK-4.3.md` — Extractor EXIF + `stripExifMetadata`; nombra `exifreader` (14), pide `src/utils/exifHelper.ts` (15).
- `…/epic-4-analytics/TSK-4.4.md` — Vista Mapa (Leaflet/MapView).
- `…/epic-4-analytics/TSK-4.5.md` — Panel analíticas (Recharts, ya en deps `package.json:58`).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/user_stories_traceability.md` — US-14 listo (25).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/tech-lead/tech_stack.md` — Firebase Functions + Cloud Vision planificado (19-20).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/tech-lead/backlog.md` — backlog con US-14 y TSK-4.3 a TSK-4.5; menciona "strips personal metadata before uploading" (493).
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/qa/judgment_report.md` — PASS EXIF stripping (33).

### 8.6 Contractos / schema (planificado, no implementado)

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/api/integration_contracts.md` — contrato planificado `POST /api/v1/ocr` con bloque `metadata` (29-34) donde encajaría EXIF.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/docs/db/data_schema.md` — schema Dexie (50-69) y Firestore (85-111); NO contempla EXIF. Lugar natural: añadir `exifMetadata` al doc `/tickets/{ticketId}` de Firestore.

### 8.7 OpenSpec / migrations previas relevantes

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/openspec/changes/ocr-pipeline-rewrite/design.md` — diseño del pipeline actual; menciona `createImageBitmap` y `OffscreenCanvas` (17, 103) — claves para extender el worker con EXIF en el futuro. En `tasks.md` (27) referencia migrar preprocessor.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/openspec/changes/new-ticket-6-steps-migration/` y `new-ticket-flow-migration/` y `camera-capture-migration/` — historia de migraciones del flujo actual.

### 8.8 Backend / DB (vacío)

- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/backend/.keep` — **no existe backend**.
- `/Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-exif-research/db/.keep` — **no existe schema/migrations**.

---

## Resumen ejecutivo

- **No hay backend ni DB implementados**; Spliteat es PWA 100% cliente con Zustand + localStorage. Cualquier "api web" significa **Web APIs del navegador** complementadas por una **librería npm browser-side** (ya planificada en `TSK-4.3.md` como `exifreader`).
- **El punto de extracción correcto**: leer EXIF del `File` original en `CameraCapture.handleFileChange` (`CameraCapture.tsx:134-156`) **antes** de `compressImage` (que usa `canvas.toDataURL` y descarta EXIF). En la ruta "cámara en vivo" no se podrá obtener GPS del live stream.
- **Librería recomendada**: `exifr` (~5 kB, ESM, parser moderno) o `exifreader` (siguiendo literal TSK-4.3). Sharp está descargado pero **no importado** — sería una opción server-side sólo si se levanta el backend Firebase planificado.
- **Campos a persistir**: `latitude`, `longitude`, `capturedAt`, `device` (anonimizable RGPD), `orientation`.
- **Tipo nuevo**: añadir `TicketExifMetadata` + `Ticket.exifMetadata?: TicketExifMetadata` a `frontend/src/lib/types.ts:71-109` y migrar viejos tickets en la función `merge` de `store.ts:384-420`.
- **RGPD**: cumplido de facto extrayendo en cliente; `stripExifMetadata` todavía es tarea pendiente (TSK-4.3) para antes de sincronizar a Firestore.
- **Recomendación arquitectónica explícita**: **extraer EXIF client-side, antes del upload**, dentro del flujo existente `CameraCapture → NewTicketCaptureView.handleCapture → updateTicket`, reutilizando el patrón Comlink/OR descriptivamente está fuera de gains. La función futura `stripExifMetadata` para sincronización cloud hace limpieza con `createImageBitmap`+`canvas.toBlob` (api web nativa).
