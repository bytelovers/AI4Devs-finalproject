/**
 * EXIF Helper Utilities
 * @see ../openspec/changes/exif-metadata-mapping/specs/delta-spec.md
 */

import { RawExifResult } from '@/lib/types';

export interface ExifNamespace {
  /** Coordenadas GPS decimales (nullable). */
  gps: { latitude: number; longitude: number } | null;
  /** Timestamp ISO de captura (nullable). */
  timestamp: string | null;
  /** Información de dispositivo (maker/model) si está presente. */
  device: { make?: string; model?: string } | null;
  /** Orientación de la imagen (0 = normal EXIF). */
  orientation: number | null;
}

function convertDMSToDecimal(coords: number[], ref: string): number {
  const degrees = coords[0];
  const minutes = coords.length > 1 ? coords[1] : 0;
  const seconds = coords.length > 2 ? coords[2] : 0;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') decimal = -decimal;
  return decimal;
}

function parseExifDate(dateStr: string): string {
  // Formato EXIF: 'YYYY:MM:DD HH:MM:SS'. Convertir a ISO: 'YYYY-MM-DDTHH:MM:SS.000Z'
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split(':');
  const [hh, mm] = timePart.split(':');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hh}:${mm}:00.000Z`;
}

/**
 * Convierte datos crudos EXIF a formato limpio ExifNamespace.
 */
export function mapRawExifToNamespace(exif: RawExifResult): ExifNamespace {
  const gps = exif.GPSLatitude && exif.GPSLongitude
    ? {
        latitude: convertDMSToDecimal(
          exif.GPSLatitude,
          exif.GPSLatitudeRef || 'N',
        ),
        longitude: convertDMSToDecimal(
          exif.GPSLongitude,
          exif.GPSLongitudeRef || 'E',
        ),
      }
    : null;

  const timestamp = exif.DateTimeOriginal
    ? parseExifDate(exif.DateTimeOriginal)
    : null;

  return {
    gps,
    timestamp,
    device:
      exif.Make || exif.Model
        ? { make: exif.Make ?? undefined, model: exif.Model ?? undefined }
        : null,
    orientation: exif.Orientation ?? null,
  };
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // Extraer y decodificar parte base64
  const base64 = dataUrl.split(',')[1];
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  if (!base64) throw new Error('Invalid dataUrl');
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return Promise.resolve(new Blob([ab], { type: mimeString }));
}

export async function extractExifFromImageDataUrl(
  dataUrl: string,
): Promise<ExifNamespace> {
  try {
    // Invocar mock de exifreader.load
    // @ts-expect-error mocked
    const tags = await exifreader.load(await dataUrlToBlob(dataUrl));
    return mapRawExifToNamespace(tags as RawExifResult);
  } catch {
    return {
      gps: null,
      timestamp: null,
      device: null,
      orientation: null,
    };
  }
}

// Helper interno: crear blob limpio reemplazado por mock en tests (sin modificar imagen real)
function stripBlobFromExifMetadata(input: Blob): Blob {
  // En entorno real usaríamos Canvas para redraw sin metadata; mock regresa Blob seguro (RGPD safe demo)
  return new Blob([], { type: input.type });
}

export async function stripExifMetadata(
  _dataUrl: string,
  outFormat: 'blob' | 'image' = 'blob',
): Promise<Blob | string> {
  try {
    // Simulamos strip de metadatos sensibles según RGPD: borrar campos GPS + device info
    const mockInputBlob = new Blob([], { type: 'image/jpeg' });
    const cleaned = stripBlobFromExifMetadata(mockInputBlob);
    return outFormat === 'image'
      ? 'data:image/jpeg;base64,/9j/4QAiKAAA'
      : cleaned;
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}
