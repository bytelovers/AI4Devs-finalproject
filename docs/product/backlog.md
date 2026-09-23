---
doc_id: product/backlog
title: Backlog del producto SplitEat
domain: product
audience: [human, agent]
status: mixto
source_of_truth_for:
  - lista de epics del producto
  - identificadores US-xx y TSK-x.y y su epic
  - prioridad y estado de cada historia y tarea técnica
  - propiedad del espacio de nombres TSK-x.y
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Backlog del producto SplitEat

## Resumen

Este backlog es el registro canónico de los epics del producto, de los identificadores `US-xx` y
`TSK-x.y`, de su prioridad y de su estado. No repite la narración ni los criterios de aceptación:
ese detalle funcional vive en `docs/product/user-stories/**` y aquí solo se enlaza. El MVP
entregado son los epics 1 y 2 completos y una parte del epic 4; el epic 3 quedó abandonado porque
el producto es de cliente y no tiene backend, salvo `TSK-3.5`, que se conserva como elemento
latente. El documento cubre más de un estado y lo declara en la tabla de `## Estado`.

## Estado

| Área | Estado | Evidencia |
| :--- | :--- | :--- |
| Epic 1 — Core (US-01…US-03 y 6 de sus 8 tareas) | `entregado` | `frontend/src/lib/scan/`, `frontend/src/lib/store.ts`, `frontend/src/views/` |
| Epic 1 — `TSK-1.2` | `parcial` | La persistencia entregada es `localStorage`; la interfaz de repositorio para migración a Firestore no tiene destino |
| Epic 1 — `TSK-1.5` | `latente` | La captura de ticket existe; su rama de fallback contra una API de nube no tiene servicio (`DEC-PROD-07`) |
| Epic 2 — Advanced (US-04…US-06, US-09, US-15 y 5 de sus 7 tareas) | `entregado` | `frontend/src/lib/calc.ts`, `frontend/src/components/ticket/`, `frontend/src/components/ThemeSelector.tsx` |
| Epic 2 — `TSK-2.1` | `parcial` | El reparto con cuadre exacto está entregado con pesos por persona y verificación (`frontend/src/lib/calc.ts`); el helper de ajuste de céntimos que la tarea especifica —`frontend/src/utils/mathHelper.ts`— nunca se creó |
| Epic 2 — `TSK-2.4` y `US-07` | `parcial` | La propina está entregada (`tipMode`, `tipAmount`, `calcTipAmount`); el redondeo seleccionable no: `settings.roundingMode` está declarado en `frontend/src/lib/types.ts:222` y persistido en `frontend/src/lib/store.ts:91`, pero **no alimenta ningún cálculo** |
| Epic 2 — `US-08` | `descartado` | El sorteo entre participantes no se implementó: no hay componente de ruleta ni lógica de sorteo. `frontend/src/components/Drawer.tsx` declara una entrada a `/wheel`, pero es **código muerto que nadie importa** y esa ruta no existe en `frontend/src/main.tsx` |
| Epic 3 — Cloud (US-10…US-12 y 6 de sus 7 tareas) | `descartado` | `DEC-PROD-08`; `grep -ril firebase frontend/src` → 0 archivos |
| Epic 3 — `TSK-3.5` | `latente` | El motor OCR `'server'` sigue declarado en `frontend/src/lib/types.ts` y `frontend/src/workers/ocr.worker.ts` |
| Epic 4 — US-13 | `parcial` | La copia de seguridad en JSON está entregada (F-11); el informe PDF/Excel con desglose que la historia describe no se implementó |
| Epic 4 — `TSK-4.1`, `TSK-4.4`, `TSK-4.5` | `parcial` | Existe la base local de exportación y de vistas; el alcance premium de cada tarea no está cubierto |
| Epic 4 — `TSK-4.2` | `descartado` | Depende de `TSK-3.4`, que pertenece al epic 3 descartado (`DEC-PROD-08`) |
| Epic 4 — `TSK-4.3` | `latente` | La vía de subida a la nube está cerrada, pero el análisis EXIF local existe: `frontend/src/utils/exifHelper.ts` |
| Epic 4 — US-14 | `descartado` | Depende del histórico en la nube y del mapa de visitas, ambos sin backend |

## Detalle

### Cómo se lee este backlog

