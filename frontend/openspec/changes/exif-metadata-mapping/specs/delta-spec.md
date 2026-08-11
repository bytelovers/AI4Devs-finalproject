# Delta Specification: Ticket.metadata EXIF Namespace

## 1. Contexto y Justificación
Implementar namespace `metadata.exif` en el modelo `Ticket` para permitir extracción y persistencia de **EXIF geolocalización** de tickets de restaurantes, cumpliendo **RGPD strict** (procesamiento local exclusivo, no subir GPS a cloud sin consentimiento explícito en TSK-4.3), y soportando futura escalabilidad a múltiples fuentes (OCR, Places) mediante namespaces tipados.

**Trazabilidad**
- US-14: Mapa de Restaurantes con geolocalización por EXIF
- PRD: F-03 Extracción Segura de Metadatos EXIF (líneas 148-153)
- TSK-4.3: Funciones `extractCoordinates`, `stripExifMetadata`

**Constraint crítica**
- Extracción de EXIF **SOLO en frontend/browser**: no backend, no cloud.
- Storage: EXIF se persiste en objeto `metadata.exif` plano (<200 bytes), no duplicado en `Ticket.image`.

---

## 2. Cambios Delta en el Modelo Ticket

### Archivo
`frontend/src/lib/types.ts`

### Delta (líneas objetivo)
Añadir interfaz `TicketMetadata` y extender interface `Ticket` con campo `metadata?: TicketMetadata`.

---
```typescript
interface RawExifResult {
  GPSLatitude?: number[];          // [degrees, minutes, seconds]
  GPSLongitude?: number[];         // [degrees, minutes, seconds]
  GPSLatitudeRef?: string;         // 'N'|'S'
  GPSLongitudeRef?: string;        // 'E'|'W'
  DateTimeOriginal?: string;       // 'YYYY:MM:DD HH:MM:SS'
  Make?: string;
  Model?: string;
  Orientation?: number;            // 0-8 (EXIF)
}

interface ExifNamespace {
  /** Coordenadas GPS decimales (nullable). */
  gps: { latitude: number; longitude: number } | null;
  /** Timestamp ISO de captura (nullable). */
  timestamp: string | null;
  /** Información de dispositivo (maker/model) si está presente. */
  device: { make?: string; model?: string } | null;
  /** Orientación de la imagen (0 = normal). */
  orientation: number | null;
}

interface TicketMetadata {
  exif?: ExifNamespace;  // Namespace EXIF
  // Futuro: ocr?: OcrMetadata; places?: PlacesMetadata;
}

export interface Ticket {
  // ... campos existentes ...
  image?: string; // data URL base64, existente
  metadata?: TicketMetadata; // ⬅️ nuevo campo OPCIONAL
}
```
---

## 3. Utilidades Públicas

### Archivo
`frontend/src/utils/exifHelper.ts`

### API Firmada (TypeScript)
```typescript
/**
 * Extrae metadatos EXIF desde una data URL de imagen.
 * Falls gracefully a valores nulos si EXIF no está disponible o error.
 * No modifica la data original.
 * @param dataUrl - Data URL JPEG base64
 * @returns Promesa con estructura lista para almacenar en Ticket.metadata.exif
 */
export async function extractExifFromImageDataUrl(
  dataUrl: string,
): Promise<ExifNamespace>;

/**
 * Convierte datos crudos EXIF a formato limpio ExifNamespace.
 * Mapea DMS (degrees/minutes/seconds) a decimal para lat/lon.
 */
export function mapRawExifToNamespace(
  exif: RawExifResult,
): ExifNamespace;

/**
 * Elimina metadatos sensibles (GPS, device info) de una imagen.
 * Producción: devuelve un Blob seguro; testing:orna formato string (dataUrl).
 * @param dataUrl - Imagen original
 * @param outFormat - 'blob' o 'image' (dataUrl) - default 'blob'
 * @returns Blob limpio RGPD-safe
 */
export async function stripExifMetadata(
  dataUrl: string,
  outFormat: 'blob' | 'image' = 'blob',
): Promise<Blob | string>;
```

