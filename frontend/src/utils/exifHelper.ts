/**
 * EXIF Helper Utilities
 *
 * EXIF extraction from the ORIGINAL File (pre-compress) with `exifr`
 * (dynamic import — outside the initial bundle, D4) and mapping to the
 * `ExifNamespace` UI contract. `exifr` converts GPS DMS to signed decimal
 * internally, so `mapRawExifToNamespace` consumes the root-level contract
 * (D8). Failure never throws: the capture flow must not break on missing or
 * corrupt EXIF (D5).
 *
 * @see ../openspec/changes/exif-metadata-mapping/design.md
 */

import { RawExifResult, ExifNamespace } from '@/lib/types';

/** Namespace vacío devuelto ante fallo de extracción (D5: fallback nulo). */
const EMPTY_NAMESPACE: ExifNamespace = {
  gps: null,
  timestamp: null,
  device: null,
  orientation: null,
};

/**
 * Normaliza `DateTimeOriginal` (Date de exifr `reviveValues` o string EXIF
 * 'YYYY:MM:DD HH:MM:SS') a un timestamp ISO string (D7). Devuelve null si no
 * puede interpretarse.
 */
function toIsoTimestamp(value: string | Date): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value !== 'string') return null;
  // Formato EXIF: 'YYYY:MM:DD HH:MM:SS' (sin zona horaria; se asume UTC).
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(
    value.trim()
  );
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
}

/**
 * Mapea el contrato raíz `RawExifResult` (D8) a `ExifNamespace`.
 *
 * El GPS ya viene en decimal signado (exifr aplica ConvertDMSToDD
 * internamente); aquí solo se aplana a `{ latitude, longitude }` o null si
 * falta cualquiera de las dos coordenadas.
 */
export function mapRawExifToNamespace(exif: RawExifResult): ExifNamespace {
  const gps =
    exif.latitude != null && exif.longitude != null
      ? { latitude: exif.latitude, longitude: exif.longitude }
      : null;

  return {
    gps,
    timestamp:
      exif.DateTimeOriginal != null
        ? toIsoTimestamp(exif.DateTimeOriginal)
        : null,
    device:
      exif.Make || exif.Model
        ? { make: exif.Make ?? undefined, model: exif.Model ?? undefined }
        : null,
    orientation: exif.Orientation ?? null,
  };
}

/**
 * Extrae EXIF del File ORIGINAL (pre-compress) usando exifr con import
 * dinámico (REQ-EXIF-01/05). Es el ÚNICO punto de adaptación hacia el
 * contrato raíz lat/lon (D8).
 *
 * Nota de verificación (apply): exifr 7.x en salida merged (default) expone
 * `latitude`/`longitude` a nivel raíz, no anidados en `raw.gps`. Se lee la
 * raíz primero y se tolera `raw.gps` como fallback (forma `mergeOutput:false`
 * o versiones futuras). Con `translateValues: false`, `Orientation` vuelve
 * como entero EXIF (1-8), cumpliendo el contrato `orientation: number`.
 *
 * Fallback nulo: si el import dinámico falla o `exifr.parse` rechaza, devuelve
 * un `ExifNamespace` vacío — NUNCA lanza (REQ-EXIF-04, D5).
 */
export async function extractExifFromFile(file: File): Promise<ExifNamespace> {
  try {
    const { default: exifr } = await import('exifr');
    const raw = await exifr.parse(file, {
      tiff: true,
      gps: true,
      translateValues: false,
      ifd0: { pick: ['Make', 'Model', 'DateTimeOriginal', 'Orientation'] },
    });
    return mapRawExifToNamespace({
      latitude: raw?.latitude ?? raw?.gps?.latitude,
      longitude: raw?.longitude ?? raw?.gps?.longitude,
      DateTimeOriginal: raw?.DateTimeOriginal,
      Make: raw?.Make,
      Model: raw?.Model,
      Orientation: raw?.Orientation,
    });
  } catch {
    return EMPTY_NAMESPACE;
  }
}

/**
 * Error lanzado por `stripExifMetadata`: la función está deliberadamente SIN
 * implementar (fail-loud, ver design.md decisión D3). Se lanza un error tipado
 * para que cualquier caller pueda detectarlo con `instanceof` y nunca confunda
 * un "strip no implementado" con un fallo de procesamiento real.
 */
export class ExifStripNotImplementedError extends Error {
  constructor() {
    super(
      'stripExifMetadata is NOT implemented: calling it would silently risk ' +
        'uploading EXIF (GPS/device) without real stripping (RGPD). ' +
        'See openspec change exif-metadata-mapping design D3; implement it ' +
        'together with US-14 (ticket map) before any cloud upload path.',
    );
    this.name = 'ExifStripNotImplementedError';
    // Establecer prototype explícito para que instanceof funcione tras
    // transpilación a ES5 (target del proyecto).
    Object.setPrototypeOf(this, ExifStripNotImplementedError.prototype);
  }
}

/**
 * Elimina los metadatos EXIF sensibles de una imagen.
 *
 * ⚠️ NO IMPLEMENTADO (fail-loud). Esta función existe SOLO para preservar la
 * integridad de la API pública y señalar de forma inequívoca que el strip real
 * de EXIF queda fuera del alcance de este cambio (design.md, D3).
 *
 * RESTRICCIÓN: nunca debe invocarse en un path de producción. Si se llama,
 * lanza `ExifStripNotImplementedError` en lugar de devolver un resultado
 * falso: devolver la imagen "como si estuviera limpia" podría subir GPS y
 * datos de dispositivo a cloud sin consentimiento (violación RGPD silenciosa).
 * Implementar junto con US-14 (mapa de tickets) cuando se requiera.
 *
 * @throws {ExifStripNotImplementedError} siempre que se invoca.
 */
export async function stripExifMetadata(
  _dataUrl: string,
  _outFormat: 'blob' | 'image' = 'blob',
): Promise<Blob | string> {
  throw new ExifStripNotImplementedError();
}
