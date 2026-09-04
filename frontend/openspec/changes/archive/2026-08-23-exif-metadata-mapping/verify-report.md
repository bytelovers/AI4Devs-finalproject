```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:e3e426fb2524d8cfd2661dea19928006551442789af022b5c5084c706f4b7c23
verdict: pass
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 12/12
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:506b81ec6908fc2d4627e1fdc00c38044833688041b5b4e6544969e6a3ceec85
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:8df51f9405c94c876a2fbf1112b56e244ebcfae2b01e101cecb00ee12e79f0f5
```

## Verification Report

**Change**: exif-metadata-mapping
**Version**: N/A (spec sin versión; change exif-metadata-extraction)
**Mode**: Strict TDD (activo por orquestador; runner: vitest vía `pnpm test`)
**Rama**: release/v0.2.0 (vehículo de revisión; no se tocó la rama estable)

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 14 |
| Tasks complete | 14 (tasks.md, todas `[x]`) |
| Tasks incomplete | 0 |

### Build & Tests Execution (gates re-ejecutados DESDE CERO por verify)

**Tests**: ✅ 344 passed (23 files), 0 failed, 0 skipped
```text
pnpm test  → exit 0
Test Files  23 passed (23)
     Tests  344 passed (344)
test_output_hash: sha256:506b81ec6908fc2d4627e1fdc00c38044833688041b5b4e6544969e6a3ceec85
```
Tests enfocados del change: `pnpm vitest run src/utils/exifHelper.test.ts src/components/camera/CameraCapture.test.tsx` → **10/10 pass** (7 exifHelper + 3 CameraCapture).

**Build**: ✅ exit 0
```text
pnpm build (tsc -b && vite build) → exit 0
build_output_hash: sha256:8df51f9405c94c876a2fbf1112b56e244ebcfae2b01e101cecb00ee12e79f0f5
```
Bundle: exifr en chunk separado `dist/assets/full.esm-BuX-V2CP.js` (76K); **0 ocurrencias** de "exifr" en `index.html` + `index-*.js` iniciales.

**Lint**: ✅ exit 0 (`pnpm lint` = eslint con `--report-unused-disable-directives --max-warnings 0`)
```text
lint_output_hash: sha256:335f292a56b3336c74649aa077156c1ccc1ca2bf0d049327317db4ba30e6ba67
```

**Coverage**: ➖ No disponible — `@vitest/coverage-v8` no instalado en el proyecto (informacional, no bloqueante).

### Spec Compliance Matrix (10 requisitos, 12 escenarios — contados del spec)

