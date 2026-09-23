---
doc_id: quality/testing-strategy
title: Estrategia de pruebas y calidad
domain: quality
audience: [human, agent]
status: entregado
source_of_truth_for:
  - estrategia de pruebas del producto entregado: runner, configuración, inventario de archivos de prueba y comando de ejecución
  - gate de calidad de la integración continua: los pasos de lint, build y test y lo que protege cada uno
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Estrategia de pruebas y calidad

## Resumen

La verificación automatizada de SplitEat es una única suite de **Vitest 1.6.1** sobre **jsdom** con
**Testing Library**: 23 archivos de prueba que cubren la lógica de dominio, el pipeline de OCR y
escaneo, cinco componentes, dos hooks, dos utilidades y una vista, y que se ejecuta en el gate de
integración continua junto con el lint y la comprobación de tipos. Este documento es la fuente
canónica de esa estrategia —qué se prueba, con qué, cómo se ejecuta y qué protege el gate— y de las
decisiones que la fijan. Quedan fuera la estrategia de ramas y de despliegue, que pertenece a
`process/delivery-and-branching`, y el alcance funcional del producto, que pertenece a
`product/prd`. Tres prácticas que el documento anterior daba por vigentes **no existen en el
producto**: no hay automatización de pruebas de extremo a extremo, no hay automatización de
accesibilidad y no hay medición de cobertura. Las tres se declaran `planificado` en `## Estado` y
su razonamiento se conserva en `## Detalle`.

## Estado

| Área | Estado | Permanencia | Evidencia |
| :--- | :--- | :--- | :--- |
| Runner y configuración: Vitest 1.6.1 sobre jsdom, con `globals`, `setupFiles` y el alias `@` | `entregado` | `definitivo` | `frontend/vitest.config.ts`; `vitest` y `jsdom` en `frontend/package.json` |
| Suite entregada: 23 archivos de prueba y 347 casos declarados | `entregado` | `definitivo` | `find frontend/src -name '*.test.ts*' \| wc -l` → `23`; el desglose por área está en `## Detalle` |
| Pruebas de la capa de dominio y del estado global | `entregado` | `definitivo` | `frontend/src/lib/calc.test.ts`, `frontend/src/lib/store.test.ts`, `frontend/src/lib/wizard-loaders.test.ts` |
| Pruebas del pipeline de OCR y escaneo | `entregado` | `definitivo` | los diez archivos `frontend/src/lib/scan/*.test.ts` |
| Pruebas de componentes, hooks, utilidades y vistas con Testing Library | `entregado` | `definitivo` | `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event` en `frontend/package.json` |
| Gate de integración continua: lint, comprobación de tipos, empaquetado y pruebas | `entregado` | `definitivo` | `.github/workflows/ci.yml`, job `Lint · Build · Test` |
| Criterios de accesibilidad escritos en las definiciones de terminado de las historias y tareas | `parcial` | `definitivo` | `grep -rln WCAG docs/product/user-stories/` → 4 archivos; falta la auditoría que demuestre el cumplimiento y no hay comprobación automática |
| Automatización de pruebas de extremo a extremo | `planificado` | — | Sin trabajo iniciado: `playwright` y `cypress` no aparecen en `frontend/package.json` ni hay un paso de navegador en `.github/workflows/ci.yml`; `DEC-QUA-02` |
| Automatización de accesibilidad | `planificado` | — | Sin trabajo iniciado: `axe`, `jest-axe` y `@axe-core/*` no aparecen en `frontend/package.json`; `DEC-QUA-03` |
| Medición de cobertura | `planificado` | — | Sin trabajo iniciado: ni `frontend/vitest.config.ts` ni `frontend/package.json` declaran cobertura; `DEC-QUA-04` |

La columna `permanencia` distingue la entrega estable de la provisional. Ninguna fila de este
documento declara `temporal`: no hay un sustituto identificado para la configuración entregada, de
modo que el runner, la suite y el gate se documentan como `definitivo`. Las tres áreas
`planificado` no llevan permanencia porque no existe nada que sustituir: no hay trabajo iniciado
que pudiera ser reemplazado. La decisión que fija el estado del informe de juicio de este dominio
es `DEC-QUA-05`, y su documento canónico es `quality/judgment-report`.

