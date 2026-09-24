---
doc_id: architecture/stack
title: Stack tecnológico entregado
domain: architecture
audience: [human, agent]
status: entregado
source_of_truth_for:
  - stack tecnológico del producto entregado y versiones declaradas en manifiestos
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Stack tecnológico entregado

## Resumen

El stack de SplitEat es el de una aplicación de cliente que funciona entera en el navegador: React
18 y TypeScript empaquetados por Vite, Tailwind CSS v4 con primitivas de Radix UI, estado y
persistencia en Zustand sobre `localStorage`, enrutado por URL con `react-router-dom` v7, y OCR en
dispositivo con Tesseract.js y Florence-2 dentro de un worker con Comlink. Este documento es la
fuente canónica del stack entregado y de las versiones declaradas en los manifiestos, y su valor
principal es el motivo de cada elección y la alternativa que se descartó. Queda fuera la vista de
contenedores y componentes (`architecture/overview`) y el registro completo de decisiones
(`architecture/decisions`). No queda ninguna tecnología de nube en uso: Firebase, Firestore, Cloud
Functions, Google Cloud Vision y Dexie como capa de persistencia están descartados y se citan solo
como alternativa descartada.

## Estado

| Área | Estado | Evidencia |
| :--- | :--- | :--- |
| Framework de interfaz: React 18 y TypeScript | `entregado` | `frontend/package.json` declara `react` y `react-dom` `^18.3.1` y `typescript` `^5.9.3` |
| Empaquetado: Vite | `entregado` | `frontend/package.json` declara `vite` `^5.4.21`; `frontend/vite.config.ts` |
| Estilado: Tailwind CSS v4 | `entregado` | `frontend/package.json` declara `@tailwindcss/vite` `^4.3.3`; `frontend/tailwind.config.ts`; `frontend/src/styles/global.css` |
| Primitivas de interfaz: Radix UI y estilo shadcn | `entregado` | 27 paquetes `@radix-ui/*` en `frontend/package.json`; 47 archivos en `frontend/src/components/ui/` |
| Estado global: Zustand 4 | `entregado` | `frontend/package.json` declara `zustand` `^4.5.7`; `frontend/src/lib/store.ts` |
| Persistencia: `localStorage` con Zustand persist | `entregado` | `frontend/src/lib/store.ts` usa `createJSONStorage(() => localStorage)` con la clave `spliteat-app-v1` |
| Enrutado: `react-router-dom` v7 | `entregado` | `frontend/package.json` declara `react-router-dom` `^7.18.1`; `createBrowserRouter` en `frontend/src/main.tsx` |
| OCR en dispositivo: Tesseract.js y Florence-2 | `entregado` | `frontend/package.json` declara `tesseract.js` `^5.1.1` y `@huggingface/transformers` `^4.2.0`; `frontend/src/lib/scan/` |
| Ejecución fuera del hilo principal: Comlink | `entregado` | `frontend/package.json` declara `comlink` `^4.4.2`; `frontend/src/workers/ocr.worker.ts` |
| Lectura de metadatos EXIF: `exifr` | `entregado` | `frontend/package.json` declara `exifr` `^7.1.3`; `frontend/src/utils/exifHelper.ts` con import dinámico |
| Arrastre de líneas: dnd-kit | `entregado` | `frontend/package.json` declara `@dnd-kit/core` `^6.3.1` y `@dnd-kit/sortable` `^10.0.0`; `frontend/src/components/ticket/AssignmentEditor.tsx` |
| PWA: service worker y manifiesto | `entregado` | `frontend/public/sw.js`, `frontend/public/manifest.webmanifest`, `frontend/src/components/pwa/` |
| Pruebas: Vitest y Testing Library | `entregado` | `frontend/package.json` declara `vitest` `^1.6.1`, `@testing-library/react` `^14.3.1` y `jsdom` `^24.1.3`; script `test` |
| Calidad de código: ESLint sin avisos | `entregado` | Script `lint`: `eslint . --report-unused-disable-directives --max-warnings 0` |
| Entrega: GitHub Actions hacia Netlify y Vercel | `entregado` | Los 5 flujos de `.github/workflows/`; `frontend/netlify.toml`, `frontend/vercel.json` |
| Dexie sobre IndexedDB como capa de persistencia | `descartado` | `DEC-ARCH-04`; el paquete `dexie` está declarado en `frontend/package.json` y no se importa en ninguna parte |
| Firebase Auth, Cloud Firestore y Cloud Functions | `descartado` | `DEC-ARCH-04`; `backend/` no contiene código: solo `.keep` y una nota de ubicación |
| Google Cloud Vision como OCR remoto | `descartado` | `DEC-ARCH-03`; no existe llamada alguna en el código |
| Firebase Hosting | `descartado` | `DEC-ARCH-07`; el despliegue real es Netlify y Vercel |
| Motor OCR de servidor | `latente` | `DEC-ARCH-09` mantiene la vía abierta; el motor `'server'` sigue declarado sin servicio que lo atienda |
| Elección entre las propuestas A y C de extracción EXIF | `latente` | `DEC-ARCH-08` mantiene la decisión abierta sin resolver |

