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
 * Elimina los metadatos EXIF sensibles de una imagen.
 *
 * ⚠️ NO IMPLEMENTADO. Este cambio (exif-metadata-mapping) solo construye la
 * infraestructura de extracción y transporte `{dataUrl, exif}` sin
 * persistencia. El strip real de EXIF queda fuera de alcance (ver design.md,
 * decisión D3/D5) y esta función NO debe invocarse en ningún path de
 * producción. Implementar junto con US-14 (mapa de tickets) si se requiere.
 */
export async function stripExifMetadata(
  _dataUrl: string,
  _outFormat: 'blob' | 'image' = 'blob',
): Promise<Blob | string> {
  throw new Error(
    'stripExifMetadata is NOT implemented (exif-metadata-mapping design, D3)',
  );
}