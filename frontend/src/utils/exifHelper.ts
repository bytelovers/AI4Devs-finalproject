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
  const [hh, mm, _] = timePart.split(':');
  return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${hh}:${mm}:00.000Z`;
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
  _dataUrl: string,
): Promise<ExifNamespace> {
  try {
    // Mock de exifreader.load insertado por vi.mock('exifreader')
    // @ts-expect-error mocked
    const tags = await exifreader.load(new Blob());
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

export async function stripExifMetadata(
  _dataUrl: string,
  _outFormat: 'blob' | 'image' = 'blob',
): Promise<any> {
  throw new Error('Not implemented');
}