## Detalle

El stack se sostiene en una restricción y no en una preferencia: la aplicación debe funcionar sin
backend y sin conexión. Esa restricción descarta por sí sola la mayor parte de las piezas
habituales —servidor de aplicaciones, base de datos remota, autenticación gestionada, OCR por
API— y deja un conjunto pequeño y verificable de dependencias. Las versiones de la tabla siguiente
son las declaradas en `frontend/package.json`, no las resueltas en un `lockfile` concreto.

| Capa | Tecnología | Versión declarada | Papel |
| :--- | :--- | :--- | :--- |
| Framework de interfaz | `react` y `react-dom` | `^18.3.1` | Interfaz declarativa y estado de componente para el tablero de reparto |
| Tipos | `typescript` | `^5.9.3` | Tipos estáticos de `Ticket`, `TicketItem`, `ItemAssignment` y `PersonShare` |
| Empaquetado | `vite` y `@vitejs/plugin-react` | `^5.4.21`, `^4.7.0` | Servidor de desarrollo y bundle estático para una PWA |
| Estilado | `@tailwindcss/vite` (Tailwind CSS v4) | `^4.3.3` | Utilidades en el marcado y bloque `@theme` sobre variables CSS propias |
| Primitivas de interfaz | 27 paquetes `@radix-ui/*` | declaradas en `frontend/package.json` | Comportamiento accesible de diálogos, menús, pestañas y demás controles |
| Auxiliares de estilo | `class-variance-authority`, `clsx`, `tailwind-merge` | `^0.7.1`, `^2.1.1`, `^3.6.0` | Variantes de componente y combinación de clases (`cn()`) |
| Animación | `framer-motion`, `tw-animate-css` | `^11.18.2`, `^1.4.0` | Transiciones entre vistas y animaciones de utilidad |
| Iconos | `lucide-react` | `^1.27.0` | Iconografía de la interfaz |
| Arrastre de líneas | `@dnd-kit/core`, `@dnd-kit/sortable` | `^6.3.1`, `^10.0.0` | Asignación de líneas del ticket a personas |
| Estado global | `zustand` | `^4.5.7` | Fuente única del estado, con el middleware `persist` |
| Enrutado | `react-router-dom` | `^7.18.1` | Rutas por URL, rutas anidadas del asistente y `useBlocker` |
| Formularios | `react-hook-form` | `^7.83.0` | Entrada y validación de formularios |
| Fechas | `date-fns`, `react-day-picker` | `^4.4.0`, `^10.0.1` | Formato y selección de fechas |
| Gráficas | `recharts` | `^3.10.1` | Visualización de la vista de analíticas entregada |
| Avisos | `sonner` | `^2.0.7` | Notificaciones de la interfaz |
| OCR | `tesseract.js` | `^5.1.1` | OCR en WebAssembly, en dispositivo |
| OCR y VLM | `@huggingface/transformers` | `^4.2.0` | Florence-2 y el modelo NER en dispositivo, sobre WebGPU o WASM |
| Worker | `comlink` | `^4.4.2` | Interfaz remota tipada entre la SPA y el worker de OCR |
| Metadatos de imagen | `exifr` | `^7.1.3` | Lectura de EXIF desde el archivo original, con import dinámico |
| PWA | service worker propio | archivo `frontend/public/sw.js` | Precarga del shell y respuesta offline a las navegaciones |
| Pruebas | `vitest`, `@testing-library/react`, `jsdom` | `^1.6.1`, `^14.3.1`, `^24.1.3` | Pruebas de cálculo, estado, componentes y flujo de captura |
| Calidad de código | `eslint` con `--max-warnings 0` | `^8.57.1` | Puerta de lint en integración continua |
| Entrega | GitHub Actions, Netlify, Vercel | flujos y configuración en el repositorio | Construcción, despliegue y release |

### Motivo de cada elección y alternativa descartada