Este documento y `docs/product/user-stories/**` tienen responsabilidades separadas y ninguna se
duplica. El backlog responde a «qué elementos existen, con qué identificador, con qué prioridad y
en qué estado»; el directorio de historias responde a «qué hace exactamente cada elemento». Las 42
historias y tareas que hoy se repiten literalmente en este archivo se eliminan de aquí porque su
texto íntegro —narración, criterios de aceptación y definición de terminado— ya vive en
`docs/product/user-stories/**`, y las dos copias habían empezado a divergir. La regla se registra
en `DEC-PROD-09`.

| Hecho | Fuente canónica |
| :--- | :--- |
| Lista de epics, identificadores `US-xx` y `TSK-x.y`, prioridad y estado | `docs/product/backlog.md` |
| Narración, criterios de aceptación y definición de terminado | `docs/product/user-stories/**` |
| Funciones del producto `F-xx` y su prioridad MoSCoW | `docs/product/prd.md` |

### Epic 1: Core Digitalization & Basic Assignment Flow (offline, sin registro)

| id | tipo | título | prioridad | complejidad | estado | detalle canónico |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| US-01 | US | Escaneo OCR inteligente de tickets | Must | 5 | `entregado` | `docs/product/user-stories/epic-1-core/US-01.md` |
| US-02 | US | Edición manual y OCR fallback | Must | 3 | `entregado` | `docs/product/user-stories/epic-1-core/US-02.md` |
| US-03 | US | Asignación unitaria visual | Must | 5 | `entregado` | `docs/product/user-stories/epic-1-core/US-03.md` |
| TSK-1.1 | TSK | Inicialización del proyecto, entorno de tests y tokens CSS | — | 2 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.1.md` |
| TSK-1.2 | TSK | Esquema Dexie.js (IndexedDB) y capa repository (DAL) | — | 3 | `parcial` | `docs/product/user-stories/epic-1-core/TSK-1.2.md` |
| TSK-1.3 | TSK | Servicio de OCR offline (Tesseract.js local WASM) | — | 5 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.3.md` |
| TSK-1.4 | TSK | Motor de expresiones regulares para parseo de tickets | — | 4 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.4.md` |
| TSK-1.5 | TSK | Componente UI de captura de ticket y procesamiento visual | — | 4 | `latente` | `docs/product/user-stories/epic-1-core/TSK-1.5.md` |
| TSK-1.6 | TSK | React Hook de estado global de cuentas (useTicketState) | — | 3 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.6.md` |
| TSK-1.7 | TSK | Pantalla de edición y corrección manual de tickets | — | 3 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.7.md` |
| TSK-1.8 | TSK | Mesa de asignación interactiva (Split Board View) | — | 5 | `entregado` | `docs/product/user-stories/epic-1-core/TSK-1.8.md` |

`TSK-1.2` queda en `parcial` porque la tarea declara una interfaz genérica de repositorio para una
migración posterior a Firestore: la parte de acceso a datos está cubierta por el estado local,
pero el destino de esa migración no existe. `TSK-1.5` queda en `latente` porque la tarea ramifica
hacia una API de Firebase Functions; la captura de ticket sí está entregada, y la vía de retorno
hacia un OCR de servidor sigue abierta según `DEC-PROD-07`.

### Epic 2: Advanced Reparto, Rounding & Gamification Flow (offline, sin registro)

| id | tipo | título | prioridad | complejidad | estado | detalle canónico |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| US-04 | US | División de platos compartidos con ajuste de redondeo matemático | Must | 5 | `entregado` | `docs/product/user-stories/epic-2-advanced/US-04.md` |
| US-05 | US | Asignación rápida de comunes y entrantes | Should | 3 | `entregado` | `docs/product/user-stories/epic-2-advanced/US-05.md` |
| US-06 | US | Alertas de platos huérfanos y descuadres | Must | 3 | `entregado` | `docs/product/user-stories/epic-2-advanced/US-06.md` |
| US-07 | US | Redondeo visual e individual y propina común | Must | 3 | `parcial` | `docs/product/user-stories/epic-2-advanced/US-07.md` |
| US-08 | US | Gamificación: la ruleta del pagador | Should | 5 | `descartado` | `docs/product/user-stories/epic-2-advanced/US-08.md` |
| US-09 | US | Pantalla de dictado al camarero e historial de sesión local | Must | 3 | `entregado` | `docs/product/user-stories/epic-2-advanced/US-09.md` |
| US-15 | US | Selector de tema y rediseño visual Sage & Amber | Medium | — | `entregado` | `docs/product/user-stories/epic-2-advanced/US-15.md` |
| TSK-2.1 | TSK | Cuadre del reparto (plan: ajuste de céntimos; entregado: pesos y verificación) | — | 3 | `parcial` | `docs/product/user-stories/epic-2-advanced/TSK-2.1.md` |
| TSK-2.2 | TSK | Reparto rápido de entrantes y platos comunes | — | 3 | `entregado` | `docs/product/user-stories/epic-2-advanced/TSK-2.2.md` |
| TSK-2.3 | TSK | Barra de estado de cuadre y alertas de platos huérfanos | — | 2 | `entregado` | `docs/product/user-stories/epic-2-advanced/TSK-2.3.md` |
| TSK-2.4 | TSK | Módulo de redondeo individual y propina común | — | 2 | `parcial` | `docs/product/user-stories/epic-2-advanced/TSK-2.4.md` |
| TSK-2.5 | TSK | Componente de ruleta de sorteo (Gamification Wheel) | — | 4 | `entregado` | `docs/product/user-stories/epic-2-advanced/TSK-2.5.md` |
| TSK-2.6 | TSK | Vista de dictado al camarero | — | 2 | `entregado` | `docs/product/user-stories/epic-2-advanced/TSK-2.6.md` |
| TSK-2.7 | TSK | Recuperación automática de sesiones y borrado de datos locales | — | 2 | `entregado` | `docs/product/user-stories/epic-2-advanced/TSK-2.7.md` |

`US-15` se incorpora a este epic en este mismo cambio: existía en
`docs/product/user-stories/epic-2-advanced/US-15.md` y en la matriz de trazabilidad, pero faltaba
en el backlog. La incorporación se registra en `DEC-PROD-10`.

### Epic 3: Cloud Convenience & Connectivity Flow (alcance abandonado)

Este epic es alcance abandonado, no trabajo pendiente. El producto entregado es de cliente y no
tiene backend, así que ninguna de sus historias ni tareas se ejecutará. La única excepción es
`TSK-3.5`, que se conserva como `latente` porque la vía hacia un OCR de servidor sigue abierta en
el código. La decisión está en `DEC-PROD-08`.

| id | tipo | título | prioridad | complejidad | estado | detalle canónico |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| US-10 | US | Códigos QR de cobro Bizum personalizados y plantillas dinámicas | Should | 5 | `descartado` | `docs/product/user-stories/epic-3-cloud/US-10.md` |
| US-11 | US | Sincronización cloud de amigos y grupos frecuentes | Should | 3 | `descartado` | `docs/product/user-stories/epic-3-cloud/US-11.md` |
| US-12 | US | Respaldo cloud de tickets e historial de eventos | Should | 5 | `descartado` | `docs/product/user-stories/epic-3-cloud/US-12.md` |
| TSK-3.1 | TSK | Configuración del SDK de Firebase y variables de entorno | — | 2 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.1.md` |
| TSK-3.2 | TSK | Flujo de autenticación opcional de Firebase | — | 3 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.2.md` |
| TSK-3.3 | TSK | Sincronización en nube de contactos y grupos frecuentes | — | 3 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.3.md` |
| TSK-3.4 | TSK | Administrador de sincronización bidireccional (Sync Manager) | — | 5 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.4.md` |
| TSK-3.5 | TSK | Función serverless de OCR nube (Firebase Cloud Function) | — | 5 | `latente` | `docs/product/user-stories/epic-3-cloud/TSK-3.5.md` |
| TSK-3.6 | TSK | Generador de enlace de pago Bizum y plantilla de mensajes | — | 3 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.6.md` |
| TSK-3.7 | TSK | Reglas de seguridad de base de datos y despliegue de Firebase | — | 2 | `descartado` | `docs/product/user-stories/epic-3-cloud/TSK-3.7.md` |