## Detalle

### El runner y su configuración

| Hecho | Valor | Evidencia |
| :--- | :--- | :--- |
| Runner | Vitest 1.6.1 | `frontend/vitest.config.ts`; `vitest` en `frontend/package.json` |
| Comando de ejecución | `pnpm test` → `vitest run` | `frontend/package.json` |
| Archivo de configuración | `frontend/vitest.config.ts` | el archivo existe y declara el bloque `test` |
| Entorno | `jsdom` 24.1.3 | `environment: 'jsdom'` en `frontend/vitest.config.ts`; `jsdom` en `frontend/package.json` |
| API global | `globals: true` | `frontend/vitest.config.ts` |
| Preparación previa | `setupFiles: './src/setupTests.ts'`, que importa `@testing-library/jest-dom` | `frontend/vitest.config.ts`; `frontend/src/setupTests.ts` |
| Alias de importación | `@` → `frontend/src` | `frontend/vitest.config.ts`; se usa en las pruebas, por ejemplo en `frontend/src/views/NewTicketCaptureView.test.tsx` |
| Plugin | `@vitejs/plugin-react` 4.7.0 | `frontend/vitest.config.ts` |
| Pruebas de componentes | `@testing-library/react` 14.3.1, `@testing-library/jest-dom` 6.10.0 y `@testing-library/user-event` 14.6.1 | `frontend/package.json` |
| Simulación de la persistencia | Mock propio de `localStorage` escrito en la prueba, sin biblioteca externa | `frontend/src/lib/store.test.ts` |

La elección de Vitest y no de un runner de navegador explica dos propiedades de la suite que
conviene tener presentes. La primera es que el entorno es jsdom: hay `document`, hay eventos y hay
`localStorage` simulado, pero no hay motor de renderizado, ni cámara, ni `WebGPU`, ni `Canvas`
real, así que el pipeline de OCR se prueba por sus funciones puras y con dobles de sus
dependencias. La segunda es que `vitest run` transpila sin comprobar tipos: la única comprobación
de tipos de la cadena es `tsc -b`, que se ejecuta en el paso de build del gate.

### Inventario de las 23 pruebas

| Área | Archivos | Casos declarados | Carpeta |
| :--- | ---: | ---: | :--- |
| Lógica de dominio y estado global | 3 | 123 | `frontend/src/lib/` |
| OCR y escaneo | 10 | 157 | `frontend/src/lib/scan/` |
| Componentes | 5 | 34 | `frontend/src/components/` |
| Hooks | 2 | 18 | `frontend/src/hooks/` |
| Utilidades | 2 | 12 | `frontend/src/utils/` |
| Vistas | 1 | 3 | `frontend/src/views/` |
| **Total** | **23** | **347** | — |

**Lógica de dominio y estado global.**

| Archivo | Qué verifica | Casos |
| :--- | :--- | ---: |
| `frontend/src/lib/calc.test.ts` | Formateo de importes y fechas, generación de identificadores e iniciales, redondeo de presentación, totales del ticket, impuestos y propina, reparto por persona, normalización de pesos, asignación completa y cuadre | 53 |
| `frontend/src/lib/store.test.ts` | Estado inicial del almacén, personas, grupos, tickets, líneas, descuentos, recálculo del ticket, perfil y ajustes, reinicio, selectores, migración al fusionar el estado persistido y exportación e importación de la copia en JSON | 42 |
| `frontend/src/lib/wizard-loaders.test.ts` | Carga de datos del asistente de ticket nuevo, sus pasos y las condiciones que bloquean la navegación | 28 |

**OCR y escaneo.** Es el área con más superficie de prueba, y su alcance real es la lógica
determinista del pipeline: parseo, preprocesado de imagen sobre datos sintéticos, evaluación de
calidad, fusión de secciones y catálogo de motores.

