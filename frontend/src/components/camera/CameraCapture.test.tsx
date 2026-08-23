/*
 * CameraCapture component tests — EXIF extraction wiring (REQ-EXIF-01/04/06/07).
 *
 * TDD: tests written FIRST (RED) for sdd change exif-metadata-mapping.
 * jsdom lacks canvas toDataURL/getUserMedia, so they are stubbed.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CameraCapture } from './CameraCapture';
import type { CapturedImage } from '@/lib/types';

// Mock exifr: `extractExifFromFile` uses `await import('exifr')` + default.parse.
const exifr = vi.hoisted(() => ({ default: { parse: vi.fn() } }));
vi.mock('exifr', () => exifr);

const EMPTY_NAMESPACE = {
  gps: null,
  timestamp: null,
  device: null,
  orientation: null,
};

function stubCanvas() {
  // jsdom no implementa canvas.toDataURL → stub para compressImage/captureFrame.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,stubbed'
  );
}

function stubImageLoad() {
  // jsdom no decodifica imágenes → Image.onload nunca dispara; stub que lo dispara.
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 1600;
    height = 1200;
    set src(_value: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  }
  vi.stubGlobal('Image', MockImage);
}

function stubLiveCamera() {
  const stream = { getTracks: () => [{ stop: vi.fn() }] };
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    configurable: true,
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
}

describe('CameraCapture — extracción EXIF del File (REQ-EXIF-01/06)', () => {
  beforeEach(() => {
    exifr.default.parse.mockReset();
    stubCanvas();
    stubImageLoad();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('extrae EXIF del File original antes de comprimir y llama onCapture con {dataUrl, exif}', async () => {
    // Forma real de exifr 7.x merged output: GPS a nivel raíz.
    exifr.default.parse.mockResolvedValue({
      latitude: 40.713333,
      longitude: -74.001667,
      DateTimeOriginal: new Date('2026-07-26T18:22:30.000Z'),
      Make: 'Apple',
      Model: 'iPhone 14',
      Orientation: 1,
    });

    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} />);

    const file = new File(['(dummy jpeg)'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Vista previa tras compressImage
    await waitFor(() => {
      expect(screen.getByText('Vista previa')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Usar imagen/i }));

    expect(exifr.default.parse).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ tiff: true, gps: true })
    );
    const called = onCapture.mock.calls[0]?.[0] as CapturedImage;
    expect(called.dataUrl).toBe('data:image/jpeg;base64,stubbed');
    expect(called.exif.gps).toEqual({ latitude: 40.713333, longitude: -74.001667 });
    expect(called.exif.device).toEqual({ make: 'Apple', model: 'iPhone 14' });
  });

  it('si exifr falla, onCapture recibe exif nulo y el flujo continúa (REQ-EXIF-04)', async () => {
    exifr.default.parse.mockRejectedValue(new Error('mock parse failure'));

    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} />);

    const file = new File(['(dummy jpeg)'], 'broken.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Vista previa')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Usar imagen/i }));

    const called = onCapture.mock.calls[0]?.[0] as CapturedImage;
    expect(called.dataUrl).toBe('data:image/jpeg;base64,stubbed');
    expect(called.exif).toEqual(EMPTY_NAMESPACE);
  });
});

describe('CameraCapture — cámara en vivo → exif nulo (REQ-EXIF-07)', () => {
  beforeEach(() => {
    stubLiveCamera();
    stubCanvas();
    stubImageLoad();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('captura por live stream entrega onCapture con exif namespace nulo', async () => {
    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} />);

    // getUserMedia resuelve y el componente asigna onloadedmetadata al video.
    await waitFor(() => {
      const video = document.querySelector('video');
      expect(video?.onloadedmetadata).toBeTypeOf('function');
    });
    const video = document.querySelector('video') as HTMLVideoElement;
    act(() => {
      video.onloadedmetadata?.(new Event('loadedmetadata'));
    });

    const shootBtn = await screen.findByRole('button', { name: /Hacer foto/i });
    await waitFor(() => expect(shootBtn).not.toBeDisabled());
    fireEvent.click(shootBtn);

    // Modo preview → confirmar
    await waitFor(() => {
      expect(screen.getByText('Vista previa')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Usar imagen/i }));

    const called = onCapture.mock.calls[0]?.[0] as CapturedImage;
    expect(called.dataUrl).toBe('data:image/jpeg;base64,stubbed');
    expect(called.exif).toEqual(EMPTY_NAMESPACE);
  });
});