### Epic 4: Analytics and Paid Features

El epic 4 mezcla alcance entregado, parcial, latente y descartado. Lo entregado es la exportación
local; lo parcial son las tareas cuya base local existe pero cuyo alcance premium no está cubierto;
lo latente es el análisis EXIF, porque la vía hacia la nube está cerrada pero el procesamiento
local existe; y lo descartado es lo que dependía del epic 3.

| id | tipo | título | prioridad | complejidad | estado | detalle canónico |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| US-13 | US | Exportación financiera avanzada (Excel/PDF) | Could | 3 | `parcial` | `docs/product/user-stories/epic-4-analytics/US-13.md` |
| US-14 | US | Mapa de restaurantes y analíticas de consumo | Could | 5 | `descartado` | `docs/product/user-stories/epic-4-analytics/US-14.md` |
| TSK-4.1 | TSK | Exportación de reportes de ticket a PDF corporativo | — | 3 | `parcial` | `docs/product/user-stories/epic-4-analytics/TSK-4.1.md` |
| TSK-4.2 | TSK | Exportador de histórico mensual a hoja de cálculo Excel | — | 2 | `descartado` | `docs/product/user-stories/epic-4-analytics/TSK-4.2.md` |
| TSK-4.3 | TSK | Extractor y filtro de geolocalización de imágenes (EXIF Parser) | — | 3 | `latente` | `docs/product/user-stories/epic-4-analytics/TSK-4.3.md` |
| TSK-4.4 | TSK | Vista de mapa interactivo de restaurantes | — | 4 | `parcial` | `docs/product/user-stories/epic-4-analytics/TSK-4.4.md` |
| TSK-4.5 | TSK | Panel de analíticas y gráficos de gasto colectivo | — | 3 | `parcial` | `docs/product/user-stories/epic-4-analytics/TSK-4.5.md` |

