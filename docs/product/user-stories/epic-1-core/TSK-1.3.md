---
doc_id: product/user-stories/TSK-1.3
title: 'TSK-1.3: Servicio de OCR Offline (Tesseract.js Local WASM)'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-1.3
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-1.3: Servicio de OCR Offline (Tesseract.js Local WASM)

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/services/ocr/TesseractService.ts` | `frontend/src/lib/scan/tesseract-engine.ts` |
> | `frontend/src/services/ocr/TesseractService.test.ts` | `Ninguna: el árbol entregado no incluye un test con ese nombre` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-01: Escaneo OCR Inteligente de Tickets](/docs/product/user-stories/epic-1-core/US-01.md)
- **Épica:** Epic 1: Core Digitalization & Basic Assignment Flow
- **Capa:** Frontend (OCR / Worker)
- **Complejidad:** 5 SP
- **Dependencias:** TSK-1.1

## 1. Descripción de la Tarea
Configurar la carga del motor OCR en el navegador de manera local y en diferido (lazy loading). Debe descargar los binarios WebAssembly de Tesseract.js únicamente cuando el usuario decida realizar un escaneo offline, y guardar los pesos en la memoria caché del navegador.

## 2. Detalles de Implementación
1. **Controlador del Worker:**
   * Crear `frontend/src/services/ocr/TesseractService.ts`.
   * Implementar función `initializeWorker(locale: string): Promise<Tesseract.Worker>` de forma perezosa.
   * Configurar el worker de Tesseract para usar rutas locales de assets de entrenamiento (ej: español/inglés descargados en `public/tessdata/`) o configurar CDN alternativo persistente con cabeceras de caché apropiadas.
2. **Método de Reconocimiento:**
   * Implementar `recognizeImage(imageFile: File | Blob): Promise<string>` que reciba el binario de la imagen y devuelva la cadena de texto plano resultante.
   * Manejar eventos de progreso del worker (`progress` de 0 a 1) para poder notificar visualmente al usuario.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/services/ocr/TesseractService.test.ts` (usando mocks del worker si es necesario) que compruebe:
  * El worker no se inicializa al cargar la app, solo tras invocar explícitamente el escaneo.
  * Si la imagen es un blob nulo o corrupto, el servicio retorna un error tipado `INVALID_IMAGE_PAYLOAD`.
  * Integración con service worker para caching de binarios WASM verificada en modo offline del navegador.