| Archivo | Qué verifica | Casos |
| :--- | :--- | ---: |
| `frontend/src/lib/scan/capabilities.test.ts` | Caché del modelo, persistencia de la descarga y catálogo de motores disponibles | 9 |
| `frontend/src/lib/scan/florence-engine.test.ts` | Reconstrucción de líneas de texto a partir de las regiones que devuelve el modelo | 3 |
| `frontend/src/lib/scan/imageQualityAssessor.test.ts` | Detección de desenfoque, oscuridad y calidad suficiente para decidir el aviso al usuario | 8 |
| `frontend/src/lib/scan/multiSectionMerger.test.ts` | Fusión de varias secciones de un mismo ticket en un resultado único | 3 |
| `frontend/src/lib/scan/ner-engine.test.ts` | Modelos de reconocimiento de entidades declarados | 5 |
| `frontend/src/lib/scan/ocr-pipeline.integration.test.ts` | Flujo de datos puro del pipeline: parseo de texto OCR en español, clasificación por el mini-agente y lectura de importes en formato español e inglés | 15 |
| `frontend/src/lib/scan/preprocessor.test.ts` | Ecualización de histograma, filtro de mediana, umbral adaptativo, cálculo de la escala de recorte y preprocesado por secciones, sobre datos sintéticos | 31 |
| `frontend/src/lib/scan/receipt-parser.test.ts` | Parser de tickets en español: importes, cantidades, precios límite, nombres, normalización de texto OCR, tickets reales, reconciliación con el total global, fechas ISO y separadores | 66 |
| `frontend/src/lib/scan/tesseract-ner-engine.test.ts` | Motor Tesseract con reconocimiento de entidades y similitud entre cadenas | 9 |
| `frontend/src/lib/scan/types.test.ts` | Tipos del ajustador de imagen y del evaluador de calidad | 8 |

**Componentes, hooks, utilidades y vistas.**

| Archivo | Qué verifica | Casos |
| :--- | :--- | ---: |
| `frontend/src/components/camera/CameraCapture.test.tsx` | Extracción de EXIF del archivo original antes de comprimir, comportamiento cuando la extracción falla y captura por cámara en vivo | 3 |
| `frontend/src/components/camera/TicketImageAdjuster.test.tsx` | Controles de filtro, selector de resolución, avisos de calidad de imagen, acción de repetir la foto y gestión de secciones de recorte | 6 |
| `frontend/src/components/scan/ScanEngineSelector.test.tsx` | Catálogo de motores, motor seleccionado por omisión, descarga del modelo de IA en dispositivo y bloqueo por ausencia de `WebGPU` | 5 |
| `frontend/src/components/ticket/AssignmentEditor.test.tsx` | Apertura del panel de asignación, modos individual, compartido y ponderado, alta y baja de personas y reparto equitativo de pesos | 6 |
| `frontend/src/components/ticket/TicketItemsEditor.test.tsx` | Alta, edición y borrado de líneas, cambio del modo de IVA, resumen de totales, estado vacío y descuentos | 14 |
| `frontend/src/hooks/useCamera.test.ts` | Ciclo de vida de la cámara: permisos, dispositivos, arranque, parada y errores | 12 |
| `frontend/src/hooks/useTheme.test.ts` | Tema claro y oscuro, persistencia de la preferencia y reacción al cambio del sistema | 6 |
| `frontend/src/utils/exifHelper.test.ts` | Extracción de EXIF con `exifr`, mapeo al espacio de nombres propio y borrado de metadatos con fallo ruidoso | 10 |
| `frontend/src/utils/dummy.test.ts` | Comprobación de andamiaje: que el entorno de pruebas y los comparadores de `jest-dom` cargan | 2 |
| `frontend/src/views/NewTicketCaptureView.test.tsx` | Arranque del asistente, transición de la fase de captura a la de ajuste y ejecución del preprocesado, del lote de OCR, de la fusión y de la persistencia al confirmar el ajuste | 3 |

### El gate de integración continua

