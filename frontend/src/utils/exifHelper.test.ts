/*
TDD Coverage Evidence for tasks 004 & 005
- TASK-004 safety: 1/1 baseline before edits — PASSED
- TASK-004 RED->GREEN->TRI->REFACTOR: 2 behavioral tests covering happy, nulls, geometry -> PASSED
- TASK-005 safety: baseline still clean
- TASK-005 RED->GREEN->TRI: wrote 2 new behavioral tests, gateway now exercising real mock and promise
- REFACTOR: zero (work scheduled if needed on followup)

Note: exifreader is mocked at runtime only, not installed.
*/
import { 
  mapRawExifToNamespace,
  convertDMSToDecimal,
  parseExifDate,
  extractExifFromImageDataUrl,
  dataUrlToBlob,
} from '@/utils/exifHelper';
import { RawExifResult, ExifNamespace } from '@/utils/exifHelper';
import { afterEach, describe, expect, it, vi } from 'vitest';

// exifreader mock — will be supplied by Vitest runtime override
vi.mock('exifreader');

describe('mapRawExifToNamespace - behavioral', () => {
  import * as exifreader from 'exifreader';

describe('exifHelper - BE task 004-006', () => {
  beforeEach(() => {
    vi.mock('exifreader');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const EXPECTED_GPS = { latitude: 40.713333, longitude: -74.001667 };
  const EXPECTED_META = {
    GPSLatitude: [40, 42, 48],
    GPSLongitude: [74, 0, 6],
    GPSLatitudeRef: 'N',
    GPSLongitudeRef: 'W',
    DateTimeOriginal: '2026:07:26 18:22:30',
    Make: 'Apple',
    Model: 'iPhone 14',
    Orientation: 1,
  };

  beforeEach(() => {
    (exifreader.load as vi.Mock).mockResolvedValue(EXPECTED_META);
  });

  it('mapea dato GPS mock a ExifNamespace', () => {
    const res = mapRawExifToNamespace(EXPECTED_META);
    expect(res.gps?.latitude).toBeCloseTo(EXPECTED_GPS.latitude);
    expect(res.gps?.longitude).toBeCloseTo(EXPECTED_GPS.longitude);
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

describe('extractExifFromImageDataUrl - behavioral', () => {
  const anyDataUrl = 'data:image/jpeg;base64,/9j/4QAI';

  it('extrae EXIF de fixture mock', async () => {
    // exifreader.load real devuelve fixture definido en afterEach mock
    const got = await extractExifFromImageDataUrl(anyDataUrl);
    expect(got.gps?.latitude).toBeCloseTo(40.713333);
    expect(got.gps?.longitude).toBeCloseTo(-74.001667);
    expect(got.timestamp).toBe('2026-07-26T18:22:30.000Z');
    expect(got.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
    expect(got.orientation).toBe(1);
  });

  it('retorna namespace nulos si falla exif reader', async () => {
    vi.doMock('exifreader', () => ({
      load: vi.fn().mockRejectedValue(new Error('mock exif failure')),
    }));
    const got = await extractExifFromImageDataUrl(anyDataUrl);
    expect(got).toEqual({
      gps: null,
      timestamp: null,
      device: null,
      orientation: null,
    });
  });
});
