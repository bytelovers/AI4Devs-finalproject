# Investigación recuperada de Engram (sin copia en disco)

**Consolidado**: 2026-09-13
**Origen**: memoria persistente del proyecto `ai4devs-finalproject` (Engram)
**Estado**: material **sin ninguna copia en el repositorio** hasta este documento. Se recupera aquí porque la sesión que lo produjo no dejó artefactos en disco.

> **Aviso de naturaleza del material.** Lo que sigue son **notas de sesión registradas**, no mediciones reverificadas hoy. Las cifras de terceros (tamaños de modelo, precios de APIs, benchmarks) provienen de las fuentes que se consultaron en su momento y **no se han vuelto a verificar** en esta consolidación. Donde el registro original estaba en inglés se conserva **verbatim** y se añade la lectura en español, para no alterar la fuente.

---

## 1. Parser heurístico

### 1.1 Investigación de alternativas al parser actual

**Origen**: Engram obs `#313` (`discovery`, 2026-08-03) · sesión `ses_05b41ff26ffegKFn6JtKiLPltH`

**Contexto registrado**: revisión solo-investigación de enfoques alternativos al parser Tesseract + heurístico (`frontend/src/lib/scan/receipt-parser.ts`, 5 fases, 64 tests). Familias cubiertas: extracción LLM/VLM, document AI gestionado, OCR+layout OSS, gramática/plantillas/restricciones, mejoras híbridas.

**Dolores que motivaron la investigación** (verbatim): *"OCR noise drops lines, some products have no readable price, unit-vs-total disambiguation is heuristic, must not invent data."*

**Hallazgos registrados** (verbatim, con la lectura entre corchetes):

1. Benchmarks 2026 (OmniDocBench V1.5): GLM-OCR 94.62, PaddleOCR-VL 94.50, Gemini 3.1 Pro ~90.3. *[Los modelos documentales especializados superan a los LLM frontera.]* VLM OCR auto-hospedado ~167× más barato por página que una API comercial.
2. Test de 100 tickets en CPU (Iunera): Tesseract 2-3 s; +Qwen 0.8-3B 4-18 s. *"JSON reliability is the #1 problem (malformed JSON, hallucinated totals)"* — la capa de validación determinista (`sum(items) - discounts ≈ total`) es esencial; los modelos pequeños son más predecibles con validación.
3. Precios de APIs gestionadas: Textract AnalyzeExpense $0.01/página (100 gratis/mes); Google Document AI Expense parser $0.10/recibo; Azure DI prebuilt receipt ~$10/1k páginas S0 (F0 gratis); Mindee ~$0.007-0.05/página, trial 14 días, modelo Receipt+Financial Document con `line_items(qty, unit_price, total_price)`; Veryfi $0.08/doc, 100 gratis/mes, modelos deterministas, GDPR.
4. Surya 2: VLM de 650M para OCR+layout+tables, 90+ idiomas, corre en llama.cpp/Metal ~0.1 página/s.
5. Reconciliación por restricciones (`qty × unit = lineTotal`, `Σ + TOTAL`): **no** requiere CP-SAT — OR-Tools no tiene binding JS; backtracking/DP en TypeScript basta para 10-40 items. Sirve para **validar/seleccionar** la interpretación, pero **no recupera items sin precio**: solo acota el valor faltante (estimación → requiere confirmación del usuario).
6. Roadmap recomendado:
   1. TSV con confidencias + bboxes de Tesseract, lista de "unpriced candidates", alineación de columnas por `x` para distinguir unit vs total, reconciliación two-pass en TS puro.
   2. Plantillas por comercio + catálogo/menú con fuzzy match como sugerencia + API gestionada (Textract/Google/Veryfi/Mindee) como oráculo sobre corpus etiquetado.
   3. LLM/VLM (Gemini Flash API o Florence-2/GLM-OCR local) como segunda opinión, **siempre** gateada por validación determinista.

