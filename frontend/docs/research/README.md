# Investigación recuperada — SplitEat (`frontend/docs/research/`)

**Consolidado**: 2026-09-13
**Motivo**: tras una sesión que agotó el disco y no pudo dejar copia, esta carpeta reúne **todo el material de investigación disponible** sobre EXIF y el parser heurístico de tickets, desde el repositorio principal del frontend, con procedencia verificable.
**Ubicación**: worktree aislado `spliteat-research-recovery`, rama `docs/research-recovery` (base: `feature/feature-entrega2-ADLC`, la rama de integración).
**Estado**: archivos **sin commitear** (untracked). Es documentación: **no requiere `pnpm install`**.

---

## 1. Mapa de archivos y procedencia

### 1.1 EXIF

| Archivo | Origen | Commit de origen | Integridad |
| --- | --- | --- | --- |
| `exif-metadata-extraction.md` | worktree `spliteat-exif-research`, `docs/research/` | `1af927e` | Contenido íntegro; autofix cosmético de markdown |
| `metadata-container-comparison.md` | worktree `spliteat-exif-research`, `docs/research/` | `93d7d20` *(incluye las correcciones del juicio adversarial)* | Contenido íntegro; autofix cosmético de markdown |

Rama de origen: `research/exif-metadata-extraction` (HEAD del worktree: `93d7d20`).

### 1.2 Parser heurístico de tickets

| Archivo | Origen | Commit de origen | Integridad |
| --- | --- | --- | --- |
| `receipt-parser/PRICE_ANALYSIS.md` | worktree `spliteat-unit-price-exploration`, `exploration/` | `de15778` | Íntegro; autofix cosmético de markdown |
| `receipt-parser/SOLUTION_SUMMARY.md` | ídem | `de15778` | Íntegro; autofix cosmético de markdown |
| `receipt-parser/WORD_LEVEL_PARSING_PLAN.md` | ídem | `adb5322` | Íntegro; autofix cosmético de markdown |
| `receipt-parser/scripts/*.js` (5) | ídem | `de15778` | **Byte a byte idénticos** (sha256 reverificado) |
| `receipt-parser/scripts/run-edge-cases.sh` | nuevo (este consolidado) | — | Runner añadido para ejecutar `edge_cases.js` sin modificar el artefacto |

Rama de origen: `research/unit-price-exploration` (HEAD del worktree: `adb5322`).
Los 5 scripts son la **batería de reproducción**: `test_current_logic.js`, `edge_cases.js` (33 casos), `final_analysis.js`, `proposed_fix.js`, `demo.js`. Ver §5 para el estado real de ejecución de cada uno.

### 1.3 Material recuperado de memoria

| Archivo | Contenido | Origen |
| --- | --- | --- |
| `ENGRAM-RECOVERED.md` | Investigación que **no existe en ningún fichero del repositorio**: alternativas al parser, batería de edge cases omitidos, revisión adversarial, checkpoint de la rama, comparativa de modelos OCR, veredicto de Judgment Day y el juicio A vs C del contenedor de metadatos | Engram, observaciones `#303`, `#306`, `#310`-`#314`, `#369`-`#373` |

---

## 2. Nota de fidelidad (leer antes de citar)

