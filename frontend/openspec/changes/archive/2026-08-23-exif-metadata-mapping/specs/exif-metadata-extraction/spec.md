# Especificación: exif-metadata-extraction

## Purpose

Extracción local de EXIF (GPS, fecha, dispositivo, orientación) desde el File original con `exifr` (import dinámico), mapeo a `ExifNamespace` y transporte `{dataUrl, exif}` sin persistencia. Fuera de alcance: UI de GPS, consentimiento, mapa US-14 y persistencia en `Ticket.metadata`.

## Requirements

| ID | Requisito | Fuerza |
|----|-----------|--------|
| REQ-EXIF-01 | Extracción con exifr desde el File, pre-compress | MUST |
| REQ-EXIF-02 | Contrato raíz lat/lon (D8); desanidar `raw.gps` | MUST |
| REQ-EXIF-03 | Mapeo a ExifNamespace; retirar convertDMSToDecimal | MUST |
| REQ-EXIF-04 | Fallback nulo, nunca throw | MUST |
| REQ-EXIF-05 | Import dinámico de exifr | MUST |
| REQ-EXIF-06 | Transporte `{dataUrl, exif}` sin persistencia | MUST |
| REQ-EXIF-07 | Cámara en vivo → exif nulo | MUST |
| REQ-EXIF-08 | Verbose logs de éxito/fallo | SHOULD |
| REQ-EXIF-09 | Renombrado extractExifFromImageDataUrl → extractExifFromFile | MUST |
| REQ-EXIF-10 | stripExifMetadata NO implementado; sin @ts-expect-error mocked | MUST |

### Requirement: REQ-EXIF-01 — Extracción EXIF real desde el File (pre-compress)

`extractExifFromFile(file)` MUST parsear el File con `exifr.parse(file, { tiff: true, gps: true, ifd0: [...] })`. `CameraCapture.handleFileChange` MUST extraer EXIF del File original ANTES de `compressImage`.

#### Scenario: Upload con GPS real

- GIVEN un File JPEG con GPS (40.713333, -74.001667)
- WHEN `handleFileChange` procesa el File
- THEN `onCapture` recibe `{ dataUrl, exif }` con `exif.gps` decimal signado
- AND la extracción ocurre antes de `compressImage`

#### Scenario: Imagen sin EXIF

- GIVEN un JPEG sin metadatos EXIF
- WHEN `extractExifFromFile` lo parsea
- THEN devuelve `ExifNamespace` con campos `null`

### Requirement: REQ-EXIF-02 — Contrato de interfaz lat/lon a nivel raíz (D8)

`RawExifResult` MUST exponer `latitude?`/`longitude?` a nivel raíz (decimal signado). `extractExifFromFile` MUST desanidar `raw.gps` de exifr hacia ese contrato. Consumidores MUST NOT depender del formato interno de exifr.

#### Scenario: Desanidado de GPS

- GIVEN exifr devuelve `{ gps: { latitude, longitude } }`
- WHEN `extractExifFromFile` adapta el resultado
- THEN `RawExifResult` expone lat/lon raíz y `mapRawExifToNamespace` produce `gps` sin conversión DMS

### Requirement: REQ-EXIF-03 — Mapeo a ExifNamespace

El mapeo MUST producir `gps` (null si falta lat/lon), `timestamp` ISO (acepta `DateTimeOriginal` string o Date), `device {make, model}` y `orientation`. `convertDMSToDecimal` MUST retirarse (exifr convierte DMS→decimal internamente).

#### Scenario: Fecha Date o string

- GIVEN `DateTimeOriginal` como `Date` (reviveValues) o string EXIF
- WHEN `mapRawExifToNamespace` procesa
- THEN `timestamp` es ISO string en ambos casos

#### Scenario: GPS ausente

- GIVEN `RawExifResult` sin lat/lon
- WHEN se mapea
- THEN `gps` es `null` sin error

### Requirement: REQ-EXIF-04 — Fallback nulo, nunca throw

`extractExifFromFile` MUST NOT lanzar: si el import dinámico falla o `exifr.parse` rechaza, MUST devolver `ExifNamespace` nulo y el flujo de captura continúa.

#### Scenario: exifr falla

- GIVEN `exifr.parse` rechaza o el chunk no carga
- WHEN se extrae EXIF
- THEN se devuelve namespace nulo y no se interrumpe la captura

### Requirement: REQ-EXIF-05 — Import dinámico

`exifr` MUST cargarse con `await import('exifr')` solo en el flujo de captura; MUST NOT estar en el bundle inicial.

#### Scenario: Carga diferida

- GIVEN la app inicia sin captura
- WHEN no se extrae EXIF
- THEN exifr no se carga; el chunk se solicita en el primer `extractExifFromFile`

### Requirement: REQ-EXIF-06 — Transporte sin persistencia

El EXIF MUST viajar como `{ dataUrl, exif }` (tipo `CapturedImage`) por `onCapture` → `handlePhotoCaptured` → `handleConfirmAdjust`. `updateTicket` MUST NOT recibir `exif`; `Ticket.metadata` no se escribe (RGPD strict, sin consentimiento).

#### Scenario: Pipeline sin persistencia

- GIVEN un ticket con imagen con GPS
- WHEN se confirma el ajuste y se persiste
- THEN `updateTicket` recibe solo `image`/`scan` y el store no contiene `metadata.exif`
- AND el OCR no se rompe por el exif

### Requirement: REQ-EXIF-07 — Cámara en vivo → exif nulo

Cuando la captura viene de `captureFrame` (sin File), `exif` MUST ser namespace nulo.

#### Scenario: Captura por live stream

- GIVEN captura vía `getUserMedia`/`captureFrame`
- WHEN se confirma la imagen
- THEN `exif` es nulo (el live stream no expone EXIF)

### Requirement: REQ-EXIF-08 — Verbose logs

El sistema SHOULD registrar éxito/fallo de extracción vía `verboseLogs` cuando el flag está activo.

#### Scenario: Flag activo

- GIVEN `featureFlags.verboseLogs = true`
- WHEN la extracción termina (éxito o fallo)
- THEN se loguea el resultado de la extracción

### Requirement: REQ-EXIF-09 — Renombrado de la API

`extractExifFromImageDataUrl` MUST renombrarse a `extractExifFromFile(file: File)`; MUST NOT quedar callers de la firma antigua.

#### Scenario: Sin referencias antiguas

- GIVEN el código tras apply
- WHEN se busca `extractExifFromImageDataUrl`
- THEN no hay referencias; tests y flujo usan `extractExifFromFile`

### Requirement: REQ-EXIF-10 — Limpieza: stripExifMetadata y mocks

`stripExifMetadata` MUST documentarse como NO implementado y nunca invocarse en el flujo de captura. El código productivo MUST NOT contener `@ts-expect-error mocked` ni `exifreader`.

#### Scenario: Revisión de producción

- GIVEN el código tras apply
- WHEN se inspecciona `exifHelper.ts` y el flujo de captura
- THEN no hay `@ts-expect-error mocked`, ni `exifreader`, ni invocación a `stripExifMetadata`
- AND `stripExifMetadata` tiene JSDoc "NO implementado"