# Archive Report: exif-metadata-mapping

- **Fecha de archive**: 2026-08-23
- **Modo**: hybrid (OpenSpec filesystem + Engram)
- **Actor**: sub-agente `sdd-archive` (orquestador pausa tras el resumen)

## Resumen del cambio

El change `exif-metadata-mapping` implementó la **extracción real de metadatos EXIF** (GPS, fecha, dispositivo, orientación) en el flujo de captura de tickets de SplitEat:

- **exifr** (import dinámico, ~5 kB ESM en chunk separado) reemplaza al mock muerto de `exifreader` en `src/utils/exifHelper.ts`.
- Extracción **pre-compress** desde el `File` original en `CameraCapture.handleFileChange`, antes de `compressImage` (el canvas descarta EXIF).
- **Contrato raíz lat/lon (D8)**: `RawExifResult.latitude/longitude` a nivel raíz (decimal signado); `extractExifFromFile` es el único punto de adaptación que desanida la salida de exifr.
- **Transporte sin persistencia** (RGPD strict, TSK-4.3): el EXIF viaja como `{ dataUrl, exif }` (`CapturedImage`) por `onCapture` → `NewTicketCaptureView` y **se descarta en el límite de persistencia**: `updateTicket` nunca recibe `exif`; `Ticket.metadata` no se escribe.
- `stripExifMetadata` documentado como **NO implementado** y fuera de todo path de producción; sin `@ts-expect-error mocked` ni `exifreader` en código productivo.

**Rama**: `release/v0.2.0` (vehículo de revisión; la rama estable `feature/feature-entrega2-ADLC` no se tocó).

**Commits** (4, en orden):
| Hash | Mensaje |
|------|---------|
| `7091588` | docs(sdd): add exif-metadata-mapping artifacts and remove superseded spec/tasks |
| `767d332` | feat(exif): add exifr dependency for EXIF extraction |
| `215e092` | feat(exif): extract EXIF from original File via exifr (root lat/lon contract) |
| `4b4ae7b` | feat(exif): wire EXIF transport through capture flow without persistence |

**Código afectado**: `src/utils/exifHelper.ts`, `src/lib/types.ts` (`RawExifResult` raíz, `CapturedImage`), `src/components/camera/CameraCapture.tsx`, `src/views/NewTicketCaptureView.tsx`, `src/components/camera/CameraScanFlow.tsx` (adaptado), `package.json` (+`exifr ^7.1.3`).

## Estado final de artefactos

| Artefacto | Estado final |
|-----------|--------------|
| `proposal.md` | ✅ Completo (reescrito en fase spec; define alcance, decisiones A/C, rollback). Sin observation en Engram (solo filesystem). |
| `specs/exif-metadata-extraction/spec.md` | ✅ Delta spec completa — 10 requisitos, 12 escenarios (REQ-EXIF-01..10). Engram #364. |
| `design.md` | ✅ 8 decisiones (D1–D8). Engram #362. Observación: File Changes omitió `CameraScanFlow.tsx` (SUGGESTION verify; NO se modificó el design — archivo de auditoría). |
| `tasks.md` | ✅ 14/14 tareas completas, 0 sin marcar. Engram #363. Apply-progress: Engram #365. |
| `verify-report.md` | ✅ **PASS** — 10/10 requisitos, 12/12 escenarios, 344/344 tests (23 files), build exit 0, lint exit 0, 0 CRITICAL, 0 WARNING. Engram #366. |

**Gates finales (verify, re-ejecutados desde cero)**: `pnpm test` 344/344 · `pnpm build` (tsc -b && vite build) exit 0 · `pnpm lint` exit 0 (max-warnings 0). exifr en chunk separado `full.esm-*.js` (76K), 0 ocurrencias en el bundle inicial (REQ-EXIF-05).

## Sincronización de specs

- **Estado previo**: no existía `openspec/specs/` en `frontend/` (capability nueva, conforme al proposal: "Modified Capabilities: None").
- **Acción**: la delta spec de `exif-metadata-extraction` ES una spec completa (no un delta sobre spec previa) → se creó `openspec/specs/exif-metadata-extraction/spec.md` como **copia mecánica** (cp → diff -r → mv, sin pasar por Read/Write del modelo).
- **Resultado**: 10 requirements añadidos, 0 modificados, 0 eliminados. `diff -r` entre delta y spec principal: **vacío** (byte-idéntico).
- `openspec/config.yaml` no define `rules.archive` → sin reglas adicionales de archive.

## Trazabilidad

- **Observation IDs Engram leídos**: #362 (design), #363 (tasks), #364 (spec), #365 (apply-progress), #366 (verify PASS), #361 (decisión exifr). Proposal: sin observation Engram localizado (existe solo en `proposal.md` del filesystem).
- **Paths OpenSpec leídos**: `openspec/changes/exif-metadata-mapping/{proposal,design,tasks,verify-report}.md` y `specs/exif-metadata-extraction/spec.md`.
- **Verificación mecánica (Mechanical Copy Contract)**: `diff -r` snapshot vs folder archivado → **vacío**; `diff -r` delta archivado vs `openspec/specs/exif-metadata-extraction/spec.md` → **vacío**.

## Lecciones y observaciones

1. **Deuda pre-existente (no introducida por este change)**: `NewTicketCaptureView.test.tsx` tests 2–3 envuelven sus aserciones en `if (uploadInput)` / `if (adjusterElement)` — el input `data-testid="file-upload-input"` ya no existe en `CameraCapture` actual, por lo que esas ramas no se ejecutan y pasan **vacuamente**. Archivo NO tocado por el change (último touch previo, commits 4dc45f6/733e163). La afirmación del apply "store sin exif vía suite de la vista" no está respaldada por ese archivo; la evidencia real de no-persistencia la aporta el E2E ejecutado por verify. Si se toca en el futuro, reescribir sin condicionales.
2. **E2E de cámara en vivo en dispositivo físico pendiente**: `getUserMedia` no es ejecutable en el sandbox (sin dispositivo de cámara; el componente hace fallback a modo nativo, comportamiento diseñado). La cámara en vivo → exif nulo (REQ-EXIF-07) está cubierta por test de integración (3/3 pass); queda pendiente la validación manual en dispositivo físico con cámara real.
3. **Coverage tool ausente (informacional)**: `@vitest/coverage-v8` no está instalado ni configurado en `vitest.config.ts`; el análisis de cobertura y de changed-file coverage se omitió en verify. No bloqueante, pero impide medir cobertura de `CameraCapture` y del wiring nuevo.
4. **Design omitió un consumidor**: `CameraScanFlow.tsx` (adaptado en apply a `onCapture(CapturedImage)`, usa `img.dataUrl` y descarta exif — coherente con D3) no estaba listado en File Changes del design. Registrado aquí; el design archivado no se modifica (audit trail).
5. **Desviaciones refinadas en apply y confirmadas por verify**: `translateValues: false` añadido al parse (Orientation entero 1–8, cumple REQ-EXIF-03); la salida merged de exifr 7.1.3 expone GPS a nivel **raíz** (el fallback `raw.gps` queda defensivo) — corrección D8 confirmada con la librería real.

## Fuente de verdad actualizada

`openspec/specs/exif-metadata-extraction/spec.md` refleja ahora el comportamiento implementado y verificado (10 requisitos de la capability `exif-metadata-extraction`).

## Ciclo SDD

El change queda **cerrado**: planificado → especificado → diseñado → implementado (14/14 tareas) → verificado (PASS) → archivado.