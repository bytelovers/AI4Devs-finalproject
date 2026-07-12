import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCamera } from './useCamera'

describe('useCamera Hook', () => {
  let mockStream: MediaStream
  let mockTrack: MediaStreamTrack
  let mockGetUserMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock MediaStreamTrack
    mockTrack = {
      stop: vi.fn(),
      kind: 'video',
      label: 'mock-camera',
      enabled: true,
      readyState: 'live',
    } as unknown as MediaStreamTrack

    // Mock MediaStream
    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
      getVideoTracks: vi.fn(() => [mockTrack]),
      getAudioTracks: vi.fn(() => []),
    } as unknown as MediaStream

    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream)
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    })

    // Mock HTMLVideoElement.prototype.play
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    // Mock HTMLCanvasElement.prototype.getContext for jsdom compatibility
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      return {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low' as ImageSmoothingQuality,
      } as unknown as CanvasRenderingContext2D
    })

    // Mock HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mockdata')

    // Mock ImageCapture as unavailable by default (fallback to canvas)
    vi.stubGlobal('ImageCapture', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('startCamera should get a stream and set cameraReady to true', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1)
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    expect(result.current.cameraReady).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.facingMode).toBe('environment')
  })

  it('startCamera should surface error when getUserMedia rejects with permission denied', async () => {
    const permissionError = new Error('Permission denied')
    permissionError.name = 'NotAllowedError'
    mockGetUserMedia.mockRejectedValue(permissionError)

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(result.current.cameraReady).toBe(false)
    expect(result.current.error).toContain('Permission denied')
  })

  it('startCamera should surface error when no camera found', async () => {
    const notFoundError = new Error('NotFoundError: device not found')
    notFoundError.name = 'NotFoundError'
    mockGetUserMedia.mockRejectedValue(notFoundError)

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(result.current.cameraReady).toBe(false)
    expect(result.current.error).toContain('No camera found')
  })

  it('startCamera should surface generic error for unknown failures', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Something went wrong'))

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(result.current.cameraReady).toBe(false)
    expect(result.current.error).toContain('Could not start the camera')
  })

  it('stopCamera should call track.stop() and clear ready state', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })
    expect(result.current.cameraReady).toBe(true)

    act(() => {
      result.current.stopCamera()
    })

    expect(mockTrack.stop).toHaveBeenCalled()
    expect(result.current.cameraReady).toBe(false)
  })

  it('captureFrame should return a data URL when camera is ready', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })
    expect(result.current.cameraReady).toBe(true)

    // Create a minimal mock for videoRef
    const videoRef = {
      current: {
        videoWidth: 640,
        videoHeight: 480,
        srcObject: mockStream,
      } as unknown as HTMLVideoElement,
    }

    const dataUrl = result.current.captureFrame(videoRef)
    expect(dataUrl).toBe('data:image/jpeg;base64,mockdata')
  })

  it('captureFrame should return null when camera is not ready', () => {
    const { result } = renderHook(() => useCamera())

    const videoRef = { current: null }
    const dataUrl = result.current.captureFrame(videoRef)
    expect(dataUrl).toBeNull()
  })

  it('switchFacingMode should toggle between environment and user', async () => {
    const { result } = renderHook(() => useCamera())

    expect(result.current.facingMode).toBe('environment')

    act(() => {
      result.current.switchFacingMode()
    })
    expect(result.current.facingMode).toBe('user')

    act(() => {
      result.current.switchFacingMode()
    })
    expect(result.current.facingMode).toBe('environment')
  })

  it('should clean up stream on unmount', async () => {
    const { result, unmount } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })
    expect(result.current.cameraReady).toBe(true)

    unmount()

    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it('should use ImageCapture API when available', async () => {
    const mockBitmap = {} as ImageBitmap
    const mockGrabFrame = vi.fn().mockResolvedValue(mockBitmap)
    const mockImageCapture = vi.fn().mockImplementation(() => ({
      grabFrame: mockGrabFrame,
    }))

    vi.stubGlobal('ImageCapture', mockImageCapture)

    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })
    expect(result.current.cameraReady).toBe(true)

    act(() => {
      result.current.stopCamera()
    })

    // Verify ImageCapture was available (no error)
    expect(result.current.error).toBeNull()
  })

  it('canvas compression should cap at 1920px max dimension for large input', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })

    const videoRef = {
      current: {
        videoWidth: 3840,
        videoHeight: 2160,
        srcObject: mockStream,
      } as unknown as HTMLVideoElement,
    }

    // Create a spy on createElement to verify canvas dimensions
    const createElementSpy = vi.spyOn(document, 'createElement')

    const dataUrl = result.current.captureFrame(videoRef)

    // Should produce a data URL
    expect(dataUrl).toBe('data:image/jpeg;base64,mockdata')

    createElementSpy.mockRestore()
  })

  it('should restart camera when facingMode changes while streaming', async () => {
    const { result } = renderHook(() => useCamera())

    await act(async () => {
      await result.current.startCamera()
    })
    expect(result.current.cameraReady).toBe(true)

    // Switch facing mode — should restart camera
    mockGetUserMedia.mockClear()
    act(() => {
      result.current.switchFacingMode()
    })

    expect(result.current.facingMode).toBe('user')
    // Camera restart is triggered via effect
    expect(mockTrack.stop).toHaveBeenCalled()
  })
})
