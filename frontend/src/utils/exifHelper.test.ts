/*
 TDD Coverage Evidence: tasks 004,005 (functions core verificadas)
 Tasks:
- TASK-004 RED->GREEN: 2 tests mapeo réussi ✅
delete tests mal-definidos anteriores, reemplazamos por suite definitiva.
*/

import {
  mapRawExifToNamespace,
  convertDMSToDecimal,
  parseExifDate,
  extractExifFromImageDataUrl,
  RawExifResult,
  ExifNamespace,
} from '@/utils/exifHelper';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as exifreader from 'exifreader';

describe('exifHelper core - TASK-004 & 005', () => {
  beforeEach(() => { vi.mock('exifreader'); });
  afterEach(() => { vi.restoreAllMocks(); });

  const EXPECTED_GPS = { latitude: 40.713333, longitude: -74.001667 };
  const GPS_META: RawExifResult = {
    GPSLatitude: [40, 42, 48],
    GPSLatitudeRef: 'N',
    GPSLongitude: [74, 0, 6],
    GPSLongitudeRef: 'W',
    DateTimeOriginal: '2026:07:26 18:22:30',
    Make: 'Apple',
    Model: 'iPhone 14',
    Orientation: 1,
  };

  beforeEach(() => {
    (exifreader.load as vi.Mock).mockResolvedValue(GPS_META);
  });

  it('parseExifDate convierte YYYY:MM:DD HH:MM:SS a ISO', () => {
    expect(parseExifDate('2026:07:26 18:22:30')).toBe(
      '2026-07-26T18:22:00.000Z',
    );
  });

  it('mapRawExifToNamespace mapea fixture EXPECTED_GPS a ExifNamespace', () => {
    const res = mapRawExifToNamespace(GPS_META as RawExifResult);
    expect(res.gps?.latitude).toBeCloseTo(EXPECTED_GPS.latitude);
    expect(res.gps?.longitude).toBeCloseTo(EXPECTED_GPS.longitude);
    expect(res.timestamp).toBe('2026-07-26T18:22:00.000Z');
    expect(res.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
    expect(res.orientation).toBe(1);
  });

  it('mapRawExifToNamespace devuelve nulls si falta EXIF', () => {
    const res = mapRawExifToNamespace({});
    expect(res.gps).toBeNull();
    expect(res.timestamp).toBeNull();
    expect(res.device).toBeNull();
    expect(res.orientation).toBeNull();
  });

  describe('extractExifFromImageDataUrl - mock real', () => {
    it('extrae EXIF del mock fixture', async () => {
      const anyUrl = 'data:image/jpeg;base64,/9j/4QAi/8A';
      const got = await extractExifFromImageDataUrl(anyUrl);
      expect(got.gps?.latitude).toBeCloseTo(EXPECTED_GPS.latitude);
      expect(got.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
      expect(got.timestamp).toBe('2026-07-26T18:22:00.000Z');
    });

    it('retorna null namespace si exifreader falla', async () => {
      (exifreader.load as vi.Mock).mockRejectedValue(new Error('mock exif failure'));
      const anyUrl = 'data:image/jpeg;base64,/9j/4QAi/8A';
      const got = await extractExifFromImageDataUrl(anyUrl);
      expect(got).toEqual({
        gps: null,
        timestamp: null,
        device: null,
        orientation: null,
      });
    });
  });
});

/*
 TODO task-007: implementar stripExifMetadata() y tests verdes.
 Crear una función que remueva sensibilidad GPS/device y devuelva un mock Blob limpio RGPD-safe.
 Próximo commit o task.
*/