**React 18 con TypeScript y Vite.** La interfaz del producto es un tablero con estado compartido:
las líneas del ticket se arrastran sobre personas, los importes se recalculan en vivo y la lista de
participantes cambia durante la comida. React aporta ese modelo de estado con un ecosistema maduro
de arrastre y de componentes, y TypeScript protege las estructuras que atraviesan todo el sistema.
La alternativa considerada y descartada fue Svelte, que produce un bundle menor pero tenía un
ecosistema menos maduro para el arrastre de elementos; JavaScript sin tipos también se descartó
porque el coste de mantener a mano la forma de un ticket, con líneas, pesos y reparto, supera el
de anotar los tipos. Vite se eligió sobre un empaquetador clásico porque el producto es una PWA de
cliente: lo que hace falta es un bundle estático servible desde cualquier CDN, sin servidor de
aplicaciones.

**Tailwind CSS v4 con Radix UI.** La elección inicial del proyecto fue Vanilla CSS, y su motivo
está registrado: un bundle menor, variables CSS para el tema oscuro y ninguna capa de
post-procesado. Esa elección se abandonó cuando la interfaz pasó a construirse sobre un sistema de
diseño con primitivas portadas de otro proyecto: la migración de componentes trajo 47 archivos de
estilo shadcn sobre Radix y una paleta definida en el bloque `@theme` de Tailwind v4. Mantener
Vanilla CSS habría obligado a reescribir a mano cada primitiva y su accesibilidad. Vanilla CSS
queda como alternativa descartada, no como tecnología ausente: el tema sigue viviendo en variables
CSS propias (`frontend/src/styles/variables.css`) y el modo oscuro sigue dependiendo de la clase
`.dark`, que es lo que el proyecto ya tenía y por lo que la migración pudo hacerse sin romper el
tema. Radix se eligió porque aporta el comportamiento accesible —foco, teclado, capas— sin
imponer estilos.

**Zustand 4 con persistencia en `localStorage`.** El estado del producto entero cabe en un
documento JSON pequeño: personas, grupos, tickets, perfil, ajustes y banderas. Zustand con su
middleware `persist` resuelve ese caso en un solo archivo y añade la migración de datos antiguos en
`merge`, que es donde se normalizan los tickets sin descuentos y se completa el motor de escaneo
por defecto. La alternativa del plan inicial era un estado propio con React Context y hooks
personalizados: se descartó porque obliga a escribir a mano la serialización, la rehidratación y la
migración que el middleware ya ofrece. La alternativa Dexie sobre IndexedDB se descartó porque
existe para consultar e indexar dentro de un almacén grande, y aquí cada ticket se lee entero: la
dependencia está declarada en `frontend/package.json` y no se importa en ninguna parte del código.
Firebase y Firestore se descartaron con la nube entera (`DEC-ARCH-04`).

**`react-router-dom` v7.** El estado inicial del proyecto navegaba con una bandera de vista dentro
de Zustand, sin URL. Eso impedía el botón atrás del navegador, el enlace directo a un ticket y la
confirmación de salida del asistente. La migración a rutas reales se estudió en
`ROUTING_FEASIBILITY.md` y se resolvió con `react-router-dom` v7 en modo data: ofrece rutas
anidadas para el asistente de ticket nuevo y `useBlocker`, que es la pieza que protege un
formulario con cambios sin guardar. Las alternativas descartadas están documentadas en ese
informe: `wouter` es mucho más pequeño pero no tiene ni rutas anidadas declarativas ni
bloqueadores, de modo que habría que reimplementarlos a mano, y `@tanstack/router` ofrece mejor
inferencia de tipos a cambio de generación de código y conceptos nuevos que el proyecto no
necesita.

**OCR en dispositivo con cascada de motores.** El reconocimiento corre entero en el dispositivo y
el orquestador elige motor por disponibilidad: Florence-2 cuando el dispositivo tiene WebGPU
(mejor precisión, descarga inicial de unos 400 MB), Tesseract con NER cuando solo hay WebAssembly
(precisión media-alta, unos 110 MB) y Tesseract solo como último recurso en dispositivo (precisión
media, unos 5 MB). Los tres comparten el mismo parser determinista de tickets españoles, de modo
que el motor no cambia el formato de salida. La alternativa del OCR por API —Google Cloud
Vision— se descartó porque exige conexión justo en el escenario que el producto quiere resolver,
que es la mesa de un restaurante con mala cobertura, y porque envía la imagen fuera del
dispositivo. La alternativa de un VLM en servidor sigue declarada en el código como motor
`'server'` y está registrada como `latente` en `DEC-ARCH-09`.

