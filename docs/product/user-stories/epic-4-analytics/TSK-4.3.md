---
doc_id: product/user-stories/TSK-4.3
title: 'TSK-4.3: Extractor y Filtro de Geolocalización de Imágenes (EXIF Parser)'
domain: product
audience: [human, agent]
status: latente
source_of_truth_for:
  - detalle técnico de TSK-4.3
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-4.3: Extractor y Filtro de Geolocalización de Imágenes (EXIF Parser)


- **Historia de Usuario Relacionada:** [US-14: Mapa de Restaurantes y Analíticas de Consumo (EXIF Geolocalización)](/docs/product/user-stories/epic-4-analytics/US-14.md)
- **Épica:** Epic 4: Analytics and Paid Features
- **Capa:** Frontend (Security / Processing)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.5, TSK-3.5

## 1. Descripción de la Tarea
Implementar un analizador de metadatos de imágenes que extraiga la ubicación (coordenadas GPS) y la fecha de captura a partir de la información EXIF integrada de la foto del ticket tomada con la cámara del dispositivo móvil. **Es fundamental para el cumplimiento del RGPD eliminar estos metadatos del binario de la imagen antes de subirla a la nube para proteger la privacidad del usuario.**

## 2. Detalles de Implementación
1. **Extracción y Limpieza Local:**
   * Instalar `exifreader` o una librería de lectura EXIF ligera compatible con navegadores móviles.
   * Crear `frontend/src/utils/exifHelper.ts`.
   * Implementar `extractCoordinates(imageFile: File): Promise<{ latitude: number, longitude: number } | null>`.
   * Implementar `stripExifMetadata(imageFile: File): Promise<Blob>` para reconstruir la imagen en un Canvas nuevo o limpiar los bytes EXIF antes de realizar el envío a Firebase Cloud Functions para el OCR.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/utils/exifHelper.test.ts` que valide contra imágenes controladas:
  * Extrae correctamente coordenadas GPS reales latitud/longitud de fotos de prueba.
  * El método `stripExifMetadata` elimina de forma efectiva los bloques EXIF del binario de salida, devolviendo una imagen limpia donde la re-lectura de metanálisis EXIF resulta vacía.