| Req | Escenario | Test / Evidencia | Resultado |
|-----|-----------|------------------|-----------|
| REQ-EXIF-01 | Upload con GPS real | `CameraCapture.test.tsx > extrae EXIF del File original antes de comprimir…` + **E2E navegador real**: log `[EXIF] extracción OK: GPS 40.713333, -74.001667 \| Apple iPhone 14` | ✅ COMPLIANT |
| REQ-EXIF-01 | Imagen sin EXIF | `exifHelper.test.ts > devuelve gps null y resto de campos null si falta EXIF` + `devuelve namespace nulo si exifr.parse rechaza` (camino vacío/fallo → mismo contrato nulo) | ✅ COMPLIANT |
| REQ-EXIF-02 | Desanidado de GPS | `exifHelper.test.ts > tolera GPS anidado en raw.gps…` + verificación con **exifr 7.1.3 real**: parse del fixture con las opciones exactas de `extractExifFromFile` devuelve `latitude: 40.713333`/`longitude: -74.001667` a nivel RAÍZ (confirma corrección D8 del apply) | ✅ COMPLIANT |
| REQ-EXIF-03 | Fecha Date o string | `exifHelper.test.ts > acepta DateTimeOriginal como Date (reviveValues)…` + `mapea fixture GPS decimal signado…` (string EXIF → ISO) | ✅ COMPLIANT |
| REQ-EXIF-03 | GPS ausente | `exifHelper.test.ts > devuelve gps null si solo falta lat o lon (sin error)` + caso vacío | ✅ COMPLIANT |
| REQ-EXIF-04 | exifr falla | `exifHelper.test.ts > devuelve namespace nulo si exifr.parse rechaza (fallback, nunca throw)` + `CameraCapture.test.tsx > si exifr falla, onCapture recibe exif nulo y el flujo continúa` | ✅ COMPLIANT |
| REQ-EXIF-05 | Carga diferida | Build: chunk `full.esm-BuX-V2CP.js` separado, 0 ocurrencias en bundle inicial; fuente: `await import('exifr')`; E2E: import resuelto solo durante extracción | ✅ COMPLIANT |
| REQ-EXIF-06 | Pipeline sin persistencia | `CameraCapture.test.tsx` (onCapture `{dataUrl, exif}`) + **E2E real**: log `[EXIF] descartado en persistencia: updateTicket sin exif (RGPD strict)` + store inspeccionado: ticket persistido **sin clave `metadata`**; OCR completó a "Ticket escaneado" (tesseract-ner) sin romperse | ✅ COMPLIANT |
| REQ-EXIF-07 | Captura por live stream | `CameraCapture.test.tsx > captura por live stream entrega onCapture con exif namespace nulo` (3/3 pass) | ✅ COMPLIANT |
| REQ-EXIF-08 | Flag activo | **E2E real** con `verboseLogs=true`: log `[EXIF] extracción OK: GPS …` en consola del navegador; fuente: `NewTicketCaptureView.tsx:80-94` | ✅ COMPLIANT |
| REQ-EXIF-09 | Sin referencias antiguas | grep: 0 ocurrencias de `extractExifFromImageDataUrl` en `src/`; flujo y tests usan `extractExifFromFile` | ✅ COMPLIANT |
| REQ-EXIF-10 | Revisión de producción | grep: 0 `@ts-expect-error mocked`, 0 `exifreader`, 0 invocación a `stripExifMetadata`; JSDoc "NO IMPLEMENTADO" presente (`exifHelper.ts:106-114`); función lanza `Error('…NOT implemented…')` si se invoca | ✅ COMPLIANT |

**Compliance summary**: 12/12 escenarios compliant · 10/10 requisitos

### Correctness (Static Evidence)
| Requisito | Estado | Notas |
|-----------|--------|-------|
| Extracción pre-compress (REQ-EXIF-01) | ✅ Implementado | `CameraCapture.tsx:160` — `extractExifFromFile(file)` ANTES de `compressImage` (línea 161) |
| Contrato raíz lat/lon (REQ-EXIF-02) | ✅ Implementado | `types.ts:79-89` `RawExifResult.latitude/longitude`; `exifHelper.ts:93-100` lee raíz con fallback `raw.gps` |
| Mapeo a ExifNamespace (REQ-EXIF-03) | ✅ Implementado | `exifHelper.ts:50-68`; `toIsoTimestamp` maneja Date\|string; `convertDMSToDecimal` retirado (grep 0) |
| Fallback nulo (REQ-EXIF-04) | ✅ Implementado | `exifHelper.ts:84-104` try/catch → `EMPTY_NAMESPACE` |
| Import dinámico (REQ-EXIF-05) | ✅ Implementado | `exifHelper.ts:86` `await import('exifr')` |
| Transporte sin persistencia (REQ-EXIF-06) | ✅ Implementado | `NewTicketCaptureView.tsx:114` `updateTicket(draftTicketId, { image: imageDataUrl })` — sin exif; `CameraScanFlow.tsx:125` usa solo `img.dataUrl` |
| Cámara en vivo → exif nulo (REQ-EXIF-07) | ✅ Implementado | `CameraCapture.tsx:119-120` `captureFrame` → `setExif(EMPTY_NAMESPACE)` |
| Verbose logs (REQ-EXIF-08) | ✅ Implementado | `NewTicketCaptureView.tsx:80-94` éxito/fallo vía `verboseLogs` |
| Renombrado API (REQ-EXIF-09) | ✅ Implementado | `extractExifFromFile(file: File)`; sin callers antiguos |
| Limpieza (REQ-EXIF-10) | ✅ Implementado | `stripExifMetadata` NO implementado y nunca invocado; sin mocks marcados |