**Un único worker con Comlink y `OffscreenCanvas`.** El OCR descarga modelos, binariza imágenes y
ejecuta inferencia durante segundos; hacerlo en el hilo principal congela la interfaz justo cuando
el usuario está manipulando el ticket. Se eligió un worker único con Comlink porque da a la SPA una
interfaz remota tipada y un solo punto donde viven la caché de modelos y el preprocesado. El
preprocesado usa `OffscreenCanvas` y `createImageBitmap`, que son las API disponibles dentro de un
worker; la alternativa de varios workers por motor multiplicaría la carga de modelos en memoria sin
mejorar el tiempo total. El diseño interno del worker está en `architecture/overview` (nivel 3.2).

**`exifr` para los metadatos EXIF.** El EXIF se lee del archivo original antes de comprimir, porque
la compresión redibuja la imagen en un lienzo y descarta los metadatos. Se eligió `exifr` por tamaño
reducido y porque ya entrega la posición GPS convertida a decimal; la alternativa registrada fue
`exifreader`, descartado por ser más pesado y por devolver el GPS como arreglos en grados, minutos y
segundos. La importación es dinámica para no cargar la librería en el bundle inicial, y el fallo de
lectura devuelve un espacio de nombres nulo en lugar de romper el flujo de captura. El dato se usa
durante la captura y no se persiste: `updateTicket` no recibe EXIF, de modo que no hay dato de
ubicación almacenado. Queda una decisión abierta sobre el modo de extracción, registrada como
`DEC-ARCH-08`.

**Netlify y Vercel como destinos de despliegue.** El bundle es estático, así que el despliegue no
necesita más que publicar `frontend/dist`. Se eligieron dos proveedores sobre el mismo repositorio
para tener dos frentes de disponibilidad con el mismo esfuerzo, ambos disparados por GitHub Actions
cuando cambia `frontend/**`. La alternativa del plan inicial —Firebase Hosting— se descartó junto
con el resto de Firebase, porque mantenía una cuenta y una consola de nube para servir archivos
estáticos (`DEC-ARCH-07`).

### Compromisos del stack entregado y sus mitigaciones

| Compromiso | Coste | Mitigación implementada |
| :--- | :--- | :--- |
| Modelos de OCR en el dispositivo | Florence-2 pesa unos 400 MB y el conjunto Tesseract + NER unos 110 MB; la primera vez hay que descargarlos | El orquestador recomienda el mejor motor ya cacheado, `model-manager` mantiene un solo modelo pesado en memoria y `storage-manager` verifica espacio antes de descargar |
| Persistencia en `localStorage` | El navegador puede desalojar el almacenamiento de un sitio poco usado y no hay transacciones ni índices | Copia de seguridad en JSON con `exportData` e `importData`, que valida la forma de los datos antes de aceptarla |
| Procesamiento pesado en el cliente | La inferencia consume batería y tarda varios segundos por ticket | Todo el trabajo corre en el worker, `imageQualityAssessor` avisa de imágenes inservibles antes de gastar inferencia y el progreso se comunica a la interfaz |
| Sin backend | No hay historial compartido entre dispositivos ni copia remota | El reparto es presencial y de un solo dispositivo; la copia se resuelve con el archivo JSON |

La descarga de modelos es el compromiso más visible para la persona que usa el producto: el motor
de mayor precisión no puede estar en el bundle. La mitigación no es reducir el modelo sino
explicar el coste antes de descargarlo y dejar los motores ligeros como opción desde el primer
momento, que es lo que hace el selector de motor.

### Contenido retirado de este documento y por qué

| Contenido retirado | Motivo | Dónde vive ahora el razonamiento |
| :--- | :--- | :--- |
| Apartado que justificaba Vanilla CSS y rechazaba TailwindCSS | Contradecía el producto entregado: Tailwind v4 es el sistema de estilos en uso | Su motivo original se conserva como alternativa descartada en «Motivo de cada elección» y en `DEC-ARCH-02` |
| Auditoría de CVE de dependencias | Auditaba la seguridad de un diseño de nube que no existe y emitía veredictos que ningún comando del repositorio puede reproducir; además cubría Dexie como capa de persistencia, que no está en uso | No se conserva: una afirmación de seguridad sin comando que la reproduzca no pertenece a este documento según el estándar |
| Apartado sobre arranques en frío de Firebase Functions | Describía la latencia de un servicio inexistente | La razón por la que se descartó el OCR remoto se conserva en `DEC-ARCH-03` y `DEC-ARCH-09` |
| Apartado sobre expulsión de almacenamiento en iOS | Describía `IndexedDB` y una suscripción de nube como mitigación | Se ha reescrito sobre `localStorage` y la copia de seguridad JSON, que es la mitigación real |

