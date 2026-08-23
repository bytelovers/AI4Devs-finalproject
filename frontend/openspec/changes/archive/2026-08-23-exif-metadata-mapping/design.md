# Design: Extracción y Mapeo de Metadatos EXIF

## Technical Approach

Se sustituye la utilidad muerta `exifHelper.ts` (mock de `exifreader`) por extracción real con **exifr** mediante **import dinámico** (fuera del bundle inicial). El EXIF se extrae del **File original** en `CameraCapture.handleFileChange` **antes** de `compressImage` (que re-dibuja en canvas y descarta EXIF). Viaja como `{ dataUrl, exif }` por `onCapture` → `NewTicketCaptureView` y **se descarta en el límite de persistencia**: `updateTicket` nunca recibe `exif` (RGPD strict, TSK-4.3; sin consentimiento porque no hay dato persistido). `mapRawExifToNamespace` se adapta a la salida decimal signada de exifr; `convertDMSToDecimal` se retira. `stripExifMetadata` queda documentado como NO implementado y fuera de cualquier path de producción.

## Architecture Decisions

| # | Decisión | Alternativas | Rationale |
|---|---|---|---|
| D1 | **exifr** (única lib) | exifreader (~40-60 kB, GPS en DMS arrays) | ~5 kB ESM, API `parse(file, opts)`; GPS decimal signado ya convertido vía `ConvertDMSToDD` (verificado en `tiff-exif.mjs`) |
| D2 | **Extracción pre-compress** del File | Post-compress (dataUrl) | `compressImage` usa `canvas.toDataURL` → navegadores descartan EXIF; el File original es la única fuente fiable |
| D3 | **Transporte sin persistencia** `{dataUrl, exif}` | Persistir en `Ticket.metadata` (spec vieja) | Sin consentimiento ni dato persistido (RGPD strict); valida el pipeline para US-14 sin migrar datos |
| D4 | **Import dinámico** de exifr | Import estático | No inflar el bundle inicial; exifr solo se carga en el flujo de captura |
| D5 | **Fallback nulo**: error → `ExifNamespace` nulo, nunca throw | Propagar error | El flujo de captura no debe romperse por EXIF ausente/corrupto (`silentErrors` default de exifr) |
| D6 | **Renombrar** `extractExifFromImageDataUrl` → `extractExifFromFile(file: File)` | Mantener firma dataUrl | La entrada real es el File (pre-compress); no hay otros callers (grep verificado) |
| D7 | `mapRawExifToNamespace` normaliza `DateTimeOriginal` (Date\|string) → ISO | Solo string (`parseExifDate` viejo) | exifr `reviveValues: true` (default) revive fechas a `Date`; el mapeo tolera ambos |
| D8 | **Contrato de interfaz con lat/lon a nivel raíz** (`RawExifResult.latitude/longitude`) | GPS anidado `{gps: {lat,lon}}` (salida cruda de exifr) | El contrato público es plano y consumible sin conocer el formato interno de exifr; `extractExifFromFile` es el **único punto de adaptación** que desanida `raw.gps` al contrato raíz. `mapRawExifToNamespace` y cualquier consumidor no dependen del formato de la librería |

## Data Flow

```
File (upload / cámara nativa)
  │
  ├─→ extractExifFromFile(file) ── exifr.parse(file, {tiff:true, gps:true, ifd0:[...]})
  │        │  import dinámico · fallback → ExifNamespace nulo (D5)
  │        │  DESANIDA raw.gps (anidado exifr) → contrato raíz { latitude, longitude }
  │        ▼
  │   mapRawExifToNamespace(contrato raíz) → { gps: {lat,lon} decimal signado, timestamp ISO, device, orientation }
  │
  └─→ compressImage(file) → dataUrl
            │
            ▼
   onCapture({ dataUrl, exif }) → handlePhotoCaptured → (adjust) → handleConfirmAdjust
                                                                    │
                                                                    ├─ verboseLogs: éxito/fallo extracción
                                                                    └─ updateTicket(...) ✗ exif NO se escribe
```

Cámara en vivo (`captureFrame`): no hay File → `exif` = namespace nulo (esperado; el live stream no expone EXIF GPS).

## File Changes