### Coherence (Design)
| Decisión | ¿Seguida? | Notas |
|----------|-----------|-------|
| D1 exifr (no exifreader) | ✅ Sí | `exifr ^7.1.3` en package.json; grep 0 exifreader |
| D2 Extracción pre-compress | ✅ Sí | `CameraCapture.tsx:158-161` orden File→EXIF→compress |
| D3 Transporte sin persistencia | ✅ Sí | `updateTicket` nunca recibe exif; E2E confirma store sin `metadata` |
| D4 Import dinámico | ✅ Sí | Chunk separado en build; import solo en extracción |
| D5 Fallback nulo, nunca throw | ✅ Sí | try/catch → `EMPTY_NAMESPACE`; tests |
| D6 Renombrado API | ✅ Sí | `extractExifFromFile(file)`; 0 refs antiguas |
| D7 Normalización DateTimeOriginal | ✅ Sí | `toIsoTimestamp` Date\|string → ISO |
| D8 Contrato raíz lat/lon | ✅ Sí | `RawExifResult` raíz; `extractExifFromFile` único punto de adaptación; **validado con exifr real** |

Desviaciones documentadas (del apply, verificadas en verify):
1. **`translateValues: false`** añadido al parse (`exifHelper.ts:90`) — necesario para que `Orientation` vuelva entero 1-8 y cumpla `orientation: number | null` (REQ-EXIF-03). Refinamiento, no desviación que rompa spec. ✅ verificado en runtime (Orientation: 1 con exifr real).
2. **`CameraScanFlow.tsx`** (consumidor no listado en File Changes del design) adaptado a `onCapture(CapturedImage)`: usa `img.dataUrl` y descarta exif — coherente con D3. SUGGESTION: el design debía listarlo.
3. Salida merged de exifr expone GPS a nivel **raíz** (no anidado `raw.gps`); el fallback `raw.gps` queda defensivo. **Corrección D8 del apply confirmada con exifr 7.1.3 real** (parse de JPEG con EXIF APP1 → `latitude`/`longitude` raíz).