### Comportamiento y Notas Técnicas
- **Librería por defecto**: `exifreader@^1.6.0` (TypeScript-friendly, soporta móvil).
  - Instalar vía: `pnpm add exifreader`
  - Fallo seguro: capturar error y devolver `{ gps: null, timestamp: null, device: null, orientation: null }`
- **Conversiones necesarias**:
  - DMS → Decimal para GPS usando `convertDMSToDecimal(latArray, latRef)` y `convertDMSToDecimal(lonArray, lonRef)`
  - Parseo de fecha EXIF en `DateTimeOriginal` a ISO string `timestamp`
- **Performance target**: Extracción <500ms en iPhone SE / Android medio-range.

---

## 4. Integración en Flujo de Usuario

### Punto de Inserción
`frontend/src/components/ticket/CameraScanFlow.tsx` (o equivalente actual según CodeGraph) en la ruta `handleCapture`

### Delta en Código (pseudocode para spec)
```typescript
import { extractExifFromImageDataUrl } from '@/utils/exifHelper';

// Después de capturar la imagen como dataUrl pero ANTES de OCR/tesseract
const handleCapture = async (dataUrl: string) => {
  // 1º Extraer EXIF (preservar timestamp/geolocalización original)
  const exif = await extractExifFromImageDataUrl(dataUrl);

  // 2º Preprocesado imagen para OCR/tesseract (puede cambiar orientación, preservar EXIF)
  const processedImage = await preprocessReceiptImage(dataUrl);

  // 3º Crear/actualizar ticket con metadata incrustada
  const newTicket: Ticket = {
    ...baseTicket,
    image: processedImage,
    metadata: {
      exif, // ⬅️ nuevo campo
      ocr: {
        engine: preferredEngine as 'tesseract' | 'florence2' | 'tesseract-ner',
        confidence: result.confidence,
        scannedAt: new Date().toISOString(),
      },
    },
  };

  addTicket(newTicket); // Zustand
};
```

### Requisitos de UI/UX
- **No se fuerza UI**: Si `ticket.metadata?.exif?.gps` existe, mostrar en algún futuro componente (ej: `TicketGpsMapPin`).
- **No romper flujo actual**: componentes existentes ignoran `metadata` nulo.

---

## 5. Suite de Tests TDD (Vitest + React Testing Library)

### Archivo
`frontend/src/utils/exifHelper.test.ts`

### Tests Bite-Sized
- **Test 1**: Extraer EXIF de imagen sin EXIF → devuelve objeto con todos valores nulos **falla inicialmente**
- **Test 2**: Extraer EXIF de fixture mock con GPS → devuelve `{ gps: { latitude: ..., longitude: ... }, ... }` **pasa**
- **Test 3**: stripExifMetadata en fixture con GPS → devuelve Blob **sin GPS en propiedades**
- **Coverage mínima**: 100% líneas en `exifHelper.ts`, 100% branches (with/without EXIF)

### Fixtures
- `mockImageWithGps.dataUrl` (fixture 500x500 con GPS en metadata real)
- `mockImageWithoutExif.dataUrl` (JPEG plano, sin metadata)

### Mocks
```typescript
vi.mock('exifreader');
import * as exifreader from 'exifreader';

beforeEach(() => {
  exifreader.load.mockImplementation(async (_) => mockRawExif);
});
```

### Criterios Verdes TDD
| Iteración | Estado | Descripción |
|---|---|---|
| Red | ❌ | Tests importan helper y fallan al importar (mock vacío) |
| Red | ✅ | Tests y mock setup compilan pero lib no existe |
| Green | ✅ | `exifHelper.ts` implementado y tests pasan con fixture con GPS |
| Green | ✅ | Casos sin EXIF devuelven `{...null}` y tests pasan |
| Green | ✅ | `stripExifMetadata()` produce Blob limpio; fixtures mock pasan |

---

## 6. Persistencia y Migraciones (Zustand store)

### Comportamiento Existente
```typescript // Zustand persist con localStorage
persist(middleware, {
  name: 'spliteat-app-v1', // clave localStorage existente
  partialize: (state) => ({ tickets: state.tickets }), // snapshot partial
});
```