El único lugar donde las pruebas se ejecutan de forma automática sobre cada cambio es el workflow
`CI`, en el job `Lint · Build · Test`, con `frontend` como directorio de trabajo.

| # | Paso del job | Comando real | Qué protege |
| :---: | :--- | :--- | :--- |
| 1 | `Lint` | `pnpm lint` → `eslint . --report-unused-disable-directives --max-warnings 0` | Que no entre código con avisos de lint y que no queden directivas de supresión de ESLint obsoletas. `--max-warnings 0` convierte cualquier aviso en fallo: no existe la categoría de «aviso que se arregla después» |
| 2 | `Build (typecheck + bundling)` | `pnpm build` → `tsc -b && vite build` | Los tipos y la construcción del bundle. Es el único paso que comprueba tipos, porque `vitest run` transpila sin comprobarlos; además falla si el bundle no se puede producir, que es la condición para que la aplicación se despliegue |
| 3 | `Test` | `pnpm test` → `vitest run` | El comportamiento: los 23 archivos de prueba se ejecutan sin vigilancia de cambios y el job falla con la primera prueba roja |

| Hecho | Valor | Evidencia |
| :--- | :--- | :--- |
| Workflow del gate | `CI` | `.github/workflows/ci.yml` |
| Nombre del job | `Lint · Build · Test` | `.github/workflows/ci.yml` |
| Disparadores | `pull_request` y `push` sobre `feature/feature-entrega2-ADLC` | `.github/workflows/ci.yml` |
| Directorio de trabajo | `frontend` | `defaults.run.working-directory` en `.github/workflows/ci.yml` |
| Node | 22 | `actions/setup-node` en `.github/workflows/ci.yml` |
| Gestor de paquetes | pnpm 11.10.0 con `--frozen-lockfile` | `pnpm/action-setup` y el paso de instalación; `packageManager` en `frontend/package.json` |
| Concurrencia | Un grupo por referencia, con cancelación en curso | bloque `concurrency` de `.github/workflows/ci.yml` |
| Segundo lugar donde corren los tres pasos | `.github/workflows/release-staging.yml`, sobre ramas `release/**`, antes de los despliegues de staging | `.github/workflows/release-staging.yml` |
| Workflows que compilan sin ejecutar pruebas | `deploy-netlify.yml` y `deploy-vercel.yml` construyen y despliegan; `release.yml` solo redacta las notas de la versión | los tres archivos |
| Workflows del repositorio | 5 | `ls .github/workflows/` |

La consecuencia de esta distribución es que el gate de pruebas es un requisito de la integración,
no del despliegue: una publicación de `deploy-netlify.yml` o `deploy-vercel.yml` no vuelve a
ejecutar la suite. La comprobación de que un cambio no rompe el producto depende del job
`Lint · Build · Test` y, en las ramas de release, de `release-staging.yml`.

### El reparto al céntimo: qué afirma realmente `frontend/src/lib/calc.test.ts`

El documento anterior describía esta área como un «resolutor matemático de redondeo» probado en
`src/utils/mathHelper.test.ts`, con casos que repartían 10,00 € entre tres personas en 3,33 €,
3,33 € y 3,34 € y garantizaban que la suma coincidía exactamente con el total. Ese archivo no
existe y esa función tampoco: lo que existe son funciones puras en `frontend/src/lib/calc.ts`,
donde `computeShares` reparte por pesos y distribuye descuentos, IVA y propina de forma
proporcional o equitativa, y `verifyCuadre` comprueba que la suma de las partes coincide con el
total del ticket dentro de una tolerancia de un céntimo (`Math.abs(diff) < 0.01`). No hay ningún
ajuste de céntimos que fuerce el cuadre exacto: el cuadre se verifica, no se corrige. El redondeo
existe solo para presentar, en `round2`.

