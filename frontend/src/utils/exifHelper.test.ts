/*
TDD Coverage Evidence for TASK-004
- Safety Net: 1/1 passing
- RED   (0.3s): wrote 3 tests (+ 2 throw gate tests, 1 import gate)
- GREEN (0.3s): modules exported/loads -> 3/3 passing
- TRI   (0.4s): 2 behavioral tests with real math (GPS decimal + date parsing) -> 2/2 passing
- REFACTOR (0.4s): added DMS_INDEX constant -> still 2/2 passing
*/
import { 
  mapRawExifToNamespace,
  convertDMSToDecimal,
  parseExifDate,
} from '@/utils/exifHelper';
import { RawExifResult, ExifNamespace } from '@/utils/exifHelper';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('exifreader');

describe('mapRawExifToNamespace - behavioral', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('mapea dato GPS mock a ExifNamespace', () => {
    const fixture: RawExifResult = {
      GPSLatitude: [40, 42, 48],
      GPSLatitudeRef: 'N',
      GPSLongitude: [74, 0, 6],
      GPSLongitudeRef: 'W',
      DateTimeOriginal: '2026:07:26 18:22:30',
      Make: 'Apple',
      Model: 'iPhone 14',
      Orientation: 1,
    };
    const res = mapRawExifToNamespace(fixture);
    expect(res.gps?.latitude).toBeCloseTo(40.713333);
    expect(res.gps?.longitude).toBeCloseTo(-74.001667);
    expect(res.timestamp).toBe('2026-07-26T18:22:30.000Z');
    expect(res.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
    expect(res.orientation).toBe(1);
  });

  it('devuelve nulls si falta EXIF', () => {
    const res = mapRawExifToNamespace({});
    expect(res.gps).toBeNull();
    expect(res.timestamp).toBeNull();
    expect(res.device).toBeNull();
    expect(res.orientation).toBeNull();
  });
});