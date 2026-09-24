---
doc_id: backend/readme
title: Carpeta backend (vestigial)
domain: governance
audience: [human, agent]
status: descartado
source_of_truth_for:
  - motivo por el que existe la carpeta backend y por qué está vacía
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Carpeta `backend` (vestigial)

## Resumen

Esta carpeta existe desde el **2026-06-07** y **nunca contuvo código**. Se conserva como registro
de una capa que se planificó y se descartó: el producto entregado es una PWA de cliente, sin
backend. No hay que implementar nada aquí ni buscar aquí lógica de negocio.

## Detalle

| Hecho | Valor |
| :--- | :--- |
| Contenido real | `.keep` y esta nota de ubicación |
| Commits que la han tocado, en todas las ramas | **1** (`ad7adc2`, 2026-06-07) |
| Archivos que alguna vez existieron dentro | **1** (`.keep`) |
| Estado | `descartado` |
| Referencias desde el build o la CI | Ninguna |

**Qué se planificó aquí.** Funciones serverless en Firebase Functions, OCR en la nube con Google
Cloud Vision, sincronización con Cloud Firestore, generación de códigos Bizum y un `SyncManager`
que coordinara el almacenamiento local con el remoto. La documentación llegó a describir un
endpoint `POST /api/v1/ocr` y unas reglas de seguridad en `firestore.rules`.

**Por qué se descarta.** El producto se resolvió como aplicación de cliente: el OCR se ejecuta en
el dispositivo con Tesseract y Florence-2, y la persistencia es `localStorage` mediante Zustand
persist. Sin servidor no hay sincronización, ni cuentas, ni OCR remoto. La capa de datos en la nube
queda sin destino, y con ella esta carpeta.

**Qué sobrevive del razonamiento.** Dos elementos conservan vía de retorno y no son `descartado`
sino `latente`: el motor OCR `'server'`, que sigue declarado en el código
(`frontend/src/lib/types.ts`, `frontend/src/workers/ocr.worker.ts`) sin contraparte de servicio, y
las tareas `TSK-1.5` y `TSK-3.5`, que dependían de él.

**Verificación.**

```bash
git log --all --oneline -- backend/          # un único commit
git log --all --pretty=format: --name-only --diff-filter=A -- backend/ | sort -u   # solo .keep
grep -rn 'backend/' .github/workflows/ frontend/package.json    # sin salida
```

## Referencias

- `docs/data/scope-evolution.md` — evolución del alcance de la capa de datos
- `docs/architecture/decisions.md` — decisiones de arquitectura y alternativas descartadas
- `docs/product/prd.md` — funciones F-12…F-14, en alcance evolutivo descartado
- `docs/README.md` — índice de la documentación del proyecto