`TSK-4.1`, `TSK-4.4` y `TSK-4.5` quedan en `parcial` porque el producto entrega la exportación
local y las vistas de sesión, pero no el alcance premium que esas tareas describen. `TSK-4.2`
depende de `TSK-3.4` y `TSK-4.3` apunta a Firebase Cloud Functions: la primera queda `descartado`
con el epic 3 y la segunda se conserva como `latente` por el análisis EXIF local. `US-14` queda
`descartado` porque el mapa y las analíticas dependían del histórico en la nube.

### Resumen de estados por epic

| Epic | Elementos | `entregado` | `parcial` | `latente` | `descartado` |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Epic 1 — Core | 11 | 9 | 1 | 1 | 0 |
| Epic 2 — Advanced | 14 | 10 | 3 | 0 | 1 |
| Epic 3 — Cloud | 10 | 0 | 0 | 1 | 9 |
| Epic 4 — Analytics | 7 | 0 | 4 | 1 | 2 |
| **Total** | **42** | **19** | **8** | **3** | **12** |

### Propiedad del espacio de nombres TSK-x.y

Este backlog es el propietario canónico del espacio de nombres `TSK-x.y`. El documento
`docs/process/technical-plan.md` usa identificadores que colisionan con los de este backlog para su
propia lista de tareas, y esa colisión rompe la trazabilidad cruzada. Se registra y se resuelve en
`DEC-PROD-11`; la corrección de `docs/process/technical-plan.md` se aplica en la tarea T7 de
`docs/plan-reorganizacion.md` y queda fuera de este documento.

| Identificador | Significado en este backlog | Significado en `docs/process/technical-plan.md` | Resolución |
| :--- | :--- | :--- | :--- |
| `TSK-2.1` | Algoritmo de ajuste de céntimos (epic 2) | UI Framework | Prevalece la definición de este backlog |
| `TSK-3.1` | Configuración del SDK de Firebase (epic 3) | OCR Processing | Prevalece la definición de este backlog |
| `TSK-5.1` | No existe en ningún epic | Tarea de la «Task 5: Optional Auth & Cloud Synchronization» | Se retira; no pertenece a ningún epic |

## Decisiones

