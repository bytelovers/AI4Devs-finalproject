# Tasks: Extracción y Mapeo de Metadatos EXIF

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450-550 |
| 400-line budget risk | Medium |
| 800-line session budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 infra+core, PR 2 integración |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
800-line session budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test | Runtime harness | Rollback boundary |
|------|------|-----------|--------------|-----------------|-------------------|
| 1 | exifr + tipos + helper | PR 1 | `pnpm test src/utils/exifHelper.test.ts` | N/A (sin UI) | Revertir package.json, types.ts, exifHelper |
| 2 | Wiring + transporte | PR 2 | `pnpm test src/components/camera/CameraCapture.test.tsx` | `pnpm dev` + imagen GPS | Revertir CameraCapture, View, test |

## Fase 1: Infraestructura

- [x] 1.1 [config] `pnpm add exifr` en frontend/ (package.json). Pre-flight: `pnpm test` verde.
- [x] 1.2 [test][RED] `exifHelper.test.ts`: `vi.mock('exifr', ...)` con `parse: vi.fn()`; fixture GPS decimal (40.713333, -74.001667) + vacío; ver rojo.
- [x] 1.3 [types] `types.ts`: `RawExifResult` con lat/lon raíz (D8) y `DateTimeOriginal: string|Date`; añadir `CapturedImage { dataUrl; exif }`.

## Fase 2: Core — exifHelper.ts

- [x] 2.1 [add_function][GREEN] `extractExifFromFile(file)`: import dinámico exifr; `parse(file, {tiff:true, gps:true, ifd0:[...]})`; desanidar `raw.gps`→contrato raíz (D8); fallback nulo nunca throw (D5); borrar `extractExifFromImageDataUrl` (D6).
- [x] 2.2 [refactor][GREEN] `mapRawExifToNamespace` adaptado al contrato raíz; retirar `convertDMSToDecimal`, `parseExifDate`, `dataUrlToBlob`; JSDoc `stripExifMetadata` = NO implementado.
- [x] 2.3 [test][GREEN] Cubrir: GPS signado, fecha Date/string→ISO, vacío→nulls, parse falla→nulo.

## Fase 3: Integración

- [x] 3.1 [test][RED] `CameraCapture.test.tsx`: `fireEvent.change` en input file; stub `canvas.getContext` (jsdom); verificar `parse` con el File y `onCapture({dataUrl, exif})`.
- [x] 3.2 [integrate][GREEN] `CameraCapture.tsx`: extraer EXIF en `handleFileChange` ANTES de `compressImage`; exif en estado; `onCapture(img: CapturedImage)`; cámara en vivo→exif nulo.
- [x] 3.3 [integrate][GREEN] `NewTicketCaptureView.tsx`: `handlePhotoCaptured(img: CapturedImage)`; transportar exif; `updateTicket` SIN exif; log vía `verboseLogs`.

## Fase 4: Verificación

- [x] 4.1 Verificar en apply que `DateTimeOriginal` sobrevive al pick-list ifd0 (vive en ExifIFD) — open question RESUELTA: sí, verificado con JPEG real + EXIF APP1 (Date revivido) y motor de Options de exifr.
- [x] 4.2 E2E manual: `pnpm dev`; imagen GPS→OCR intacto, store sin `metadata`, verboseLogs OK; cámara en vivo→exif nulo. (Pasos documentados en apply-progress; sin runner E2E.)
- [x] 4.3 `pnpm test` + `pnpm build` verdes; exifr fuera del bundle inicial (chunk `full.esm-*.js` separado, 0 ocurrencias en index inicial).

## Fase 5: Limpieza

- [x] 5.1 Eliminar `tasks/sdd-tasks.md` (este cambio); `specs/delta-spec.md` lo hace la fase spec (verificar).
- [x] 5.2 Sin `@ts-expect-error mocked` en producción; `stripExifMetadata` nunca invocado.

## Criterios de Aceptación

- PR 1: unit tests verdes; `pnpm build` OK; sin exifreader ni DMS.
- PR 2: test componente verde; E2E sin `metadata` persistida; suite global verde.
- Threat matrix: N/A (parsing cubierto por D5 fallback nulo).