| Grupo de casos de `frontend/src/lib/calc.test.ts` | Qué afirma |
| :--- | :--- |
| Formateo | `formatEUR`, `formatDate` y `formatDateTime`, incluidos los valores nulos y las fechas inválidas |
| Identificadores y presentación | `genId` devuelve valores únicos y de al menos ocho caracteres; `getInitials` y la paleta `AVATAR_COLORS` |
| Redondeo de presentación | `round2` a dos decimales, con `0.001` → `0` |
| Totales del ticket | `itemLineTotal`, `calcSubtotal`, `calcItemsTotal`, `calcTicketTotal` y `calcDiscountsTotal`, con descuentos de importe fijo y de porcentaje |
| Impuestos y propina | `calcTaxAmount` en modo añadido y en modo incluido; `calcTipAmount` con los modos `none`, `percentage` y `fixed` |
| Reparto por persona | `personItemShare` con pesos, `normalizeWeights`, `itemsFullyAssigned` y `computeShares`, con IVA proporcional y equitativo |
| Cuadre | `verifyCuadre` sobre un ticket equilibrado y sobre otro con un participante sin consumo: en ambos casos el resultado es `ok`, porque la tolerancia admite la diferencia |

### Criterios de accesibilidad frente a automatización de accesibilidad

La accesibilidad del producto y la automatización de su verificación son dos cosas distintas, y el
documento anterior las mezclaba: afirmaba que el contraste se verificaba en integración continua
con `@axe-core/playwright`. Esa herramienta no está instalada y el gate no ejecuta ningún paso de
accesibilidad. Lo que sí existe son criterios de accesibilidad escritos en las definiciones de
terminado de varias historias y tareas de frontend. Se listan con su archivo y su línea para que la
afirmación sea comprobable.

| Archivo | Línea | Criterio declarado |
| :--- | ---: | :--- |
| `docs/product/user-stories/epic-1-core/US-01.md` | 52 | Auditoría de accesibilidad WCAG 2.1 AA aprobada para la vista de procesamiento visual |
| `docs/product/user-stories/epic-1-core/TSK-1.5.md` | 36 | Validación de accesibilidad WCAG 2.1 AA del componente |
| `docs/product/user-stories/epic-2-advanced/TSK-2.6.md` | 36 | Contraste WCAG AAA en exteriores, superior a 7:1 en los textos principales de pago |
| `docs/product/user-stories/epic-2-advanced/US-15.md` | 121 | Auditoría de accesibilidad, manual o con herramienta, del contraste AA sobre el fondo |
| `docs/product/user-stories/epic-1-core/US-03.md` | 52 | Anuncio por `aria-live` de las asignaciones realizadas |
| `docs/product/user-stories/epic-2-advanced/US-06.md` | 50, 52 | Estilos de alto contraste y anuncio de las alertas con `aria-live="polite"` |
| `docs/product/user-stories/epic-2-advanced/US-07.md` | 51 | Indicadores visuales de foco claros en los elementos interactivos |
| `docs/product/user-stories/epic-2-advanced/US-09.md` | 50 | Legibilidad en exteriores |
| `docs/product/user-stories/epic-2-advanced/TSK-2.3.md` | 37 | Evento de accesibilidad `aria-live="polite"` al cambiar de estado |

El informe de juicio del 2026-06-07 certificó que había «criterios WCAG 2.1 AA en todas las
definiciones de DoD de frontend (US-03, US-06, US-07, US-09)». La lectura de los archivos no
sostiene esa afirmación tal como está escrita: WCAG 2.1 AA se nombra en `US-01` y en `TSK-1.5`, y
`US-15` menciona WCAG AA en una fila de auditoría; `US-03`, `US-06`, `US-07` y `US-09` declaran
criterios de accesibilidad —anuncios `aria-live`, alto contraste, foco visible— pero no nombran el
estándar. Hay criterios; no hay una auditoría registrada que demuestre su cumplimiento, y no hay
ninguna comprobación automática. Por eso la fila correspondiente de `## Estado` es `parcial`.

### Lo que el plan original describía y no se ejecutó

Estas tres prácticas se conservan con su razonamiento porque explican qué se quería verificar y qué
queda sin verificar. No son un olvido de este documento: son alcance no entregado, registrado como
`planificado` y con su decisión en `## Decisiones`.