**Evitar explícitamente** (verbatim): *"gramática ANTLR completa, layout pesado en-browser, confiar en salida LLM sin validator."*

**Privacidad**: los tickets contienen datos personales (GDPR); local es el modo por defecto, cloud exige DPA + consentimiento.

### 1.2 Batería de edge cases omitidos por el análisis inicial

**Origen**: Engram obs `#310` (`discovery`, 2026-08-01) · worktree `spliteat-unit-price-exploration`

Batería ejecutada contra el parser real. Casos que el análisis inicial (`PRICE_ANALYSIS.md`, que solo cubría 1-precio y 2-precios) **no contemplaba** y varios producían resultados incorrectos:

| Entrada | Comportamiento registrado | Esperado |
| --- | --- | --- |
| `Cerveza 2,00 5,00` | 3×Cerveza@2 (round(5/2)=3) | 2×@2,50 |
| `Cerveza 2,5` | `parseSpanishAmount` convierte 2,5 → **25** (solo trataba 2 decimales) | 2,5 |
| `Cerveza 5` | No produce items (la regex de precios exigía decimales) | 1×@5 |
| `TV 1.200,00` | Descartado entero (`validPrices` filtra `val > 500`) | 1×@1200 |
| `Cerveza DTO -1,00 5,00` | El `discountRegex` casa `DTO` en cualquier posición y se traga el item | Descuento + item |
| `0,350 kg Manzanas 2,49` | 7×kg Manzanas@0,35 (catástrofe) | 0,35 kg → 0,35×@2,49 |
| `2 Cerveza 2,50` | 2×Cerveza@1,25 (trata 2,50 como total y divide) | 2×@2,50 |
| `2×Cerveza 5,00` (U+00D7) | No detecta cantidad y contamina el nombre con `×` | 2×@2,50 |

Otros patrones registrados: cantidad en medio de línea, multiplicador unicode `×`/`*`, sufijos `UDS`/`unidades`, patrón `[cantidad, unitPrice]` sin total, precios sin decimales, OCR `O`/`l` (`5.OO`, `1,2O`), items por peso, precio `€/kg`, ofertas `3x2`, descuento en línea `DTO`.

### 1.3 Revisión adversarial: items perdidos y correcciones aplicadas

**Origen**: Engram obs `#312` (2026-08-03) y `#311` (2026-08-01/03), ambos `bugfix`

- De 41 líneas OCR de un ticket real, **6 representaban productos y no se emitían**: 2 corregibles, 4 deliberadamente indeterminables.
- **Corregido — normalización de separadores OCR**: la regex de precios rechazaba `:` y `/`, así que `1 ZUMO TOMATE 5:00` y `1 ROLL SALMON FLANBEE 16/00 18/00` caían. Se normalizan a `,` con guardas: primero se protege un reloj completo (`\d{1,2}:\d{2}:\d{2}`) y `→` solo aplica con `(?=\s|$)` para **no tocar fechas** `31/07/2021`. Recupera 2 items, cero regresiones sobre 57 tests.
- **Corregido — dos enteros iniciales**: `4 3 AGUA LITRO CRISTAL 6,00 18,00` → el segundo entero es la cantidad real cuando `total/unit` lo confirma → 3×@6 (antes 4×@6=24, contradiciendo el total impreso 18,00).
- **Descartado por diseño**: líneas `8 -CHUP. DON JULIO BLA +/-` tienen cantidad y nombre pero **ningún precio en todo el ticket**; emitirlas exigiría inventar precio y corrompería la reconciliación con el TOTAL.
- **Advertencia registrada**: la corrección genérica "si `qty × unit ≠ total` impreso, sobrescribir con `total/unit`" es **peligrosa** — rompe el test bloqueado `4 HELADO CASA 7,00 7,00` (7/7=1 → convierte 4×7 en 1×7). Solo es seguro el disparador estrecho `^(\d+)\s+(\d+)\s+`.
- **Limitación aceptada**: las palabras españolas de una letra (`Y`, `de`, `del`) se eliminan de los nombres (`PAN Y ALI OLT` → `PAN ALI OLT`) para evitar ruido OCR.

