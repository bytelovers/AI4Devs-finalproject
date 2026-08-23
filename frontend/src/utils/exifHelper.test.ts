/*
 * Tests EXIF helper: extraction with exifr (dynamic import) and mapping to
 * ExifNamespace under the D8 root-level lat/lon contract.
 *
 * TDD: tests written FIRST (RED) for sdd change exif-metadata-mapping
 * (REQ-EXIF-01..10, design decisions D1-D8).
 */

import {
  mapRawExifToNamespace,
  extractExifFromFile,
} from '@/utils/exifHelper';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock exifr: `extractExifFromFile` uses `await import('exifr')` and calls
// `default.parse(file, options)`. The mock exposes the same surface.
const exifr = vi.hoisted(() => ({ default: { parse: vi.fn() } }));
vi.mock('exifr', () => exifr);

const EMPTY_NAMESPACE = {
  gps: null,
  timestamp: null,
  device: null,
  orientation: null,
};

describe('exifHelper — exifr extraction (REQ-EXIF-01/04/05/09)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const GPS_DECIMAL = { latitude: 40.713333, longitude: -74.001667 };

  // Real exifr 7.x merged output (verificado en apply): GPS a nivel RAÍZ
  // (latitude/longitude decimal signado), DateTimeOriginal revivido a Date,
  // Orientation como entero con translateValues:false. `extractExifFromFile`
  // es el único punto de adaptación hacia el contrato raíz (D8).
  const EXIFR_RAW_OUTPUT = {
    latitude: GPS_DECIMAL.latitude,
    longitude: GPS_DECIMAL.longitude,
    DateTimeOriginal: new Date('2026-07-26T18:22:30.000Z'),
    Make: 'Apple',
    Model: 'iPhone 14',
    Orientation: 1,
  };

  beforeEach(() => {
    exifr.default.parse.mockReset();
  });

  it('extrae EXIF desde el File y mapea GPS decimal signado a ExifNamespace', async () => {
    exifr.default.parse.mockResolvedValue(EXIFR_RAW_OUTPUT);

    const file = new File(['(dummy jpeg)'], 'receipt.jpg', { type: 'image/jpeg' });
    const result = await extractExifFromFile(file);

    // exifr.parse fue llamado con el File original y las opciones pre-compress
    expect(exifr.default.parse).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ tiff: true, gps: true })
    );
    expect(result.gps?.latitude).toBeCloseTo(GPS_DECIMAL.latitude);
    expect(result.gps?.longitude).toBeCloseTo(GPS_DECIMAL.longitude);
    expect(result.timestamp).toBe('2026-07-26T18:22:30.000Z');
    expect(result.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
    expect(result.orientation).toBe(1);
  });

  it('tolera GPS anidado en raw.gps (forma mergeOutput:false) hacia el contrato raíz', async () => {
    // Forma defensiva: si exifr (u otra versión) devuelve GPS anidado en
    // raw.gps, el helper lo aplan igualmente al contrato raíz (D8).
    exifr.default.parse.mockResolvedValue({
      gps: { latitude: 40.713333, longitude: -74.001667 },
      Make: 'Canon',
      Model: 'EOS R6',
    });

    const file = new File(['(dummy)'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await extractExifFromFile(file);

    expect(result.gps).toEqual(GPS_DECIMAL);
    expect(result.device).toEqual({ make: 'Canon', model: 'EOS R6' });
  });

  it('devuelve namespace nulo si exifr.parse rechaza (fallback, nunca throw)', async () => {
    exifr.default.parse.mockRejectedValue(new Error('mock parse failure'));

    const file = new File(['(dummy)'], 'broken.jpg', { type: 'image/jpeg' });
    const result = await extractExifFromFile(file);

    expect(result).toEqual(EMPTY_NAMESPACE);
  });
});

describe('mapRawExifToNamespace — contrato raíz (REQ-EXIF-02/03)', () => {
  it('mapea fixture GPS decimal signado a ExifNamespace', () => {
    const result = mapRawExifToNamespace({
      latitude: 40.713333,
      longitude: -74.001667,
      DateTimeOriginal: '2026:07:26 18:22:30',
      Make: 'Apple',
      Model: 'iPhone 14',
      Orientation: 1,
    });

    expect(result.gps?.latitude).toBeCloseTo(40.713333);
    expect(result.gps?.longitude).toBeCloseTo(-74.001667);
    expect(result.timestamp).toBe('2026-07-26T18:22:30.000Z');
    expect(result.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
    expect(result.orientation).toBe(1);
  });

  it('acepta DateTimeOriginal como Date (reviveValues) y lo normaliza a ISO', () => {
    const result = mapRawExifToNamespace({
      latitude: 1,
      longitude: 2,
      DateTimeOriginal: new Date('2026-07-26T18:22:30.000Z'),
    });

    expect(result.timestamp).toBe('2026-07-26T18:22:30.000Z');
    expect(result.gps).toEqual({ latitude: 1, longitude: 2 });
  });

  it('devuelve gps null y resto de campos null si falta EXIF', () => {
    const result = mapRawExifToNamespace({});

    expect(result.gps).toBeNull();
    expect(result.timestamp).toBeNull();
    expect(result.device).toBeNull();
    expect(result.orientation).toBeNull();
  });

  it('devuelve gps null si solo falta lat o lon (sin error)', () => {
    const result = mapRawExifToNamespace({ latitude: 40.713333, Make: 'Apple' });

    expect(result.gps).toBeNull();
    expect(result.device).toEqual({ make: 'Apple' });
  });
});