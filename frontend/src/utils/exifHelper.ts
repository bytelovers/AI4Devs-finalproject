/**
 * EXIF Helper Utilities
 * @see ../openspec/changes/exif-metadata-mapping/specs/delta-spec.md
 */

// Exif fields as they appear from exifreader mock
export interface RawExifResult { 
  DateTimeOriginal?: string; // 'YYYY:MM:DD HH:MM:SS'
  Make?: string;
  Model?: string;
  Orientation?: number;
  GPSLatitude?: number[];    // [degs, mins, secs]
  GPSLatitudeRef?: 'N' | 'S';
  GPSLongitude?: number[];   // [degs, mins, secs]
  GPSLongitudeRef?: 'E' | 'W';
}

// Output namespace
export interface ExifNamespace {
  gps: { latitude: number | null; longitude: number | null } | null;
  timestamp: string | null;
  device: { make: string | null; model: string | null } | null;
  orientation: number | null;
}

// Helper: convert DMS array + ref to decimal degrees
function convertDMSToDecimal(coords: number[], ref: 'N' | 'S' | 'E' | 'W'): number {
  const DMS_INDEX = { DEGREES: 0, MINUTES: 1, SECONDS: 2 };
  const degs = coords[DMS_INDEX.DEGREES] ?? 0;
  const mins = coords[DMS_INDEX.MINUTES] ?? 0;
  const secs = coords[DMS_INDEX.SECONDS] ?? 0;
  const dec = degs + mins / 60 + secs / 3600;
  return ref === 'S' || ref === 'W' ? -dec : dec;
}

// Helper: parse EXIF date string -> ISO-8601 with Z
function parseExifDate(dateStr: string): string {
  // input: 'YYYY:MM:DD HH:MM:SS'
  const [datePart, timePart] = dateStr.split(' ');
  if (!datePart || !timePart) return null as unknown as string;
  const [Y, M, D] = datePart.split(':').map((n) => parseInt(n, 10));
  const [h, m, s] = timePart.split(':').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(Y, M - 1, D, h, m, s));
  return date.toISOString(); // already 'YYYY-MM-DDTHH:MM:SS.sssZ'
}

export function mapRawExifToNamespace(exif: RawExifResult): ExifNamespace {
  const gps = (exif.GPSLatitude && exif.GPSLongitude) 
    ? {
        latitude: convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef || 'N'),
        longitude: convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef || 'E'),
      }
    : null;

  const timestamp = exif.DateTimeOriginal ? parseExifDate(exif.DateTimeOriginal) : null;

  return {
    gps,
    timestamp,
    device: (exif.Make || exif.Model) 
      ? { make: exif.Make ?? null, model: exif.Model ?? null }
      : null,
    orientation: exif.Orientation ?? null,
  };
}

// Placeholder exports for other tasks
export async function extractExifFromImageDataUrl(_: string): Promise<ExifNamespace> {
  throw new Error('Not implemented');
}

export async function stripExifMetadata(_: string, __?: 'blob' | 'image'): Promise<any> {
  throw new Error('Not implemented');
}