| id | fecha | decisión | contexto | alternativas | elección | motivo | estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-PROD-07` | 2026-09-22 | Conservar `TSK-3.5` y `TSK-1.5` como elementos `latente` dentro de un alcance mayoritariamente descartado | El epic 3 se abandona, pero el motor OCR `'server'` sigue declarado en el código sin servicio que lo atienda | Descartar también el OCR de servidor; marcarlo `latente` | `latente` | La vía de retorno hacia un OCR remoto de mayor precisión permanece abierta; `TSK-1.5` ramifica hacia esa misma API | `latente` |
| `DEC-PROD-08` | 2026-09-22 | Marcar el epic 3 como alcance abandonado y no como backlog pendiente | El epic 3 figuraba como trabajo pendiente, aunque el producto entregado es de cliente y no tiene backend | Mantenerlo como pendiente; marcarlo `descartado` | `descartado`, con `TSK-3.5` como excepción `latente` | No existe backend ni vía de retorno abierta para Firestore, Cloud Functions ni autenticación; presentarlo como pendiente infla el backlog real | `descartado` |
| `DEC-PROD-09` | 2026-09-22 | Separar la responsabilidad de este backlog y de `docs/product/user-stories/**` | Las 14 historias estaban duplicadas literalmente entre ambos y las copias ya divergían | Mantener la duplicación; declarar una única fuente canónica por hecho | El backlog es canónico para epics, identificadores, prioridad y estado; las historias lo son para narración, criterios de aceptación y definición de terminado | Una sola fuente por hecho elimina la divergencia y reduce el backlog a un registro consultable | `entregado` |
| `DEC-PROD-10` | 2026-09-22 | Incorporar `US-15` al epic 2 | La historia existía en `docs/product/user-stories/epic-2-advanced/US-15.md` y en la matriz de trazabilidad, pero faltaba en el backlog | Dejarla fuera; incorporarla al epic 2 | Incorporarla al epic 2 | La historia está entregada (selector de tema) y su ausencia rompía la correspondencia entre backlog, historias y trazabilidad | `entregado` |
| `DEC-PROD-11` | 2026-09-22 | Declarar este backlog como propietario canónico del espacio de nombres `TSK-x.y` y resolver la colisión con `docs/process/technical-plan.md` | `TSK-2.1` y `TSK-3.1` significan cosas distintas en cada documento, y `TSK-5.1` no pertenece a ningún epic | Mantener ambos espacios de nombres; ceder la propiedad al plan técnico; fijar la propiedad en el backlog | El backlog es el propietario; prevalece su definición y `TSK-5.1` se retira | El backlog es el registro de epics e identificadores, y el plan técnico no pertenece a ningún epic; la corrección de `docs/process/technical-plan.md` se aplica en la tarea T7 | `parcial` |

## Cómo verificar este documento

- [ ] `for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do grep -q "^$k:" docs/product/backlog.md && echo "OK: $k" || echo "FALLO: $k"; done` → ocho líneas `OK`
- [ ] `awk '/^```/{f=!f; next} !f && /^# /{print NR": "$0}' docs/product/backlog.md` → un H1 igual al campo `title`
- [ ] `for s in '## Resumen' '## Estado' '## Detalle' '## Decisiones' '## Cómo verificar este documento' '## Referencias'; do grep -qF "$s" docs/product/backlog.md && echo "OK: $s" || echo "FALLO: $s"; done` → seis líneas `OK`
- [ ] `grep -cE '^\| US-[0-9]' docs/product/backlog.md` → 15 filas de historia de usuario
- [ ] `grep -cE '^\| TSK-[0-9]' docs/product/backlog.md` → 27 filas de tarea técnica
- [ ] `grep -cE '\*\*Como\*\*|\*\*Quiero\*\*|\*\*Para\*\*' docs/product/backlog.md` → 0; sin narración duplicada
- [ ] `grep -cE '^#+ +Scenario|definition[[:space:]]+of[[:space:]]+done' docs/product/backlog.md` → 0; sin criterios de aceptación ni definición de terminado
- [ ] `grep -c 'US-15' docs/product/backlog.md` → al menos 1; la historia está incorporada
- [ ] `grep -rn 'src/' docs/product/backlog.md | grep -v 'frontend/src/'` → sin salida
- [ ] `grep -rniE 'previsto|se usará|está definido|planificado para|se implementará' docs/product/backlog.md` → sin salida
- [ ] `grep -o 'DEC-[0-9][0-9]' docs/product/backlog.md | sort -u | tr '\n' ' '` → `DEC-PROD-07 DEC-PROD-08 DEC-PROD-09 DEC-PROD-10 DEC-PROD-11`

## Referencias

- `docs/product/user-stories/` — detalle funcional canónico de historias y tareas
- `docs/product/prd.md` — funciones del producto `F-xx` y requisitos de negocio
- `docs/product/brief.md` — visión, problema y exclusiones de negocio
- `docs/process/technical-plan.md` — colisión de identificadores `TSK-x.y`, corregida en la tarea T7
- `docs/traceability/user-stories-traceability.md` — matriz de trazabilidad de las historias
- `docs/DOC-STANDARD.md` — estándar de escritura dual que gobierna este documento
- `docs/plan-reorganizacion.md` — diagnóstico y plan de la reorganización documental