### Estructura real del código

| Directorio | Contenido |
| :--- | :--- |
| `frontend/src/components/` | Componentes de interfaz: `ui/` (primitivas), `camera/`, `ticket/`, `people/`, `layout/`, `pwa/`, `scan/`, `onboarding/` |
| `frontend/src/views/` | Vistas del producto, incluido el asistente de ticket nuevo |
| `frontend/src/hooks/` | Hooks propios: cámara, tema, avisos y bloqueador de navegación |
| `frontend/src/lib/` | Dominio y estado: `calc.ts`, `store.ts`, `types.ts` y `scan/` con el pipeline de OCR |
| `frontend/src/utils/` | Utilidades de archivo, con la lectura de EXIF |
| `frontend/src/workers/` | Worker de OCR expuesto con Comlink |
| `frontend/src/styles/` | `variables.css` con las variables CSS del tema y `global.css` con el bloque `@theme` |
| `frontend/src/test-utils/` | Utilidades de prueba, con el renderizado que incluye el enrutador |
| `frontend/src/services/` | Directorio declarado sin código: contiene únicamente `.keep` |

Los directorios `backend/` y `db/` existen en la raíz y contienen únicamente un archivo `.keep`, y
cada uno lleva su propio `README.md` explicando por qué está vacío. No forman parte del stack
entregado.

## Decisiones


Este documento no toma decisiones propias: describe el stack que resulta de ellas. El registro
canónico es `architecture/decisions`, con los identificadores `DEC-ARCH-xx` y su contexto,
alternativas descartadas y motivo.

## Cómo verificar este documento

- [ ] `for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do grep -q "^$k:" docs/architecture/stack.md && echo "OK: $k" || echo "FALLO: $k"; done` → ocho líneas `OK`
- [ ] ``m=$(grep -c '^```mermaid' docs/architecture/stack.md); c=$(grep -c '^<!-- mermaid-companion' docs/architecture/stack.md); [ "$m" = "$c" ] && echo "OK: $m/$c" || echo "FALLO: $m/$c"`` → `OK: 0/0`
- [ ] `for t in react vite zustand react-router-dom tesseract.js @huggingface/transformers comlink exifr @dnd-kit/core @radix-ui/react-slot; do grep -q "$t" docs/architecture/stack.md && echo "OK: $t" || echo "FALLO: $t"; done` → diez líneas `OK`: el stack entregado está documentado
- [ ] `grep -nE '^\| (Frontend Framework|Build Tooling|Styling System|Local Database|Offline OCR|Cloud OCR API|Backend API Gate|Cloud Database|Authentication) \|' docs/architecture/stack.md` → sin salida: las filas del stack antiguo no se conservan
- [ ] `grep -nE '^## .*(CVE|Security|Tradeoff|Cold)' docs/architecture/stack.md` → sin salida: los apartados de auditoría de CVE y de compromisos de nube se retiraron
- [ ] `grep -rnoE '@radix-ui/[a-z-]+' frontend/package.json | sort -u | wc -l` → 27
- [ ] `grep -n '](\.\./' docs/architecture/stack.md` → sin salida

## Referencias

- `docs/DOC-STANDARD.md` — estándar de escritura dual; fuente canónica del esquema, del esqueleto y del vocabulario de estado
- `docs/architecture/overview.md` — contenedores y componentes del producto entregado
- `docs/architecture/decisions.md` — registro canónico de las decisiones `DEC-ARCH-xx` y sus alternativas descartadas
- `docs/data/scope-evolution.md` — alcance de datos planificado y descartado, y diagramas históricos de la nube
- `docs/plan-reorganizacion.md` — plan de la reorganización documental; ficha T3
- `ROUTING_FEASIBILITY.md` — estudio de viabilidad del enrutado por URL y comparación con `wouter` y `@tanstack/router`
- `frontend/package.json` — versiones declaradas de todas las dependencias
- `frontend/vite.config.ts` — configuración del empaquetado y del worker
- `frontend/tailwind.config.ts` — configuración de Tailwind CSS v4
- `frontend/src/lib/scan/orchestrator.ts` — cascada de motores de OCR
- `frontend/src/lib/scan/capabilities.ts` — detección de capacidades y catálogo de motores con su coste
- `frontend/src/utils/exifHelper.ts` — lectura de EXIF con import dinámico y fallback nulo
- `.github/workflows/` — cadena real de construcción, despliegue y release
- `frontend/netlify.toml`, `frontend/vercel.json` — configuración de los dos destinos de despliegue