**Pruebas de extremo a extremo.** El razonamiento era que solo un navegador real verifica el flujo
completo —de la captura de la foto al dictado de las cantidades—, incluidos el arrastre táctil y la
emulación de Safari en iOS y Chrome en Android. La suite entregada no lo hace: se ejecuta
íntegramente en Node con jsdom y no descarga ningún navegador. La intención sobrevivió en las listas
de QA de varias historias de usuario (`docs/product/user-stories/epic-1-core/US-03.md`,
`docs/product/user-stories/epic-2-advanced/US-05.md`, `US-08.md`, `US-09.md` y `US-15.md`) y en el
propio archivo `frontend/src/lib/scan/ocr-pipeline.integration.test.ts`, cuya cabecera declara que
las etapas de preprocesado y de OCR real se cubren «separately by E2E tests»; esas pruebas no
existen, de modo que esas etapas quedan verificadas solo en parte. El repositorio no registra una
decisión fechada que explique por qué la herramienta no llegó a añadirse; `DEC-QUA-02` registra el
alcance y este documento declara el límite.

**Auditoría de accesibilidad automatizada.** El razonamiento era que el producto se dirige a
personas mayores y a entornos con poca luz, y que el contraste y los objetivos táctiles deberían
comprobarse de forma continua en lugar de confiarse a una revisión manual. La suite entregada no
contiene ninguna comprobación de contraste, de etiquetas ARIA ni de tamaño de los objetivos
táctiles. El criterio sí está escrito en las definiciones de terminado que lista el apartado
anterior; lo que falta es la medición.

**Medición de cobertura.** El documento anterior no describía cobertura, pero la cadena sí permite
medirla y no lo hace: ni `frontend/vitest.config.ts` ni `frontend/package.json` declaran el
proveedor de cobertura ni un umbral. Esto tiene una consecuencia práctica que conviene declarar:
sin medición no se puede afirmar qué proporción del código está cubierta, y ningún dato de
cobertura de este proyecto es verificable hoy.

### Límites de esta estrategia

| Punto | Qué no se pudo determinar | Por qué |
| :--- | :--- | :--- |
| Casos realmente ejecutados | Cuántos casos corre la suite al pasar el gate | El recuento de 347 casos es estático, por lectura de los bloques `it(` de cada archivo; medir la ejecución exige la salida de `pnpm test`, que no se recogió en esta pasada |
| Cobertura del código | Qué proporción del código cubre la suite | No hay medición de cobertura configurada; no existe ningún informe que consultar |
| Motivo fechado de la omisión de las tres prácticas no entregadas | La decisión original que las dejó fuera del alcance | El repositorio no la registra con fecha ni con motivo; `DEC-QUA-02`, `DEC-QUA-03` y `DEC-QUA-04` registran el hecho y el alcance, no un motivo original |
| Cumplimiento de los criterios de accesibilidad | Si el producto cumple WCAG 2.1 AA | Los criterios están escritos en las definiciones de terminado, pero no hay auditoría registrada ni comprobación automática que los mida |
| Fiabilidad de `frontend/src/views/NewTicketCaptureView.test.tsx` | Si verifica el flujo completo de captura | Dos de sus tres casos condicionan el cuerpo a que un elemento exista en pantalla; si el elemento no existe, el caso termina sin comprobar el flujo y aun así pasa |
| Cobertura de las etapas de preprocesado y de OCR real | Si el pipeline completo está verificado de extremo a extremo | `frontend/src/lib/scan/ocr-pipeline.integration.test.ts` cubre solo las etapas puras y delega el resto a unas pruebas de extremo a extremo que no existen; `frontend/src/views/NewTicketCaptureView.test.tsx` sustituye el worker por un doble |

## Decisiones