### Strict TDD — TDD Compliance
| Check | Resultado | Detalles |
|-------|-----------|----------|
| TDD Evidence reported | ✅ | Tabla "TDD Cycle Evidence" presente en apply-progress (Engram #365) |
| All tasks have tests | ✅ | 14/14 con evidencia (estructural/tipos N/A correctamente) |
| RED confirmed (tests exist) | ✅ | `exifHelper.test.ts` (7) y `CameraCapture.test.tsx` (3) existen |
| GREEN confirmed (tests pass) | ✅ | 10/10 en ejecución focused por verify + suite 344/344 |
| Triangulation adequate | ✅ | 7 casos exifHelper (GPS raíz, GPS anidado, fallo, Date, string, vacío, lat-solo), 3 CameraCapture (upload, fallo, live) |
| Safety Net for modified files | ✅ | 338/338 baseline reportado; suites globales verdes en verify |
| Evidencia 4.1 (DateTimeOriginal en pick-list) | ✅ | **Re-verificada independientemente**: exifr real parseó `DateTimeOriginal` con `ifd0.pick` incluyéndolo |
| Evidencia 4.2 (E2E manual) | ✅ | **EJECUTADA por verify** en navegador real (ver sección E2E) |

**TDD Compliance**: 8/8 checks passed

### Strict TDD — Test Layer Distribution
| Capa | Tests | Archivos | Herramientas |
|------|-------|----------|--------------|
| Unit | 7 | 1 (`exifHelper.test.ts`) | vitest + vi.mock('exifr') |
| Integration | 6 | 2 (`CameraCapture.test.tsx` 3, `NewTicketCaptureView.test.tsx` 3) | @testing-library/react |
| E2E | 1 flujo manual | 0 (sin runner) | Navegador real (chrome-devtools) |
| **Total** | **13 + flujo E2E** | **3** | |

### Strict TDD — Changed File Coverage
➖ **Coverage analysis skipped — no coverage tool detected** (`@vitest/coverage-v8` no instalado; no configurado en `vitest.config.ts`). No es fallo.

### Strict TDD — Assertion Quality
- `exifHelper.test.ts`: aserciones de valor reales (GPS `toBeCloseTo`, ISO exacto, device `toEqual`, nulls, `toHaveBeenCalledWith(file, {tiff:true, gps:true})`). Sin tautologías, sin ghost loops. ✅
- `CameraCapture.test.tsx`: aserciones sobre `onCapture` recibido (`dataUrl`, `exif.gps`, `EMPTY_NAMESPACE`) y `parse` llamado con el File. ✅
- `NewTicketCaptureView.test.tsx`: tests 2 y 3 envuelven sus aserciones en `if (uploadInput)` / `if (adjusterElement)` — el input con `data-testid="file-upload-input"` ya no existe en `CameraCapture` actual, por lo que esas ramas NO se ejecutan y los tests pasan vacuamente. **Archivo NO modificado por este change** (último touch: 4dc45f6/733e163, previos); deuda de calidad PRE-EXISTENTE, fuera del alcance del change, pero la afirmación del apply "✅ store sin exif (vía suite de la vista)" no está respaldada por ese archivo: la evidencia real de no-persistencia la aporta el **E2E ejecutado por verify**.

**Assertion quality**: 0 CRITICAL, 0 WARNING en los tests del change (2 tests vacuos pre-existentes en archivo no tocado, reportados como SUGGESTION)

### Strict TDD — Quality Metrics
**Linter**: ✅ 0 errores / 0 warnings (`pnpm lint` exit 0, hash `335f292a…`)
**Type Checker**: ✅ 0 errores (`tsc -b` dentro de `pnpm build`, exit 0)
**Bundle (REQ-EXIF-05)**: ✅ chunk exifr separado (76K `full.esm-BuX-V2CP.js`), 0 ocurrencias "exifr" en bundle inicial

### E2E Manual (spec 4.2) — EJECUTADO por verify
Sin runner E2E en el proyecto (sin Playwright/Cypress), el apply documentó pasos manuales. Verify los **ejecutó en navegador real** (dev server + chrome-devtools) con un **JPEG generado con EXIF APP1 real** (GPS 40.713333,-74.001667 / fecha / Apple iPhone 14 / Orientation 1), verificado previamente con exifr 7.1.3 en Node:

1. Upload del fixture → vista previa OK; consola: `[EXIF] extracción OK: GPS 40.713333, -74.001667 | Apple iPhone 14 | 2026-07-26T16:22:30.000Z` (verboseLogs activado en la UI de Ajustes)
2. Confirmar ajuste → consola: `[EXIF] descartado en persistencia: updateTicket sin exif (RGPD strict)`
3. OCR pipeline completó → fase "Ticket escaneado" (engine tesseract-ner, modelo disponible); el exif no rompió el OCR
4. Store (`localStorage spliteat-app-v1`) inspeccionado: ticket persistido con claves `[id,title,date,image,items,…,scan]` — **sin clave `metadata`** (hasMetadata: false en ambos tickets)
5. Cámara en vivo → exif nulo: NO ejecutable (sin dispositivo de cámara en el sandbox; `getUserMedia` falla y el componente hace fallback a modo nativo, comportamiento diseñado). Cubierto por test de integración REQ-EXIF-07 (3/3 pass).

Nota de entorno: el `<link>` a Google Fonts bloquea el bootstrap de módulos sin red externa; se eliminó para proseguir. Limitación del sandbox, no del código.

### Issues Found
**CRITICAL**: None
**WARNING**: None
**SUGGESTION**:
1. `NewTicketCaptureView.test.tsx` tests 2-3 con aserciones en `if`-gates que nunca se ejecutan (input `file-upload-input` inexistente; adjuster no montado). Archivo NO tocado por este change — deuda pre-existente; si se toca en el futuro, reescribir sin condicionales.
2. `design.md` File Changes omitió `CameraScanFlow.tsx` (consumidor adaptado en apply). Actualizar design si se archiva.
3. Fixture E2E usado (solid-color JPEG) produce OCR vacío esperado; un fixture con texto real daría cobertura E2E más rica del pipeline completo (fuera de alcance del change).

### Verdict
**PASS**
12/12 escenarios compliant, 14/14 tareas, gates verdes desde cero (test 344/344, build exit 0, lint exit 0), exifr fuera del bundle inicial, contrato raíz D8 validado con la librería real, y E2E manual ejecutado con evidencia runtime de no-persistencia.