### 1.4 Checkpoint de la rama de investigación

**Origen**: Engram obs `#314` (`decision`, 2026-08-03/05)

- Rama `research/unit-price-exploration`, worktree `spliteat-unit-price-exploration`, pusheada con `-u`.
- Commits: `de15778` (parser hardening, 13 archivos) y `adb5322` (`WORD_LEVEL_PARSING_PLAN.md`).
- **Dato crítico de continuidad**: la suite de **64 tests** (`receipt-parser.test.ts`) vive **solo en ese worktree**, no en el repositorio principal — allí solo existe `ocr-pipeline.integration.test.ts` con 21 casos. La suite del worktree queda congelada como **contrato de compatibilidad** del plan.
- Al ejecutar el plan: crear un worktree desde `origin/research/unit-price-exploration`.

---

## 2. Motores OCR (relacionado; también sin copia en disco)

> Recuperado por estar en riesgo de pérdida total, aunque quedaba fuera del alcance pedido. Es la única copia existente de este estudio.

### 2.1 Estudio comparativo de modelos *browser-first*

**Origen**: Engram obs `#370` (sesión `ses_fd06e2f2bffeLjCFGsp0J7I4w7`, 2026-08-23) y obs `#369` (`discovery`, topic `research/browser-receipt-models`)

Medido por `HTTP Content-Length` sobre los artefactos ONNX q4 correspondientes:

| Modelo | Tamaño registrado | Licencia | Idoneidad |
| --- | --- | --- | --- |
| `onnx-community/Florence-2-base-ft` (0.23B) | **~333,25 MB** (4 artefactos) | MIT | OCR con regiones; el proyecto ya lo integra |
| SmolVLM-256M | **~294,35 MB** q4 | Apache-2.0 | Generativo; declara principalmente **inglés** → requiere benchmark en tickets españoles |
| SmolVLM-500M | **~485,09 MB** q4 | Apache-2.0 | Igual, más pesado |
| TrOCR small-printed (61,4M params) | **~63,61 MB** cuantizado | — | Muy ligero, pero **solo reconoce líneas recortadas**; no es parser estructurado |
| Donut CORD-v2 | — | MIT | Afinado para recibos, pero **sin ruta web oficial madura** |
| PaddleOCR.js / PP-OCRv5 | No documentado de forma estable | Apache-2.0 | **Recomendación browser-first**: ONNX Runtime Web, multilingüe (español cubierto) |
| Tesseract.js | — | Apache-2.0 | WASM, 100+ idiomas; OCR puro sin estructura → baseline/fallback |

Otros datos registrados: Transformers.js usa ONNX Runtime; WebGPU es experimental y WASM/quantización son las opciones relevantes. Los pesos exactos dependen de variante y **no incluyen** runtime/tokenizer.

**Recomendación registrada** (obs `#369`): PaddleOCR.js/PP-OCRv5 como candidato de producción por OCR multilingüe, coordenadas y tamaño operativo, **combinado con el parser determinista**. TrOCR small como complemento ligero para líneas recortadas.

### 2.2 Veredicto de Judgment Day sobre la estrategia

**Origen**: Engram obs `#373` (2026-08-23)

- Dos jueces independientes coincidieron: **sin hallazgos críticos**; la estrategia justifica un **prototipo** de PaddleOCR, **no** una selección de producción.
- Falta verificar por modelo: IDs exactos, cuantización, tamaños descargados, memoria pico, latencia en dispositivos y métricas en tickets mixtos español-inglés.
- El parser determinista garantiza estructura y puede validar aritmética, pero **no corrige OCR ni errores de layout**: necesita confianza, asociación geométrica y abstención.
- **Tesseract.js admite `spa+eng`; el proyecto hoy solo usa `spa`.**
- PP-OCRv5 soporta reconocimiento multilingüe y variantes latinas, pero su peso total depende de detector/reconocedor/runtime concretos.