| id | fecha | decisión | contexto | alternativas | elección | motivo | estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-QUA-01` | 2026-09-22 | Verificar el producto con Vitest y Testing Library en Node con jsdom | El producto es una PWA de cliente sin backend y el pipeline de OCR se apoya en funciones puras y en un worker; hacía falta una suite que corriera en el mismo flujo que el lint y el build, sin infraestructura adicional | Jest con Enzyme; pruebas en un navegador real con Playwright; no tener pruebas automatizadas | Vitest 1.6.1 sobre jsdom, con Testing Library para los componentes y un doble propio de `localStorage` | Vitest comparte la resolución de módulos y el alias de Vite, de modo que una prueba importa el mismo `@/lib/store` que la aplicación, y el entorno jsdom cubre el estado, los eventos y el almacenamiento sin descargar un navegador. Un runner de navegador habría añadido infraestructura y tiempo a un gate que debe caber en cada cambio | `entregado` |
| `DEC-QUA-02` | 2026-09-22 | Dejar la automatización de pruebas de extremo a extremo fuera del alcance entregado | El documento anterior describía una suite de extremo a extremo que verificaría el flujo de la foto al dictado con arrastre táctil y emulación de móviles; no hay ningún framework instalado ni un paso de navegador en el gate | Playwright; Cypress; ninguna automatización de extremo a extremo | Ninguna automatización de extremo a extremo | La suite entregada es Node con jsdom y no descarga navegadores, y el gate se mantiene rápido por ello. Las etapas que jsdom no alcanza quedan verificadas solo en parte, y esa deuda se declara en `## Estado` y en los límites de este documento en lugar de presentarse como cubierta | `planificado` |
| `DEC-QUA-03` | 2026-09-22 | Dejar la automatización de accesibilidad fuera del alcance entregado | Las definiciones de terminado de varias historias declaran criterios de accesibilidad, y el documento anterior afirmaba que el contraste se verificaba en el pipeline | `@axe-core/playwright` en el pipeline; `jest-axe` en las pruebas de componentes; auditoría manual sin automatización | Ninguna automatización de accesibilidad | Añadir una comprobación automática de contraste y de estructura exigiría primero cerrar el criterio —qué se mide y con qué umbral— sobre las vistas que lo declaran. Mientras no exista, la fila de `## Estado` es `parcial`: hay criterios escritos y no hay medición | `planificado` |
| `DEC-QUA-04` | 2026-09-22 | No configurar la medición de cobertura | La cadena permite medirla y el proyecto no la mide; sin medición no se puede afirmar qué proporción del código está cubierta | Umbral de cobertura en Vitest; informe sin umbral; no medir | No medir | Un umbral sin una revisión previa del alcance real de la suite fijaría como objetivo una cifra que la suite no puede sostener en las etapas que jsdom no alcanza. Antes de fijar un umbral hay que cerrar esas etapas, que es lo que registra `DEC-QUA-02` | `planificado` |

Las cuatro decisiones se registran juntas porque comparten un mismo motivo de fondo: la suite
entregada verifica lo que puede verificar sin navegador y declara lo que no verifica. La decisión
sobre el estado del informe de juicio de este dominio es `DEC-QUA-05` y se define en
`quality/judgment-report`, que es su documento canónico.

## Cómo verificar este documento

- [ ] Frontmatter completo:

```bash
for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do
  grep -q "^$k:" docs/quality/testing-strategy.md && echo "OK: $k" || echo "FALLO: $k"
done
```

- [ ] Las seis secciones canónicas están presentes:

```bash
for s in '## Resumen' '## Estado' '## Detalle' '## Decisiones' '## Cómo verificar este documento' '## Referencias'; do
  awk -v s="$s" '/^```/{f=!f; next} !f && index($0,s)==1{found=1} END{exit !found}' docs/quality/testing-strategy.md \
    && echo "OK: $s" || echo "FALLO: $s"
done
```

- [ ] El estado declarado pertenece al vocabulario cerrado y ninguna fila de `## Estado` usa `mixto`:

```bash
grep -qE '^status: (entregado|parcial|latente|descartado|planificado|mixto)$' docs/quality/testing-strategy.md \
  && echo "OK: status" || echo "FALLO: status"
awk '/^## Estado/{f=1; next} /^## Detalle/{f=0} f && /^\| /' docs/quality/testing-strategy.md | grep -c '`mixto`'
```

