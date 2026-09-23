---
doc_id: docs/index
title: Documentación del proyecto SplitEat
domain: governance
audience: [human, agent]
status: mixto
source_of_truth_for:
  - índice de la documentación del proyecto
  - estado documental de cada dominio
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Documentación del proyecto SplitEat

## Resumen

SplitEat es una aplicación de cliente sin backend: una PWA que digitaliza tickets de restaurante y
reparte la cuenta, con OCR ejecutado en el dispositivo y persistencia local. Esta documentación es
la puerta de entrada y está organizada en **siete dominios**; cada documento declara en su
frontmatter qué estado tiene su contenido.

**Advertencia necesaria antes de leer:** parte de esta documentación describe alcance
**planificado y no entregado** (Firebase, Firestore, Dexie, OCR en la nube). El estado de cada
documento está declarado con el vocabulario único del estándar, así que ninguna afirmación debería
leerse como vigente sin comprobar antes su campo `status`.

## Estado

| Documento | Dominio | Estado | Qué cubre | Tarea |
| :--- | :--- | :--- | :--- | :--- |
| `product/brief.md` | Producto | `mixto` | Brief del producto | T2 |
| `product/prd.md` | Producto | `mixto` | Requisitos: funciones y alcance | T2 |
| `product/backlog.md` | Producto | `mixto` | Epics, historias y tareas técnicas | T2 |
| `product/user-stories/**` (42) | Producto | `mixto` | Historias de usuario y tareas; recuento 19/8/3/12 | T2 |
| `architecture/overview.md` | Arquitectura | `entregado` | Arquitectura del sistema (C4) | T3 |
| `architecture/stack.md` | Arquitectura | `entregado` | Stack tecnológico | T3 |
| `architecture/decisions.md` | Arquitectura | `entregado` | Registro de decisiones | T3 |
| `data/local-model.md` | Datos | `entregado` | Base de datos del cliente, con `permanencia: temporal` | T4 |
| `data/scope-evolution.md` | Datos | `mixto` | Evolución del alcance de datos y diagramas históricos | T4 |
| `integrations/contracts.md` | Integraciones | `mixto` | Contratos de integración | T5 |
| `quality/testing-strategy.md` | Calidad | `entregado` | Estrategia de pruebas real; E2E, a11y y cobertura quedan fuera de alcance | T6 |
| `quality/judgment-report.md` | Calidad | `mixto` | Reporte de juicio del 2026-06-07, con nota de estado que invalida su veredicto | T6 |
| `process/technical-plan.md` | Proceso | `mixto` | Plan técnico; fases renombradas a `PLAN-x` y colisión TSK resuelta | T7 |
| `process/delivery-and-branching.md` | Proceso | `mixto` | Modelo real de ramas y los cinco workflows | T7 |
| `process/ai-workflow.md` | Proceso | `mixto` | Workflow asistido por IA, con casos reales de error | T7 |
| `traceability/user-stories-traceability.md` | Trazabilidad | `mixto` | Matriz de trazabilidad, con el límite de la trazabilidad por commit | T8 |
| `traceability/evidence.md` | Trazabilidad | `mixto` | Métricas reproducibles y el diagrama de estado actual (D3) | T8 |
| `DOC-STANDARD.md` | Gobernanza | `entregado` | Estándar de escritura dual | — |
| `plan-reorganizacion.md` | Gobernanza | `entregado` | Plan de reorganización documental | — |

El estado `mixto` significa que el documento **trata** más de un estado a la vez: un registro como
el backlog, un historial de evolución como el de datos, o un informe con parte histórica. Un
documento `entregado` puede tener filas `descartado` o `latente` en su apartado `## Estado` sin
dejar de serlo: esas filas declaran el estado de lo que describe, no el suyo.

**No todo documento lleva el mismo esqueleto**, y conviene saberlo antes de buscarlo. Los
**documentos de dominio** —la puerta de entrada de cada dominio— llevan las seis secciones. Los
**registros** —las 42 historias y tareas de `product/user-stories/**` y el reporte de juicio
`quality/judgment-report.md`— llevan frontmatter y conservan su estructura propia. Las **notas de
ubicación** de `backend/` y `db/` son breves por diseño. El detalle de los tres tipos está en
`/docs/DOC-STANDARD.md`.

### Alcance del producto en una línea

| Categoría | Qué incluye |
| :--- | :--- |
| `entregado` | PWA de cliente, OCR en dispositivo (Tesseract + Florence-2), persistencia en `localStorage`, asignación y división de cuentas, exportación local |
| `latente` | OCR en servidor: el motor `'server'` sigue declarado en el código, sin contraparte de servicio |
| `descartado` | Firebase Auth, Firestore, Cloud Functions, Firebase Hosting, Dexie sobre IndexedDB |