### 2.3 Decisiones del benchmark pendiente

**Origen**: Engram obs `#372` (`decision`, topic `research/browser-receipt-models-tradeoffs`, 2026-08-23)

- No precargar Tesseract, Florence y PaddleOCR: **lazy loading** y fallbacks por confianza.
- Evaluar **OCR y JSON por separado**, conservando texto, bounding boxes y confianza.
- **El NER queda fuera de la primera comparación**, para no mezclar variables.

---

## 3. EXIF (complemento a los informes en disco)

Los dos informes en disco (`exif-metadata-extraction.md` y `metadata-container-comparison.md`) ya incorporan las correcciones del juicio adversarial. Se conserva aquí el registro del propio juicio, porque es la justificación de las decisiones tomadas.

### 3.1 Juicio adversarial del contenedor de metadatos (A vs C)

**Origen**: Engram obs `#303` (`decision`, 2026-07-26)

- Juice ciego con dos jueces independientes sobre `metadata-container-comparison.md`. Juez A: `APPROVE_WITH_CHANGES` (defiende A). Juez B: `APPROVE_WITH_CHANGES` (defiende C). **Sin consenso**; los hallazgos convergentes forzaron **4 correcciones obligatorias** antes de que cualquiera de los veredictos se sostuviera (aplicadas en el commit `93d7d20`):
  1. `TSK-4.4.md:15` **ya** especifica multi-proveedor de mapas (Leaflet/OSM **o** Google Maps): la afirmación "no figura en el backlog" era **falsa**, y debilitaba el caso contra C.
  2. El único consumidor confirmado del GPS EXIF es **US-14 "Mapa de restaurantes", que agrega sobre N tickets**, no lectura puntual. Con agregación, el guard `null` es idéntico en A y C → la ventaja "ergonómica en UI" de A estaba sobrevalorada.
  3. Firestore: A y C **no** son indistintos — A permite `updateDoc` parcial con dot-notation; C con `arrayUnion` es *append-only*.
  4. La migración A→C "2 h mecánicas" **solo cuenta código**, no los datos persistidos en los navegadores de usuarios vivos: A es una **puerta de dirección preferente** si se publica antes de C. Además, la migración no son "2 líneas" si se añade `schemaVersion: 1` y normalización de `null`/`{}` — coste comparable a C.
- No diferenciadores registrados: RGPD A vs C (ambos persisten GPS en localStorage hasta la sincronización consentida; el stripping binario de TSK-4.3 es ortogonal a la forma de `Ticket.metadata`).
- **Hallazgo extra del Juez A**: `NewTicketCaptureView.handleCapture` **ya descarta** `ScanResult.engine/confidence/rawText` en el límite de persistencia — la telemetría se produce y se tira, lo que debilita el argumento anti-C de "hoy no hay telemetría".

### 3.2 Exploración inicial del dominio

**Origen**: Engram obs `#306` (topic `domain/ticket-metadata-exif`, 2026-07-26)

Puntos clave registrados: `Ticket` tenía 30 consumidores solo en componentes de ticket; `ScanMetadata` existía pero limitado a OCR local; la persistencia real es Zustand `persist` en localStorage (`spliteat-app-v1`) con migraciones inline (`store.ts:383-423`); el EXIF debe extraerse **antes** del preprocesado; y el namespace sugerido quedó como `Ticket.metadata.exif` con `gps/timestamp/device/orientation`.

---

## 4. Cómo se recuperó esto

Consultas a Engram (memoria persistente del proyecto `ai4devs-finalproject`) sobre: `parser heurístico precio unitario`, `receipt-parser reconciliación`, `OCR comparativa modelos navegador`, `judgment day estrategia OCR`, `EXIF metadata container`. Observaciones citadas: `#303`, `#306`, `#310`, `#311`, `#312`, `#313`, `#314`, `#369`, `#370`, `#371`, `#372`, `#373`.