- [ ] El inventario declarado coincide con el repositorio:

```bash
find frontend/src -name '*.test.ts*' | wc -l
```

- [ ] Ninguna herramienta ausente se presenta como vigente; cada mención aparece en una línea que la refuta:

```bash
grep -niE 'fake-indexeddb|playwright|cypress|@axe-core|jest-axe|dexie' docs/quality/testing-strategy.md \
  | grep -viE 'no |sin |ni |ninguna|ningún' \
  && echo "FALLO: mención sin refutar" || echo "OK: toda mención está refutada"
```

- [ ] La afirmación falsa sobre `fake-indexeddb` y Dexie no reaparece como práctica vigente:

```bash
grep -rln 'fake-indexeddb\|from .dexie' frontend/src | wc -l
```

- [ ] No hay enlaces que suban directorios y los enlaces llevan barra inicial:

```bash
grep -n '](\.\./' docs/quality/testing-strategy.md && echo "FALLO" || echo "OK: sin rutas relativas profundas"
grep -nE '\]\([a-z]' docs/quality/testing-strategy.md && echo "FALLO" || echo "OK: todo enlace lleva barra inicial"
```

- [ ] No hay expresiones ambiguas en uso:

```bash
grep -niE 'prev[i]sto|se us[a]rá|est[a] definido|planificad[o] para|se implement[a]rá|\[Pend[i]ng\]|\bRea[d]y\b' docs/quality/testing-strategy.md \
  | grep -viE '«|»|`' && echo "FALLO" || echo "OK"
```

- [ ] Hay un acompañamiento textual por cada diagrama Mermaid del documento:

```bash
m=$(grep -c '^```mermaid' docs/quality/testing-strategy.md)
c=$(grep -c '^<!-- mermaid-companion' docs/quality/testing-strategy.md)
[ "$m" = "$c" ] && echo "OK: $m/$c" || echo "FALLO: $m diagramas / $c acompañamientos"
```

## Referencias

- `docs/DOC-STANDARD.md` — estándar de escritura dual; fuente canónica del esquema de frontmatter, del esqueleto de secciones, del vocabulario de estado y de la columna `permanencia`
- `docs/quality/judgment-report.md` — informe de juicio del 2026-06-07 sobre los documentos anteriores; define `DEC-QUA-05` y explica qué afirmaciones suyas no se sostienen
- `docs/architecture/decisions.md` — registro de decisiones de arquitectura; `DEC-ARCH-04` descarta la nube y Dexie, y `DEC-ARCH-06` explica la ejecución del OCR en un worker
- `docs/architecture/overview.md` — contenedores y componentes del producto entregado, con el pipeline de OCR
- `docs/data/local-model.md` — persistencia real sobre `localStorage`, que es lo que simula `frontend/src/lib/store.test.ts`
- `docs/product/user-stories/` — definiciones de terminado y listas de QA, incluidas las que declaran criterios de accesibilidad
- `docs/process/delivery-and-branching.md` — estrategia de ramas y despliegue; el gate de este documento es un paso de ese flujo
- `docs/traceability/evidence.md` — métricas verificables del proyecto, entre ellas el número de archivos de prueba
- `docs/plan-reorganizacion.md` — plan de la reorganización documental; secciones 2.3, 4 y ficha T6
- `frontend/vitest.config.ts` — configuración del runner: entorno, `globals`, `setupFiles` y alias
- `frontend/package.json` — versiones declaradas de las dependencias de prueba y scripts de lint, build y test
- `.github/workflows/ci.yml` — gate de integración continua, job `Lint · Build · Test`
- `.github/workflows/release-staging.yml` — segundo lugar donde corren los tres pasos, antes de los despliegues de staging
- `frontend/src/setupTests.ts` — carga de los comparadores de `jest-dom` antes de cada archivo de prueba
- `frontend/src/lib/calc.ts` — funciones puras de reparto, impuestos, propina y cuadre que verifica `frontend/src/lib/calc.test.ts`
