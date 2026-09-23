---
doc_id: architecture/decisions
title: Registro de decisiones de arquitectura
domain: architecture
audience: [human, agent]
status: entregado
source_of_truth_for:
  - decisiones de arquitectura, stack y despliegue del producto entregado, con sus alternativas descartadas
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Registro de decisiones de arquitectura

## Resumen

Este documento registra las nueve decisiones que explican por qué SplitEat está construido como
está: el framework y el empaquetado, los estilos, el OCR en dispositivo, la persistencia sin nube,
el enrutado por URL, la ejecución del OCR en un único worker, el despliegue estático y dos
decisiones que siguen abiertas —el modo de extracción de EXIF y el motor OCR de servidor—. Es la
fuente canónica de esas decisiones y de sus alternativas descartadas, que es la parte que no se
puede reconstruir leyendo el código. Quedan fuera las decisiones de producto y de alcance, que se
registran con el prefijo `DEC-PROD-xx` en `product/prd`, y el detalle técnico de cada pieza, que
está en `architecture/overview` y `architecture/stack`. La columna `estado` declara la situación de
la opción elegida; cuando una decisión retira una opción anterior, el descarte se registra en
`alternativas` y en la tabla de `## Estado`.

## Estado

| Ámbito de decisión | Estado | Evidencia |
| :--- | :--- | :--- |
| Framework y empaquetado | `entregado` | `DEC-ARCH-01`; `react`, `react-dom` y `vite` declarados en `frontend/package.json` |
| Estilos y primitivas de interfaz | `entregado` | `DEC-ARCH-02`; `@tailwindcss/vite` y 27 paquetes `@radix-ui/*` en `frontend/package.json` |
| OCR en dispositivo | `entregado` | `DEC-ARCH-03`; `frontend/src/lib/scan/` con los tres motores y el parser común |
| Persistencia y estado global | `entregado` | `DEC-ARCH-04`; `frontend/src/lib/store.ts` con Zustand `persist` sobre `localStorage` |
| Enrutado por URL | `entregado` | `DEC-ARCH-05`; `createBrowserRouter` en `frontend/src/main.tsx` y `useBlocker` en `frontend/src/hooks/useBlocker.ts` |
| Ejecución del OCR fuera del hilo principal | `entregado` | `DEC-ARCH-06`; `frontend/src/workers/ocr.worker.ts` con Comlink |
| Despliegue del bundle estático | `entregado` | `DEC-ARCH-07`; `.github/workflows/deploy-netlify.yml` y `.github/workflows/deploy-vercel.yml` |
| Modo de extracción de EXIF | `latente` | `DEC-ARCH-08` mantiene la decisión abierta |
| Extracción de EXIF implementada | `entregado` | `frontend/src/utils/exifHelper.ts` con `exifr` e import dinámico |
| Motor OCR de servidor | `latente` | `DEC-ARCH-09` mantiene la vía abierta; el motor `'server'` sigue declarado sin servicio que lo atienda |
| Nube: Firebase Auth, Cloud Firestore, Cloud Functions, Firebase Hosting y Dexie sobre IndexedDB | `descartado` | `DEC-ARCH-04` y `DEC-ARCH-07` registran el descarte; `backend/` y `db/` no contienen código: solo `.keep` y una nota de ubicación |

## Detalle

El registro se construyó a partir del código entregado y de la documentación con fecha propia que
existe en el repositorio. La columna `fecha` es la fecha de registro y verificación de la decisión
en este documento, que coincide con la última verificación de la documentación: el repositorio no
fecha las decisiones originales. Cuando la evidencia disponible tiene fecha propia, `contexto` la
cita; no se inventan fechas. Toda decisión apunta a una fuente que un lector puede abrir.