| File | Acción | Descripción |
|---|---|---|
| `src/utils/exifHelper.ts` | Modify | `exifreader`→`exifr`; `extractExifFromFile`; `mapRawExifToNamespace` adaptado; retirar `convertDMSToDecimal`, `parseExifDate`, `dataUrlToBlob`; JSDoc `stripExifMetadata` = NO implementado |
| `src/utils/exifHelper.test.ts` | Modify | Mock de exifr; fixture GPS real decimal signado |
| `src/lib/types.ts` | Modify | `RawExifResult` redefinido a salida exifr; nuevo tipo `CapturedImage` |
| `src/components/camera/CameraCapture.tsx` | Modify | Extracción en `handleFileChange` antes de `compressImage`; `onCapture({dataUrl, exif})`; exif en estado junto a preview |
| `src/views/NewTicketCaptureView.tsx` | Modify | `handlePhotoCaptured` acepta `CapturedImage`; transportar exif sin persistirlo; log vía `verboseLogs` |
| `package.json` | Modify | +`exifr` |

## Interfaces / Contracts

```ts
// src/lib/types.ts
export interface RawExifResult {
  /** CONTRATO DE INTERFAZ: lat/lon a nivel raíz (decimal signado, ConvertDMSToDD). */
  latitude?: number;
  longitude?: number;
  DateTimeOriginal?: string | Date;  // reviveValues: true → Date
  Make?: string;
  Model?: string;
  Orientation?: number;
}
/** Imagen capturada: dataUrl comprimido + EXIF extraído del File original. */
export interface CapturedImage { dataUrl: string; exif: ExifNamespace }

// src/utils/exifHelper.ts
export async function extractExifFromFile(file: File): Promise<ExifNamespace>
//   const { default: exifr } = await import('exifr')
//   const raw = await exifr.parse(file, { tiff: true, gps: true, ifd0: ['Make','Model','DateTimeOriginal','Orientation'] })
//   // ÚNICO punto de adaptación: exifr devuelve GPS anidado (raw.gps) → desanidar al contrato raíz
//   return mapRawExifToNamespace({
//     latitude: raw.gps?.latitude,
//     longitude: raw.gps?.longitude,
//     DateTimeOriginal: raw.DateTimeOriginal,
//     Make: raw.Make,
//     Model: raw.Model,
//     Orientation: raw.Orientation,
//   })
export function mapRawExifToNamespace(exif: RawExifResult): ExifNamespace
//   gps: exif.latitude != null && exif.longitude != null
//          ? { latitude: exif.latitude, longitude: exif.longitude }
//          : null

// src/components/camera/CameraCapture.tsx
interface CameraCaptureProps {
  onCapture: (img: CapturedImage) => void
  onCancel: () => void
}
```

Nota: `DateTimeOriginal` vive en el sub-bloque ExifIFD (default `exif: true` al activar `tiff: true`); el pick-list `ifd0` filtra Make/Model/Orientation — verificar en apply que la salida incluye `DateTimeOriginal`.

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Unit | `mapRawExifToNamespace` con salida exifr (GPS decimal, fecha Date y string) | Fixture GPS real (40.713333, -74.001667) + caso vacío → nulls |
| Unit | `extractExifFromFile` éxito/fallo | `vi.mock('exifr', () => ({ default: { parse: vi.fn() } }))`; error → namespace nulo |
| Component | Wiring en `CameraCapture`: `parse` llamado con el File; `onCapture({dataUrl, exif})` | `fireEvent.change` en input file; stub `canvas.getContext` (jsdom no implementa toDataURL) |
| E2E | Pipeline: EXIF fluye sin romper OCR; `updateTicket` sin exif | Manual + inspección del store (localStorage) |

## Threat Matrix

N/A — sin routing, shell, subprocesos, automatización VCS/PR, clasificación de ejecutables ni integración de procesos. Único límite: parsing de archivos de imagen en el navegador (cubierto por D5: fallback nulo).

## Migration / Rollout

No se requiere migración: no se persiste EXIF (cero datos nuevos en localStorage). Rollback limpio: revertir `CameraCapture`, `NewTicketCaptureView`, `exifHelper`, `package.json` (ver proposal).

## Open Questions

- [ ] Confirmar en apply que el pick-list `ifd0` no excluye `DateTimeOriginal` (sub-bloque ExifIFD default `true`).
- [ ] Decidir si la ruta cámara en vivo (exif nulo) debe loguearse distinto en `verboseLogs` (no bloqueante).