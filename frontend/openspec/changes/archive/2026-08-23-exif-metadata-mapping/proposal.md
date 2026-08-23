# Proposal: Extracción y Mapeo de Metadatos EXIF

## Intent

- EXIF es hoy una utilidad muerta: `src/utils/exifHelper.ts` mockea `exifreader` y no está integrada ni persistida.
- US-14 (mapa) necesita GPS agregado, pero su UI no está en esta entrega.
- Decisión A vs C resuelta → **A** (namespaces tipados, `schemaVersion: 1`, puerta a C).

## Scope

### In Scope (decisiones de usuario vinculantes)
- Migrar helper de `exifreader` a **`exifr`** (~5 kB, ESM) y sus tests.
- Validar tipos EXIF ya presentes en `types.ts` (`RawExifResult`, `ExifNamespace`, `TicketMetadata`, `Ticket.metadata?`).
- Integrar extracción del **File original** en `CameraCapture.handleFileChange`, ANTES de `compressImage`.
- Propagar EXIF por el flujo (`NewTicketCaptureView`) y validar end-to-end.
- **Descartar EXIF en el límite de persistencia**: no escribir en `updateTicket`/`Ticket.metadata`. Sin consentimiento (no hay dato persistido; RGPD strict, TSK-4.3).

### Out of Scope
- TicketGpsDisplay (UI), pantalla de consentimiento, mapa US-14.
- Persistencia de EXIF en `Ticket.metadata`.
- `stripExifMetadata` real (solo firma/mock existente).

## Delta vs artefactos existentes y resolución de fricción

Los artefactos previos del change (`specs/delta-spec.md`, `tasks/sdd-tasks.md`) reflejan el diseño **anterior** (exifreader + persistencia en `Ticket.metadata` + 3 PRs de 450–550 líneas). Mantenerlos con ediciones incrementales arrastraría el drift y el dispatcher nativo no los reconoce como spec/tasks válidos. **Se reescriben completos** en sus fases:

- **(a)** `exifreader@^1.6` → `exifr`: misma tarea (parsear EXIF) con salida GPS **decimal signada** (`{latitude, longitude}`, verificado en fuente de exifr `tiff-exif.mjs`); adaptar `extractExifFromImageDataUrl` (parse de File/Blob, opciones `tiff/gps/ifd0`) y mocks de tests. exifreader queda descartado (mismo propósito, 8-12x más peso, GPS en DMS arrays).
- **(b)** La spec asume persistencia en `Ticket.metadata` (FR-3, §6, §9) → esta entrega **no persiste**: la spec se reescribe sin el requisito de persistencia.
- **(c)** Punto de integración: `CameraCapture` antes de `compressImage` (la spec decía `CameraScanFlow.handleCapture`).
- **(d)** Estructura: `specs/delta-spec.md` → `specs/exif-metadata-extraction/spec.md` (capability del proposal) y `tasks/sdd-tasks.md` → `tasks.md` en la raíz del change (esquema OpenSpec estándar que el dispatcher reconoce). Los ficheros viejos se eliminan al reescribir.

## Capabilities

### New Capabilities
- `exif-metadata-extraction`: extracción EXIF local (exifr), mapeo a `ExifNamespace`, integración pre-compress, descarte en persistencia.

### Modified Capabilities
- None (no hay `openspec/specs/` previo).

## Approach