| id | fecha | decisión | elección | estado |
| :--- | :--- | :--- | :--- | :--- |
| `DEC-ARCH-01` | 2026-09-22 | Framework, lenguaje y empaquetado | React 18 + TypeScript + Vite | `entregado` |
| `DEC-ARCH-02` | 2026-09-22 | Estilos y primitivas de interfaz | Tailwind CSS v4 + Radix UI, con Vanilla CSS descartado | `entregado` |
| `DEC-ARCH-03` | 2026-09-22 | OCR | Cascada en dispositivo: Tesseract, Tesseract + NER y Florence-2, con parser común | `entregado` |
| `DEC-ARCH-04` | 2026-09-22 | Persistencia | `localStorage` con Zustand `persist`, sin nube | `entregado` |
| `DEC-ARCH-05` | 2026-09-22 | Enrutado | `react-router-dom` v7 con `createBrowserRouter` | `entregado` |
| `DEC-ARCH-06` | 2026-09-22 | Ejecución del OCR | Un único worker con Comlink y `OffscreenCanvas` | `entregado` |
| `DEC-ARCH-07` | 2026-09-22 | Despliegue | Netlify + Vercel desde GitHub Actions | `entregado` |
| `DEC-ARCH-08` | 2026-09-22 | Modo de extracción de EXIF | Ninguna: decisión abierta entre las propuestas A y C | `latente` |
| `DEC-ARCH-09` | 2026-09-22 | OCR de servidor | Conservarlo como cambio pendiente | `latente` |

### La decisión que gobierna a las demás

Ocho de las nueve decisiones son consecuencia de una sola: el MVP entregado —las funciones F-01 a
F-11— se cerró como aplicación 100 % local, sin cuenta de usuario y sin nube. Con esa decisión,
cada pieza de infraestructura remota se quedó sin función, y por eso las alternativas descartadas
de `DEC-ARCH-04` y `DEC-ARCH-07` no son un arrepentimiento técnico sino una consecuencia de
alcance. Leer este registro como una lista de preferencias tecnológicas llevaría a la conclusión
equivocada de que Firebase o Dexie eran mejores o peores y se cambiaron por criterio técnico: lo
que ocurrió es que el producto dejó de necesitarlos. El alcance de producto está registrado en
`product/prd` como `DEC-PROD-05` y el detalle de la nube descartada, en `data/scope-evolution`.

### La decisión abierta sobre EXIF

`DEC-ARCH-08` no está resuelta y este registro no la resuelve. La extracción de EXIF sí está
entregada (`frontend/src/utils/exifHelper.ts`, con `exifr` e import dinámico), pero la elección
entre las propuestas A y C sigue pendiente. La única referencia disponible las nombra sin
describirlas: no hay en el repositorio ningún documento que defina qué contiene cada propuesta, de
modo que ni sus alternativas ni su motivo se pueden registrar sin inventarlos. La decisión se
resolvería con un documento que describa ambas propuestas con criterios comparables —el momento de
la lectura del archivo, el coste en el bundle inicial, el comportamiento con la cámara en vivo y
el tratamiento del dato de ubicación según el RGPD— y con la elección de una de ellas anotada en
esta misma fila.

### Qué mantiene abierta la vía del OCR de servidor

`DEC-ARCH-09` conserva el motor `'server'` como cambio pendiente porque el código lo sigue
declarando en `frontend/src/lib/types.ts` y en `frontend/src/workers/ocr.worker.ts`, y el catálogo
de motores lo sigue presentando como disponible cuando hay conexión
(`frontend/src/lib/scan/capabilities.ts`). La vía se cerraría con una decisión de producto —retirar
el motor del código y del catálogo— o se convertiría en trabajo al implementar un servicio que lo
atienda. Mientras ninguna de las dos cosas ocurra, su estado es `latente` y no `descartado`.

## Decisiones