### Delta
- `metadata` es campo **opcional** → tickets sin metadata sobreviven a migración.
- No modifica el array `tickets` actual → no requiere `schemaVersion` bump.
- Serialización: `JSON.stringify(Ticket)` incluye `metadata?: TicketMetadata` sin breaking change.

---

## 7. Riesgos Técnicos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Size localStorage (1k+ tickets)** | Riesgo quota | UI debe mostrar warning al 80% quota. Clean-up automático en desinstalar app hooked a Zustand. |
| **Soporte navegadores antiguos (iOS <15)** | EXIF falla | Feature detection: si `exifreader` fails, fallo silencioso + log dev. Muestra metadata solo si existe. |
| **Tamaño bloated de EXIF ( Démasiados campos)** | storage / red rendimiento | Soportar solo campos citados arriba. Opción `orientation` opcional para simplificar futuro. |
| **Privacidad RGPD progresiva** | Legal | No solicitar permisos geolocation si EXIF no está presente en imagen. UI no fuerza acceso a location device. |
| **Costo de extracción alto (>500ms)** | UX | Procesamiento en Web Worker. Optimizar imagen primera (resize a 1920px) antes de EXIF extraction. |

---

## 8. Requerimientos Funcionales vs AC (Criterios de Aceptación)

| ID | Requerimiento (delta spec.md) | AC Relacionado | Pasos de Validación |
|---|---|---|---|
| FR-1 | EXIF extraído **SOLO** en frontend | US-14, PRD 148-153 | Test unitario: verificar `extractExifFromImageDataUrl` nunca hace llamadas HTTP |
| FR-2 | Interface `ExifNamespace` tiende tipos seguros | Spec §2 | TypeScript compila sin errors |
| FR-3 | Persistencia EXIF en `Ticket.metadata.exif` | Zustand persistencia | addTicket + localStorage.read/write verifican persisted array |
| FR-4 | RGPD stripping via `stripExifMetadata()` | TSK-4.3 | Test verifica Blob resultante no contiene GPS/device info |
| FR-5 | Tests fallan en Red → Green TDD | TDD contrato | Repo CI: Vitest red → green en PR |
| FR-6 | Backwards compatible con tickets antiguos | - | Ticket existente sin `metadata` se lee sin errors |

---

## 9. Supuestos y Decisiones de Diseño

- **Acepción de fallo**: Si EXIF no está disponible, `metadata.exif` es `null`, no `undefined`, para claridad semántica.
- **Librería EXIF**: Se adopta `exifreader@^1.6.0` por suporte TypeScript y móvil. Si falla en entorno productivo, substituible por alternativa ligera (ej: `exif-js@^2.0.0`).
- **No backend inicialmente**: Todos cálculos, extracción y persistencia ocurren en localStorage + frontend.
- **Plugin Zustand**: Se asume compatibilidad con `persist` middleware; no se modifica comportamiento.

---

## 10. Entregables Esperados (artefactos generados)

1. Source Code:
   - `src/lib/types.ts` → delta de interface `Ticket` y `TicketMetadata`
   - `src/utils/exifHelper.ts` → implementación + JSDoc
   - `src/utils/exifHelper.test.ts` → suite Vitest 100% coverage
   - fixtures `mockImageWithGps.dataUrl`, `mockImageWithoutExif.dataUrl`
2. Testing assets:
   - Snapshot tests failure-to-green en CI
3. Documentación delta:
   - Este archivo `delta-spec.md` asegurado en openspec artefactory
   - README sufijo explicativo en PR

---

## 11. Historial de Cambios

- **v1 (2026-07-26)**: Creación inicial. Espec compliant con PRD, US-14, TSK-4.3, RGPD stricto y TDD estricto.

---

## 12. Anexos y Referencias

- **PRD**: `docs/prd/PRD.md` - F-03 Extracción Segura de Metadatos EXIF (líneas 148-153)
- **TSK-4.3**: `docs/user-stories/epic-4-analytics/TSK-4.3.md` - RGPD stripping de metadatos
- **CodeGraph**: Todos consumidores `Ticket` verificados via índice `.codegraph/`
- **Testing**: Vitest configurado como suite principal para React + Zustand (TDD estricto).