1. **Fase spec**: reescribir `delta-spec.md` → `specs/exif-metadata-extraction/spec.md` con las decisiones vinculantes (exifr, sin persistencia, integración pre-compress); eliminar el fichero viejo.
2. **Fase tasks**: reescribir `tasks/sdd-tasks.md` → `tasks.md` (raíz del change) contra la spec nueva y el proposal; eliminar el fichero viejo.
3. `pnpm add exifr`; reemplazar mock de exifreader por `exifr.parse(file, { tiff: true, gps: true, ifd0: ['Make','Model','DateTimeOriginal','Orientation'] })` con **import dinámico** solo en el flujo de captura.
4. Adaptar `mapRawExifToNamespace` a la salida decimal signada de exifr (GPS `{latitude, longitude}` ya convertido): **retirar `convertDMSToDecimal`** (exifr lo hace internamente vía `ConvertDMSToDD`, verificado en `tiff-exif.mjs`); documentar `stripExifMetadata` como NO implementado y fuera de producción.
5. En `handleFileChange`: extraer EXIF del `File` antes de `compressImage`; pasar `{ dataUrl, exif }` por `onCapture`.
6. En `handlePhotoCaptured`/`handleConfirmAdjust`: transportar `exif` sin persistirlo; log de éxito/fallo vía `verboseLogs`.
7. Prueba E2E manual + tests Vitest con mock de exifr (fixture existente adaptado + fixture con GPS real).

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `src/components/camera/CameraCapture.tsx` | Modified | Extraer EXIF del File antes de `compressImage` |
| `src/views/NewTicketCaptureView.tsx` | Modified | Transportar exif sin persistir |
| `src/utils/exifHelper.ts` | Modified | `exifreader` → `exifr` |
| `src/lib/types.ts` | Modified (ya aplicado) | Tipos EXIF validados |
| `package.json` | Modified | +`exifr` |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Migración A→C si se publica A y luego se quiere C | Med | **Neutralizado por la decisión de no-persistencia**: esta entrega no escribe `metadata` en ningún ticket, por lo que no hay datos de clientes que migrar (advertencia judgment-day round 1). Si en el futuro se persiste A, exigir `schemaVersion: 1` y decidir C **antes** de cualquier release con `metadata`. |
| Forma de GPS distinta entre exifreader (DMS arrays + refs) y exifr (decimal signado `{lat,lon}`) | Eliminado por decisión | **Decidido**: exifr es la única librería; su salida GPS ya es decimal signada (verificado en fuente `tiff-exif.mjs`). `mapRawExifToNamespace` solo mapea; `convertDMSToDecimal` se retira siempre. Cubierto con tests sobre fixture real. |
| `stripExifMetadata` es un stub RGPD **no real** (devuelve Blob vacío) | Alta si se usa por error | Se documenta como NO implementado (JSDoc explícito) y queda **fuera de todo path de producción**: nunca se invoca en el flujo de captura de esta entrega. |
| `CameraCapture` sin cobertura de tests (heredado) | Med | Tests enfocados en el wiring nuevo de extracción con mock de exifr; no se exige cobertura total del componente (fuera de alcance). |
| Coste de exifr (bundle/runtime) | Baja | **Import dinámico** de exifr solo en el flujo de captura (no en el bundle inicial); medir en verify. |
| EXIF producido y descartado en límite de persistencia | Alta (esperado) | Aceptado como validación de pipeline; además se registra éxito/fallo de extracción vía `verboseLogs` para no operar a ciegas. |
| WIP heredado mixto (commit `3f04d90`: exif+pwa+scan+radix) | Baja | Rollback limpio: sin datos persistidos, revertir solo los ficheros tocados (`CameraCapture`, `NewTicketCaptureView`, `exifHelper`, `package.json`). |

## Elementos heredados y su tratamiento

| Elemento heredado | Estado | Tratamiento |
|---|---|---|
| `exifHelper.ts` con mock de `exifreader` (`@ts-expect-error mocked`) | Código muerto | Se reescribe a `exifr`; los `@ts-expect-error` desaparecen del código productivo. |
| `RawExifResult` (forma exifreader: DMS arrays + refs) | Desalineado con exifr | Se redefine a la salida de exifr (GPS decimal signado); `convertDMSToDecimal` se retira (exifr ya convierte DMS→decimal vía `ConvertDMSToDD`). |
| `stripExifMetadata` / `stripBlobFromExifMetadata` (stub RGPD) | Simulación, no implementación | Documentado como NO implementado; fuera del path de producción. |
| `specs/delta-spec.md` + `tasks/sdd-tasks.md` | Drift con decisiones actuales | Reescritura completa (puntos a–d de la sección Delta). |
| `mockImageWithoutExif.dataUrl` (fixture) | Reutilizable | Se adapta al mock de `exifr` (y se añade fixture con GPS real). |
| Tipos EXIF en `types.ts` (`RawExifResult`, `ExifNamespace`, `TicketMetadata`, `Ticket.metadata?`) | Válidos, ya commiteados | Se validan; `Ticket.metadata?` se conserva con `schemaVersion: 1` aunque esta entrega no lo use. |

## Rollback Plan

- Revertir commits de `CameraCapture`/`NewTicketCaptureView` y `package.json`; `exifHelper.ts` queda como utilidad no integrada (estado actual). Sin cambios de datos persistidos → rollback limpio, sin migración.

## Dependencies

- `exifr` (npm). Sin backend. Sin cambios en Zustand/store.

## Success Criteria

- [ ] `specs/exif-metadata-extraction/spec.md` reescrita y `delta-spec.md` eliminado.
- [ ] `tasks.md` en la raíz del change reescrito y `tasks/sdd-tasks.md` eliminado.
- [ ] El dispatcher nativo (`gentle-ai sdd-status exif-metadata-mapping --cwd frontend --json`) reporta `specs: complete` y `tasks: present` (sin `partial`/`missing`).
- [ ] Extracción EXIF real con `exifr` desde el File en upload, antes de `compressImage`, con import dinámico (sin exifr en el bundle inicial).
- [ ] `mapRawExifToNamespace` adaptado a exifr (GPS decimal signado) y `convertDMSToDecimal` retirado; sin `@ts-expect-error mocked` en código productivo.
- [ ] `stripExifMetadata` documentado como NO implementado y nunca invocado en el flujo de captura.
- [ ] Pipeline end-to-end: EXIF fluye sin romper OCR y NO se persiste en el ticket.
- [ ] `pnpm test` verde (mocks de exifr) y `pnpm build` sin errores.

**Trazabilidad**: US-14 · PRD F-03 (línea 52) · TSK-4.3 (RGPD strict).