- Las **copias `.md` no son byte a byte idénticas** al origen: al escribirlas, el linter aplicó **normalización cosmética de markdown** (línea en blanco tras cada título, padding de las filas separadoras de tablas, salto de línea final). Se comparó el contenido con espacios normalizados: **la única diferencia de texto es un espacio dentro de una celda de tabla** en `exif-metadata-extraction.md`, que además corrige una celda rota. **Ningún hallazgo, cifra ni cita se alteró.**
- Los **5 scripts `.js` son byte a byte idénticos** al origen (reverificado con `shasum -a 256`). **Aviso**: el formateador de la sesión los reescribió una vez después de copiarlos — solo formato (comillas, comas finales, ajuste de línea), sin cambio semántico — y hubo que **restaurarlos desde el origen**. Si los editas, vuelve a comprobar la tabla de sha256 anterior: cualquier reescritura se detecta ahí.
- Los sha256 de los archivos de **origen** (para verificar contra los worktrees):

  ```text
  5de8ebc3f7f1f67de07be9ae42b7ba2bdd2834753b8d07b4c13d59fddd4948cd  exif-metadata-extraction.md
  eda98dd898233ecc3e7c65a6de44756b447548900aee5b68b6fa7f6fcade9df7  metadata-container-comparison.md
  96e5c7aa63af71b75a28ba945b164418ef71c16d1e9750d1bf36573b7b71bad0  receipt-parser/PRICE_ANALYSIS.md
  1f24d055b4414b4f3ab1a08c6891105e160fff97de3e0facee22d99672742564  receipt-parser/SOLUTION_SUMMARY.md
  9b12e916496470ae50a989af08a455cccdcee487303796267ce008b11e26389c  receipt-parser/WORD_LEVEL_PARSING_PLAN.md
  b29c15c139016cb2979fe52c7ae96daad1b3a845b605c54886fd606f6b07c847  receipt-parser/scripts/demo.js
  5503e5023804a135f21fe1d4c7d741f7016a5e58c09c1fbb764d3191cef3cf56  receipt-parser/scripts/edge_cases.js
  2b4f10e3667e1935b6137c7a621687d8008e906c7794b07fc8d2f652af7a398d  receipt-parser/scripts/final_analysis.js
  95177367aebeef39c2043e0f17fe00c0d0b7670315dc1e4a70b42f40916fbb48  receipt-parser/scripts/proposed_fix.js
  6bbdebe5f0edd45e45af346958ad8c3536f46fc23e1f13c1b271e6348bfa059b  receipt-parser/scripts/test_current_logic.js
  ```

- `ENGRAM-RECOVERED.md` es **reconstrucción desde notas de sesión**, no una reverificación. Sus cifras de terceros (tamaños de modelo, precios de API, benchmarks) heredan la incertidumbre del momento en que se registraron.

---

## 3. Huecos conocidos (lo que no se recuperó)

| Hueco | Detalle |
| --- | --- |
| `openspec/changes/ocr-review-screen/` | **Carpeta vacía** en el repo. El cambio nunca tuvo artefactos en disco. |
| Benchmark OCR bilingüe | **Nunca se ejecutó.** Corpus, baseline `spa+eng`, spike de PaddleOCR y comparativa de pesos/latencia existen solo como plan (`ENGRAM-RECOVERED.md` §2.3). |
| Suite de 64 tests del parser | Vive **solo** en el worktree `spliteat-unit-price-exploration` (`frontend/src/lib/scan/receipt-parser.test.ts`). El repo principal solo tiene los 21 casos de `ocr-pipeline.integration.test.ts`. |
| Documentos de investigación de OCR (motores) | No existen como archivo en ningún worktree: solo en Engram (§2 de `ENGRAM-RECOVERED.md`). |
| Sesión de opencode perdida | Su base de datos no conserva ninguna conversación posterior al 2026-08-24; no hay copia en disco ni respaldo montado. |

---

## 4. Hilos abiertos para continuar

### 4.1 Parser heurístico (el más avanzado)

1. **Plan de parsing a nivel de palabra** — `receipt-parser/WORD_LEVEL_PARSING_PLAN.md`. Estado: *PLANNED, sin implementación*. 9 pasos, cada uno verificable de forma independiente; los pasos 1-4 son puros y sin cambio de comportamiento, el paso 5 es el primer punto de cambio real y está cubierto por la garantía de paridad del paso 4.
2. **Congelar el baseline**: confirmar los 64 tests en el worktree y añadir los 2 tickets reales como fixtures dorados (paso 0 del plan).
3. **Decisión pendiente del plan**: reconciliación multi-sección (¿TOTAL de la sección final o discrepancia como `unreconciled`?), y si el camino word-level sale por defecto o tras feature flag hasta pasar la regresión de corpus térmico.
4. **Contenido sin copia en Git**: el plan de reconciliación con TOTAL y el uso de confianza como bandera de corrupción (no como veto) están descritos solo en el plan y en `ENGRAM-RECOVERED.md`.