## Detalle

### Orden de lectura recomendado

1. Este índice.
2. `DOC-STANDARD.md` — cómo están escritos los documentos y cómo interpretarlos.
3. `product/prd.md` — qué es el producto y qué se entregó.
4. `architecture/overview.md` — cómo está construido.
5. `architecture/decisions.md` — por qué está construido así.
6. El resto de dominios, según el interés.

### Qué contiene cada dominio

| Dominio | Carpeta | Propósito |
| :--- | :--- | :--- |
| Producto y alcance | `product/` | Qué es SplitEat, qué funciones tiene y qué se planificó frente a qué se entregó |
| Arquitectura | `architecture/` | Cómo está construido el sistema y por qué se eligió cada tecnología |
| Datos y persistencia | `data/` | Qué se guarda, dónde y con qué garantías |
| Integraciones | `integrations/` | Qué servicios externos existen realmente |
| Calidad | `quality/` | Cómo se verifica que el producto funciona |
| Proceso y entrega | `process/` | Cómo se planificó, se construyó y se desplegó |
| Trazabilidad y evidencia | `traceability/` | Qué historia se corresponde con qué código y qué evidencia lo respalda |

### Gobernanza

| Documento | Para qué sirve |
| :--- | :--- |
| `DOC-STANDARD.md` | Estándar de escritura dual. Define frontmatter, esqueleto, vocabulario de estado y plantillas |
| `plan-reorganizacion.md` | Plan de la reorganización documental en curso, con su diagnóstico y sus tareas |

### Fuera de esta documentación

`openspec/` **no forma parte** de este conjunto y se mantiene exactamente como está. Contiene los
artefactos de cambio del proceso de desarrollo y tiene su propio ciclo de vida.

## Decisiones

Este índice toma una sola decisión propia. Las que gobiernan **cómo se escribe** la documentación
—el vocabulario de estado, el esqueleto de seis secciones, la referencia por `doc_id`, el
acompañamiento textual de los diagramas y la exclusión de `openspec/`— son del estándar y viven en
`/docs/DOC-STANDARD.md` como `DEC-DOC-01`…`DEC-DOC-05`. Este documento las cita y **no las
redefine**: si se repitieran aquí, la misma decisión quedaría escrita en dos sitios y empezaría a
divergir.

| ID | Decisión | Motivo |
| :--- | :--- | :--- |
| `DEC-IDX-01` | Este índice es la **única puerta de entrada** y organiza la documentación en **siete dominios** | Un lector necesita un punto de partida; siete dominios de documentos sueltos, sin índice, dejan la navegación sin entrada |

## Cómo verificar este documento

```bash
# 1. Todo documento de docs/ tiene frontmatter con las claves obligatorias
for f in $(git ls-files 'docs/**/*.md'); do
  for k in doc_id title domain audience status last_verified; do
    grep -q "^$k:" "$f" || echo "SIN $k: $f"
  done
done
```

```bash
# 2. Todos los documentos listados en la tabla de estado existen
for p in product/brief.md product/prd.md product/backlog.md \
         architecture/overview.md architecture/stack.md architecture/decisions.md \
         data/local-model.md data/scope-evolution.md integrations/contracts.md \
         quality/testing-strategy.md quality/judgment-report.md \
         process/technical-plan.md process/delivery-and-branching.md process/ai-workflow.md \
         traceability/user-stories-traceability.md traceability/evidence.md \
         DOC-STANDARD.md plan-reorganizacion.md; do
  test -f "docs/$p" || echo "FALTA: docs/$p"
done
```

```bash
# 3. No quedan carpetas de la taxonomía anterior
for d in prd db api qa tech-lead user-stories; do
  test -d "docs/$d" && echo "TAXONOMIA ANTIGUA: docs/$d"
done
```

## Referencias

- `docs/DOC-STANDARD.md`
- `docs/plan-reorganizacion.md`
- `docs/architecture/decisions.md`
- `docs/traceability/evidence.md`
- `AGENTS.md`

### Documentos de la raíz

No forman parte del conjunto de `docs/`, pero completan la documentación del proyecto y se enlazan
desde aquí para que el índice sea la puerta de entrada de todo:

- `/readme.md` — ficha del proyecto, producto, arquitectura, modelo de datos, historias y PRs
- `/ROUTING_FEASIBILITY.md` — informe de viabilidad del enrutado por URL, cuya recomendación se adoptó
- `/prompts.md` — registro de las peticiones que originaron la documentación
- `/AGENTS.md` — registro de skills del arnés de trabajo
