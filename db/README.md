---
doc_id: db/readme
title: Carpeta db (vestigial)
domain: governance
audience: [human, agent]
status: descartado
source_of_truth_for:
  - motivo por el que existe la carpeta db y por qué está vacía
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Carpeta `db` (vestigial)

## Resumen

Esta carpeta existe desde el **2026-06-07** y **nunca contuvo código**. Se conserva como registro
de una capa que se planificó y se descartó: el producto entregado guarda sus datos en el navegador,
sin base de datos en la nube. El modelo de datos vigente se documenta en
`docs/data/local-model.md`.

## Detalle

| Hecho | Valor |
| :--- | :--- |
| Contenido real | `.keep` y esta nota de ubicación |
| Commits que la han tocado, en todas las ramas | **1** (`ad7adc2`, 2026-06-07) |
| Archivos que alguna vez existieron dentro | **1** (`.keep`) |
| Estado | `descartado` |
| Referencias desde el build o la CI | Ninguna |

**Qué se planificó aquí.** Los scripts de configuración de IndexedDB, las reglas de seguridad de
Firestore (`firestore.rules`) y los esquemas de datos de la capa local y de la nube. La
documentación llegó a describir un esquema de Firestore con colecciones anidadas y una estrategia
de sincronización con resolución de conflictos por *last-write-wins*.

**Por qué se descarta.** La persistencia entregada es `localStorage` mediante Zustand persist. El
paquete `dexie` sigue declarado en `frontend/package.json` pero **no se importa en ningún sitio**,
y `firestore.rules` nunca existió. Sin capa de nube no hay reglas que escribir ni esquemas que
migrar.

**Qué sobrevive del razonamiento.** La mitigación frente a la pérdida de datos del navegador: el
**backup JSON** del historial local, que sí está entregado como función F-11. Es lo que queda del
problema que la sincronización en la nube venía a resolver.

**Verificación.**

```bash
git log --all --oneline -- db/               # un único commit
ls -a db/                                    # solo .keep
test -f firestore.rules && echo existe || echo "no existe"
grep -rn "from 'dexie'" frontend/src | wc -l # 0 imports
```

## Referencias

- `docs/data/local-model.md` — modelo de datos entregado
- `docs/data/scope-evolution.md` — evolución del alcance de la capa de datos
- `docs/architecture/decisions.md` — decisiones de arquitectura y alternativas descartadas
- `docs/README.md` — índice de la documentación del proyecto