| id | fecha | decisión | contexto | alternativas | elección | motivo | estado | evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-ARCH-01` | 2026-09-22 | Adoptar React 18, TypeScript y Vite como base de la aplicación | La interfaz es un tablero con estado compartido: líneas del ticket que se arrastran sobre personas y totales que se recalculan en vivo. El producto se sirve como PWA estática, sin servidor de aplicaciones | Svelte; JavaScript sin tipos; empaquetador clásico | React 18 + TypeScript + Vite con `@vitejs/plugin-react` | El ecosistema de arrastre y de componentes ya resuelto ahorra trabajo real en el tablero, y TypeScript protege estructuras que atraviesan todo el sistema; Vite produce el bundle estático que una PWA necesita | `entregado` | `frontend/package.json`, `frontend/src/main.tsx`, `frontend/vite.config.ts` |
| `DEC-ARCH-02` | 2026-09-22 | Sustituir Vanilla CSS por Tailwind CSS v4 con primitivas de Radix UI | La elección inicial del proyecto fue Vanilla CSS, por bundle menor y variables propias; después la interfaz pasó a construirse sobre un sistema de diseño portado desde otro proyecto, con 47 primitivas shadcn sobre Radix | Vanilla CSS; Tailwind CSS v4 con Radix UI | Tailwind CSS v4 mediante `@tailwindcss/vite`, con Radix y `cn()` sobre `clsx` y `tailwind-merge` | Las primitivas portadas y su accesibilidad ya venían resueltas sobre Tailwind; reproducirlas a mano sobre CSS propio era trabajo sin valor añadido. El tema sigue en variables CSS propias y el modo oscuro sigue dependiendo de la clase `.dark`, así que la migración no rompió el tema | `entregado` | `frontend/package.json`, `frontend/tailwind.config.ts`, `frontend/src/components/ui/`, `frontend/src/styles/variables.css`, `openspec/changes/ui-primitives-migration/proposal.md` |
| `DEC-ARCH-03` | 2026-09-22 | Ejecutar el OCR en el dispositivo con una cascada de motores y un parser común | Hacía falta leer un ticket en la mesa de un restaurante, sin conexión fiable y sin enviar la fotografía fuera del dispositivo | Google Cloud Vision por API; Tesseract.js solo; Tesseract con NER y Florence-2 en dispositivo | Tesseract.js, Tesseract con NER y Florence-2 en dispositivo, elegidos por capacidad del dispositivo, con un único parser determinista | El OCR por API exige conexión justo en el escenario que el producto quiere resolver, y saca del dispositivo una imagen con metadatos. La cascada permite funcionar siempre: Florence-2 cuando hay WebGPU, Tesseract con NER cuando solo hay WASM y Tesseract solo como último recurso. El parser común hace que el motor no cambie el formato de salida | `entregado` | `frontend/src/lib/scan/orchestrator.ts`, `frontend/src/lib/scan/capabilities.ts`, `frontend/src/lib/scan/receipt-parser.ts` |
| `DEC-ARCH-04` | 2026-09-22 | Resolver la persistencia en el navegador sin nube, y descartar Firebase con Dexie | El documento de arquitectura anterior describía Cloud Firestore con sincronización y una base local sobre IndexedDB con Dexie, y el paquete `dexie` llegó a declararse en el manifiesto | Firebase Auth con Cloud Firestore y un gestor de sincronización; Dexie sobre IndexedDB; `localStorage` con Zustand `persist` | `localStorage` con Zustand `persist`, clave `spliteat-app-v1`, y copia de seguridad en JSON | El MVP entregado no tiene cuenta de usuario ni varios dispositivos, así que no hay nada que sincronizar. El volumen real es un puñado de tickets que se leen enteros, de modo que los índices y las transacciones de Dexie no aportan nada a cambio de su coste. La nube y Dexie quedan `descartado`; la copia JSON sobrevive como mitigación de la pérdida de datos | `entregado` | `frontend/src/lib/store.ts`, `frontend/package.json`, `docs/data/scope-evolution.md` |
| `DEC-ARCH-05` | 2026-09-22 | Enrutar por URL con `react-router-dom` v7 | El proyecto navegaba con una bandera de vista dentro de Zustand, sin URL: no había botón atrás, ni enlace directo a un ticket, ni confirmación al salir del asistente | Bandera de vista en Zustand; `wouter`; `@tanstack/router` | `react-router-dom` v7 en modo data, con `createBrowserRouter` y `useBlocker` | Hacen falta rutas anidadas para el asistente de ticket nuevo y bloqueadores de navegación para el formulario con cambios sin guardar; `wouter` no ofrece ninguna de las dos cosas y `@tanstack/router` añade generación de código y conceptos nuevos que el proyecto no necesita | `entregado` | `frontend/src/main.tsx`, `frontend/src/hooks/useBlocker.ts`, `ROUTING_FEASIBILITY.md`, `openspec/changes/archive/2026-07-25-routing-refactor/` |
| `DEC-ARCH-06` | 2026-09-22 | Ejecutar todo el OCR en un único worker con Comlink y `OffscreenCanvas` | El OCR descarga modelos, binariza imágenes y ejecuta inferencia durante segundos; en el hilo principal eso congela la interfaz justo mientras el usuario manipula el ticket | Ejecutar el OCR en el hilo principal; varios workers, uno por motor | Un único worker expuesto con Comlink, con preprocesado sobre `OffscreenCanvas` y `createImageBitmap` | Un solo punto de entrada evita duplicar la caché de modelos y el preprocesado, y Comlink da a la SPA una interfaz remota tipada. `OffscreenCanvas` es la API disponible dentro de un worker; varios workers multiplicarían la carga de modelos en memoria sin mejorar el tiempo total | `entregado` | `frontend/src/workers/ocr.worker.ts`, `frontend/src/components/camera/CameraScanFlow.tsx`, `frontend/src/lib/scan/preprocessor.ts` |
| `DEC-ARCH-07` | 2026-09-22 | Desplegar el bundle estático en Netlify y Vercel, y descartar Firebase Hosting | El producto no tiene backend: lo único que hay que publicar es el contenido de `frontend/dist` | Firebase Hosting; Netlify y Vercel | Netlify y Vercel, disparados por GitHub Actions desde el mismo repositorio | Dos destinos del mismo bundle dan dos frentes de disponibilidad sin mantener una cuenta y una consola de nube para servir archivos estáticos, y el despliegue queda en el mismo flujo que las pruebas | `entregado` | `.github/workflows/deploy-netlify.yml`, `.github/workflows/deploy-vercel.yml`, `frontend/netlify.toml`, `frontend/vercel.json` |
| `DEC-ARCH-08` | 2026-09-22 | Elegir entre la propuesta A y la propuesta C para la extracción de EXIF | La extracción ya está entregada con `exifr` desde el archivo original, pero la comparación entre las dos propuestas sigue pendiente | Propuesta A; propuesta C | Ninguna: la decisión queda abierta | Ni el contenido de las dos propuestas ni el motivo de cada una se pueden reconstruir desde el repositorio; la decisión se declara abierta en lugar de inventarla. Se resolvería con un documento que describa ambas propuestas con criterios comparables y con la elección anotada en esta fila | `latente` | `frontend/src/utils/exifHelper.ts`, `frontend/openspec/changes/archive/2026-08-23-exif-metadata-mapping/design.md` |
| `DEC-ARCH-09` | 2026-09-22 | Mantener el motor OCR de servidor como cambio pendiente | El motor `'server'` sigue declarado en los tipos y en el worker, y el catálogo de motores lo presenta como disponible con conexión, pero no existe ningún servicio que lo atienda | Eliminar el motor del código y cerrar la vía; conservarlo como `latente` | Conservarlo como `latente` | El código mantiene abierta la vía hacia un OCR remoto de mayor precisión; cerrarla o implementarla es una decisión de producto que no se ha tomado, de modo que el estado es pendiente con retorno y no descartado | `latente` | `frontend/src/lib/types.ts`, `frontend/src/workers/ocr.worker.ts`, `frontend/src/lib/scan/capabilities.ts` |

### Límites de este registro

Se declaran de forma explícita los puntos en los que la evidencia no permite completar una fila,
para que nadie confunda un registro completo con un registro inventado.

| Punto | Qué no se pudo determinar | Por qué |
| :--- | :--- | :--- |
| `DEC-ARCH-08` | El contenido de las propuestas A y C, y el motivo de cada una | Ningún documento del repositorio las describe; solo aparecen nombradas en el registro de decisiones y en el enunciado de la tarea T3 |
| `DEC-ARCH-01` a `DEC-ARCH-07` y `DEC-ARCH-09` | La fecha original en que se tomó cada decisión | El repositorio no fecha las decisiones; la fecha registrada es la de verificación de este documento y `contexto` cita la evidencia con fecha propia cuando existe |
| `DEC-ARCH-02` | El momento exacto y el motivo formal del cambio de Vanilla CSS a Tailwind | La propuesta de migración de primitivas describe el traslado, pero no registra una decisión de descarte de Vanilla CSS con fecha y motivo propios |

## Cómo verificar este documento

- [ ] `for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do grep -q "^$k:" docs/architecture/decisions.md && echo "OK: $k" || echo "FALLO: $k"; done` → ocho líneas `OK`
- [ ] `grep -oE 'DEC-ARCH-[0-9]{2}' docs/architecture/decisions.md | sort -u | tr '\n' ' '` → `DEC-ARCH-01 DEC-ARCH-02 DEC-ARCH-03 DEC-ARCH-04 DEC-ARCH-05 DEC-ARCH-06 DEC-ARCH-07 DEC-ARCH-08 DEC-ARCH-09 `
- [ ] `awk -F'|' '/^\| .DEC-ARCH-/ && NF-2 == 9' docs/architecture/decisions.md | wc -l` → 9: una fila por decisión en el registro, con las ocho columnas del estándar más la de evidencia
- [ ] `awk -F'|' '/^\| .DEC-ARCH-/ && NF-2 == 5' docs/architecture/decisions.md | wc -l` → 9: una fila por decisión en la tabla de resumen
- [ ] `grep -oE 'DEC-ARCH-[0-9]{2}' docs/architecture/decisions.md | sort -u | wc -l` → 9
- [ ] ``m=$(grep -c '^```mermaid' docs/architecture/decisions.md); c=$(grep -c '^<!-- mermaid-companion' docs/architecture/decisions.md); [ "$m" = "$c" ] && echo "OK: $m/$c" || echo "FALLO: $m/$c"`` → `OK: 0/0`
- [ ] `awk -F'|' '/^\| .DEC-ARCH-0[89]/ && NF-2 == 9 && $9 ~ /latente/' docs/architecture/decisions.md | wc -l` → 2: las dos decisiones abiertas, `DEC-ARCH-08` y `DEC-ARCH-09`, están en estado `latente`
- [ ] `grep -n '](\.\./' docs/architecture/decisions.md` → sin salida