### 4.2 EXIF

1. El cambio `exif-metadata-mapping` está **cerrado y archivado** (`frontend/openspec/changes/archive/2026-08-23-exif-metadata-mapping/`), con extracción real vía `exifr` y transporte sin persistencia (RGPD).
2. **`stripExifMetadata` sigue sin implementar** (`ExifStripNotImplementedError`, fuera de todo camino de producción): es el pendiente RGPD antes de cualquier sincronización a la nube.
3. **Decisión A vs C abierta**: `metadata-container-comparison.md` recomienda A (namespaces tipados) con `schemaVersion: 1`, pero advierte que A es una *puerta de dirección preferente*: publicar en producción con A encarece el paso a C. El juicio adversarial (§3.1 de `ENGRAM-RECOVERED.md`) dejó constancia de que el multi-proveedor de mapas **ya está** en `TSK-4.4.md:15`.
4. Consumidor real confirmado del GPS es **US-14 (agregación sobre N tickets)**, no lectura puntual de un ticket.

### 4.3 Motores OCR

1. Ejecutar el benchmark antes de reemplazar cualquier motor.
2. Baseline inmediato: Tesseract `spa+eng` (hoy el proyecto usa solo `spa`).
3. Candidato a prototipo: PaddleOCR.js / PP-OCRv5, conservando `receipt-parser.ts` como capa de validación.
4. Restricciones de diseño ya decididas: lazy loading, fallbacks por confianza, y NER fuera de la primera comparación.

---

## 5. Cómo reproducir las investigaciones

```bash
# Scripts autocontenidos (se ejecutan desde cualquier carpeta)
cd frontend/docs/research/receipt-parser/scripts
node demo.js
node test_current_logic.js
node proposed_fix.js
node final_analysis.js

# edge_cases.js importa el parser real por ruta relativa
# ('../frontend/src/lib/scan/receipt-parser.ts'), así que NO resuelve desde esta
# carpeta. Usa el runner, que lo prepara sin modificar el artefacto:
./run-edge-cases.sh

# Baseline de 64 tests del parser (vive solo en el worktree de investigación)
cd /Users/develop/Workspace/Courses/LidrCo/AI4Devs/spliteat-unit-price-exploration/frontend
pnpm test src/lib/scan/receipt-parser.test.ts
```

### Estado real de ejecución (verificado el 2026-09-13)

| Script | Exit | Observación |
| --- | --- | --- |
| `demo.js` | 0 | 85 líneas de salida |
| `test_current_logic.js` | 0 | 124 líneas de salida |
| `edge_cases.js` | 0 | 33 casos; requiere el runner o ejecutarse desde `spliteat-unit-price-exploration/exploration/` |
| `proposed_fix.js` | 1 | Imprime 186 líneas y luego `ReferenceError: unitScore is not defined` |
| `final_analysis.js` | 1 | `ReferenceError: improved is not defined` (la variable se renombró a `impr` y la comparación quedó sin actualizar) |

> Los dos fallos son **preexistentes**: se reproducen igual en el worktree original `spliteat-unit-price-exploration`. **No** son consecuencia de esta copia y **no se han corregido aquí**: son el registro de la investigación, no código de producción.
>
> `edge_cases.js` necesita Node con *type stripping* (Node ≥ 22.6 con `--experimental-strip-types`, o ≥ 23.6 donde ya está activo por defecto).

Los informes se apoyan en verificación mecánica: `metadata-container-comparison.md` cita geometría y consumidores resueltos con **CodeGraph** (`.codegraph/codegraph.db` del worktree), y `WORD_LEVEL_PARSING_PLAN.md` verifica la forma de `Page`/`Word` de Tesseract contra `node_modules/tesseract.js/src/index.d.ts`.