## Referencias

- `docs/DOC-STANDARD.md` — estándar de escritura dual; fuente canónica del esquema, del esqueleto, de la tabla de identificadores y del vocabulario de estado
- `docs/architecture/overview.md` — contenedores y componentes del producto entregado
- `docs/architecture/stack.md` — stack entregado, versión declarada y motivo de cada elección
- `docs/data/scope-evolution.md` — alcance de datos planificado y descartado, y diagramas históricos de la nube
- `docs/product/prd.md` — funciones del producto y decisiones de alcance `DEC-PROD-xx`
- `docs/plan-reorganizacion.md` — plan de la reorganización documental; secciones 4 y 8.1, y ficha T3
- `ROUTING_FEASIBILITY.md` — estudio de viabilidad del enrutado por URL, con la comparación de alternativas de `DEC-ARCH-05`
- `frontend/package.json` — versiones declaradas de las dependencias citadas
- `frontend/src/lib/store.ts` — persistencia real y copia de seguridad en JSON
- `frontend/src/lib/scan/` — pipeline de OCR, cascada de motores y parser común
- `frontend/src/utils/exifHelper.ts` — extracción de EXIF entregada, sujeta a la decisión abierta de `DEC-ARCH-08`
- `frontend/openspec/changes/archive/2026-08-23-exif-metadata-mapping/design.md` — diseño de la extracción de EXIF y alternativa descartada de librería
- `.github/workflows/` — cadena real de construcción, despliegue y release
