import React, { useRef, useState, useEffect } from 'react';
import * as Comlink from 'comlink';
import { db } from '../db/localDB';
import { useTicketStore } from '../store/useTicketStore';
import { convertToGrayscale, computeOtsuThreshold, binarizeImage, flattenReceipt, isConvexPolygon, Point } from '../workers/image.utils';
import type { OCRWorkerType } from '../workers/ocr.worker';
import type { LLMWorkerType } from '../workers/llm.worker';

export const DemoOCR: React.FC = () => {
  const {
    imageSrc,
    processedImageSrc,
    ocrStatus,
    ocrProgress,
    rawWords,
    groupedLines,
    finalJson,
    threshold,
    setImageSrc,
    setProcessedImageSrc,
    setOcrStatus,
    setOcrProgress,
    setRawWords,
    setGroupedLines,
    setFinalJson,
    setThreshold,
    resetStore,
  } = useTicketStore();

  // Web Workers references
  const ocrWorkerRef = useRef<Worker | null>(null);
  const ocrApiRef = useRef<Comlink.Remote<OCRWorkerType> | null>(null);
  const llmWorkerRef = useRef<Worker | null>(null);
  const llmApiRef = useRef<Comlink.Remote<LLMWorkerType> | null>(null);

  // Canvas and Camera states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [savedTickets, setSavedTickets] = useState<any[]>([]);

  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  const [isAdjustingPerspective, setIsAdjustingPerspective] = useState(false);
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 }
  ]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Handle dragging handle points globally to avoid losing focus
  useEffect(() => {
    if (activeHandle === null) return;

    const handleGlobalMove = (e: PointerEvent) => {
      if (activeHandle === null || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const newCorners = corners.map((c, i) => i === activeHandle ? { x, y } : c) as [Point, Point, Point, Point];

      if (isConvexPolygon(newCorners)) {
        setCorners(newCorners);
      }
    };

    const handleGlobalUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [activeHandle, corners]);

  const handleFlatten = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const scaledSourcePoints = corners.map(c => ({
        x: c.x * img.naturalWidth,
        y: c.y * img.naturalHeight
      })) as [Point, Point, Point, Point];

      try {
        const dewarpedCanvas = flattenReceipt(img, scaledSourcePoints);
        const dewarpedCtx = dewarpedCanvas.getContext('2d');
        if (dewarpedCtx) {
          const dewarpedImageData = dewarpedCtx.getImageData(0, 0, dewarpedCanvas.width, dewarpedCanvas.height);
          originalImageDataRef.current = dewarpedImageData;

          const grayscale = convertToGrayscale(dewarpedImageData);
          const autoThresh = computeOtsuThreshold(grayscale);
          setThreshold(autoThresh);

          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = dewarpedCanvas.width;
            canvas.height = dewarpedCanvas.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const binarized = binarizeImage(dewarpedImageData, autoThresh);
              ctx.putImageData(binarized, 0, 0);

              const binarizedDataUrl = canvas.toDataURL('image/png');
              setProcessedImageSrc(binarizedDataUrl);

              const dewarpedDataUrl = dewarpedCanvas.toDataURL('image/png');
              setImageSrc(dewarpedDataUrl);
            }
          }

          setIsAdjustingPerspective(false);
          setCorners([
            { x: 0.1, y: 0.1 },
            { x: 0.9, y: 0.1 },
            { x: 0.9, y: 0.9 },
            { x: 0.1, y: 0.9 }
          ]);
        }
      } catch (err) {
        console.error('Error flattening receipt:', err);
      }
    };
    img.src = imageSrc;
  };

  // Load history from Dexie
  const loadSavedTickets = async () => {
    try {
      const tickets = await db.tickets.toArray();
      // Sort by newest
      tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Load items for each ticket
      const ticketsWithItems = await Promise.all(
        tickets.map(async (t) => {
          const items = await db.items.where('ticketId').equals(t.id!).toArray();
          return { ...t, items };
        })
      );
      setSavedTickets(ticketsWithItems);
    } catch (err) {
      console.error('Error loading tickets from Dexie:', err);
    }
  };

  useEffect(() => {
    // 1. Initialize Web Workers
    const ocrWorker = new Worker(
      new URL('../workers/ocr.worker.ts', import.meta.url),
      { type: 'module' }
    );
    const ocrApi = Comlink.wrap<OCRWorkerType>(ocrWorker);

    const llmWorker = new Worker(
      new URL('../workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    );
    const llmApi = Comlink.wrap<LLMWorkerType>(llmWorker);

    ocrWorkerRef.current = ocrWorker;
    ocrApiRef.current = ocrApi;
    llmWorkerRef.current = llmWorker;
    llmApiRef.current = llmApi;

    // Load initial Dexie database records
    loadSavedTickets();

    // 2. Worker termination cleanup on unmount to prevent memory leaks
    return () => {
      ocrWorker.terminate();
      llmWorker.terminate();
      stopWebcam();
    };
  }, []);

  // Stop the webcam track stream
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start the webcam feed
  const startWebcam = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Error requesting webcam stream:', err);
      setCameraError('No se pudo acceder a la webcam. Usa el cargador de galería o la captura nativa.');
      setIsCameraActive(false);
    }
  };

  // Capture frame from webcam stream
  const captureWebcamFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        originalImageDataRef.current = imageData;
        
        // Auto binarize with Otsu
        const grayscale = convertToGrayscale(imageData);
        const autoThresh = computeOtsuThreshold(grayscale);
        setThreshold(autoThresh);

        // Apply threshold and draw
        const binarized = binarizeImage(imageData, autoThresh);
        ctx.putImageData(binarized, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
        setProcessedImageSrc(dataUrl);

        // Reset perspective editor state when a new image is loaded
        setIsAdjustingPerspective(false);
        setCorners([
          { x: 0.1, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.9, y: 0.9 },
          { x: 0.1, y: 0.9 }
        ]);

        // Stop camera tracks
        stopWebcam();
      }
    }
  };

  // Handle uploaded or captured image file
  const handleImageFile = (file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Adjust canvas size to fit image dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          originalImageDataRef.current = imageData;

          // Perform Otsu's thresholding automatically
          const grayscale = convertToGrayscale(imageData);
          const autoThresh = computeOtsuThreshold(grayscale);
          setThreshold(autoThresh);

          // Apply Otsu's threshold
          const binarized = binarizeImage(imageData, autoThresh);
          ctx.putImageData(binarized, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');
          setProcessedImageSrc(dataUrl);

          // Reset perspective editor state when a new image is loaded
          setIsAdjustingPerspective(false);
          setCorners([
            { x: 0.1, y: 0.1 },
            { x: 0.9, y: 0.1 },
            { x: 0.9, y: 0.9 },
            { x: 0.1, y: 0.9 }
          ]);
        }
      }
    };
    img.src = url;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  // Update binarization preview when slider changes manually
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setThreshold(value);

    if (canvasRef.current && originalImageDataRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const binarized = binarizeImage(originalImageDataRef.current, value);
        ctx.putImageData(binarized, 0, 0);
        setProcessedImageSrc(canvas.toDataURL('image/png'));
      }
    }
  };

  // Run the full pipeline
  const runOcrPipeline = async () => {
    if (!canvasRef.current || !originalImageDataRef.current) return;
    if (!ocrApiRef.current || !llmApiRef.current) return;

    try {
      setOcrStatus('preprocessing');
      setOcrProgress(0);

      // 1. Get the binarized image data from canvas
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      const binarizedDataUrl = canvas.toDataURL('image/png');

      setOcrStatus('recognizing');

      // 2. Execute Tesseract OCR in worker thread
      // Wrap progress callback in Comlink proxy
      const ocrResult = await ocrApiRef.current.processImage(
        binarizedDataUrl,
        Comlink.proxy((progress: number) => {
          setOcrProgress(Math.round(progress * 100));
        })
      );

      setOcrStatus('success');
      setRawWords(ocrResult.words);
      setGroupedLines(ocrResult.lines);

      // 3. Process with mockup LLM parser worker
      const parsedJson = await llmApiRef.current.parseReceiptText(
        ocrResult.text,
        Math.round(ocrResult.confidence)
      );

      setFinalJson(parsedJson);

      // 4. Persist to Dexie Database
      const ticketId = await db.tickets.add({
        rawText: ocrResult.text,
        confidence: Math.round(ocrResult.confidence),
        totalAmount: parsedJson.totalAmount,
        createdAt: new Date(),
      });

      for (const item of parsedJson.items) {
        await db.items.add({
          ticketId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
      }

      // Reload list
      loadSavedTickets();
    } catch (error) {
      console.error('OCR pipeline execution failed:', error);
      setOcrStatus('failed');
    }
  };

  // Clear current store state
  const handleClear = () => {
    resetStore();
    originalImageDataRef.current = null;
    setIsAdjustingPerspective(false);
    setCorners([
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 }
    ]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Clear IndexedDB records
  const clearDatabase = async () => {
    if (window.confirm('¿Seguro que quieres borrar todos los tickets locales de IndexedDB?')) {
      await db.tickets.clear();
      await db.items.clear();
      await db.participants.clear();
      loadSavedTickets();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-neutral-900 text-white rounded-2xl shadow-2xl border border-neutral-800">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400" style={{ fontFamily: 'var(--font-heading)' }}>
            Pipeline OCR Offline PoC
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Binarización en canvas local, extracción con Tesseract.js Web Worker y estructurado de datos.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors border border-neutral-700"
          >
            Limpiar Todo
          </button>
          <button
            onClick={clearDatabase}
            className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm transition-colors border border-red-900/50"
          >
            Vaciar Base de Datos
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Uploader, Camera Preview & Canvas */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-200">1. Captura y Preprocesamiento</h2>
            
            {/* Upload Options */}
            {!isCameraActive ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File Uploader */}
                <label className="flex flex-col items-center justify-center h-32 px-4 border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-xl cursor-pointer bg-neutral-800/40 hover:bg-neutral-800/80 transition-all text-neutral-400 hover:text-neutral-200">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">Subir de la Galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>

                {/* Mobile Camera Upload & Webcam Trigger */}
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center flex-1 px-4 border-2 border-neutral-700 hover:border-emerald-500 rounded-xl cursor-pointer bg-neutral-800/40 hover:bg-neutral-800/80 transition-all text-neutral-400 hover:text-neutral-200">
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span className="text-xs font-medium">Tomar Foto (Nativo)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={startWebcam}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors border border-neutral-700"
                  >
                    Activar Cámara Web
                  </button>
                </div>
              </div>
            ) : (
              // Webcam stream interface
              <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                  <button
                    onClick={captureWebcamFrame}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg"
                  >
                    Capturar Foto
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors border border-neutral-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-yellow-950/40 border border-yellow-800 text-yellow-400 text-xs rounded-lg">
                {cameraError}
              </div>
            )}

            {/* Perspective Adjustment Controls */}
            {imageSrc && (
              <div className="p-4 bg-neutral-800/40 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-neutral-300">Ajuste de Perspectiva:</span>
                </div>
                <div className="flex gap-2">
                  {!isAdjustingPerspective ? (
                    <button
                      onClick={() => setIsAdjustingPerspective(true)}
                      className="flex-1 py-2 px-4 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all border border-emerald-600/50"
                    >
                      Ajustar Esquinas / Editar Perspectiva
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFlatten}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Aplanar Ticket
                      </button>
                      <button
                        onClick={() => setCorners([
                          { x: 0.1, y: 0.1 },
                          { x: 0.9, y: 0.1 },
                          { x: 0.9, y: 0.9 },
                          { x: 0.1, y: 0.9 }
                        ])}
                        className="py-2 px-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg text-xs transition-all border border-neutral-600"
                      >
                        Restablecer
                      </button>
                      <button
                        onClick={() => setIsAdjustingPerspective(false)}
                        className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-all border border-neutral-700"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Threshold Manual Slider */}
            {imageSrc && (
              <div className="p-4 bg-neutral-800/40 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-neutral-300">Umbral de Binarización:</span>
                  <span className="text-emerald-400 font-bold">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={threshold}
                  onChange={handleSliderChange}
                  className="w-full accent-emerald-500 h-2 bg-neutral-700 rounded-lg cursor-pointer"
                />
                <p className="text-xs text-neutral-500">
                  Desliza para optimizar el contraste de los caracteres de la factura. El valor se calculó inicialmente usando Otsu.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Binarization Canvas Preview */}
          <div className="mt-6 flex-1 flex flex-col justify-center">
            <span className="text-sm font-semibold text-neutral-300 mb-2 block">
              {isAdjustingPerspective ? 'Ajustar Perspectiva del Ticket' : 'Vista Previa de Imagen Binarizada (B&W)'}
            </span>
            <div className="border border-neutral-800 bg-neutral-950 rounded-xl p-4 flex items-center justify-center min-h-[300px] overflow-auto">
              <div className="relative inline-block max-w-full max-h-[450px]">
                {/* SVG perspective adjustment overlay container */}
                <div style={{ display: isAdjustingPerspective && imageSrc ? 'block' : 'none' }}>
                  {imageSrc && (
                    <>
                      <img
                        ref={imageRef}
                        src={imageSrc}
                        alt="Original preview"
                        className="max-w-full max-h-[450px] object-contain rounded select-none"
                        draggable={false}
                      />
                      <svg
                        className="absolute top-0 left-0 w-full h-full cursor-crosshair select-none"
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                      >
                        <polygon
                          points={corners.map(c => `${c.x * 1000},${c.y * 1000}`).join(' ')}
                          fill="rgba(16, 185, 129, 0.2)"
                          stroke="#10b981"
                          strokeWidth="4"
                        />
                        {corners.map((c, idx) => (
                          <circle
                            key={idx}
                            cx={c.x * 1000}
                            cy={c.y * 1000}
                            r="20"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="4"
                            className="cursor-pointer hover:fill-emerald-400 hover:stroke-emerald-100 transition-colors"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              (e.target as Element).setPointerCapture(e.pointerId);
                              setActiveHandle(idx);
                            }}
                            onPointerUp={(e) => {
                              (e.target as Element).releasePointerCapture(e.pointerId);
                            }}
                          />
                        ))}
                      </svg>
                    </>
                  )}
                </div>

                {/* Main canvas for processed image */}
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[450px] object-contain rounded shadow-md"
                  style={{ display: !isAdjustingPerspective && imageSrc ? 'block' : 'none' }}
                />

                {!imageSrc && (
                  <div className="text-center py-12 text-neutral-600">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Ninguna imagen cargada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Run button */}
          {imageSrc && (
            <button
              onClick={runOcrPipeline}
              disabled={ocrStatus === 'preprocessing' || ocrStatus === 'recognizing'}
              className={`w-full py-4 mt-6 rounded-xl font-bold text-base transition-all shadow-lg ${
                ocrStatus === 'preprocessing' || ocrStatus === 'recognizing'
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-950/20 active:scale-[0.99]'
              }`}
            >
              {ocrStatus === 'preprocessing' && 'Preprocesando Imagen...'}
              {ocrStatus === 'recognizing' && `Ejecutando OCR Offline (${ocrProgress}%)`}
              {ocrStatus !== 'preprocessing' && ocrStatus !== 'recognizing' && 'Iniciar Procesamiento de Ticket'}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: OCR Outputs & JSON Preview */}
        <div className="space-y-6 flex flex-col">
          <h2 className="text-xl font-semibold text-neutral-200">2. Estado y Resultados Extraídos</h2>

          {/* Pipeline Status Indicator */}
          <div className="p-4 bg-neutral-800/40 border border-neutral-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Spinner / Status icon */}
              {(ocrStatus === 'preprocessing' || ocrStatus === 'recognizing') ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : ocrStatus === 'success' ? (
                <div className="w-5 h-5 flex items-center justify-center bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800 text-xs">✓</div>
              ) : ocrStatus === 'failed' ? (
                <div className="w-5 h-5 flex items-center justify-center bg-red-950 text-red-400 rounded-full border border-red-900 text-xs">✗</div>
              ) : (
                <div className="w-5 h-5 bg-neutral-700 rounded-full" />
              )}

              <div>
                <span className="text-xs font-semibold block text-neutral-400 uppercase">Estado</span>
                <span className="text-sm font-medium capitalize text-neutral-200">
                  {ocrStatus === 'idle' && 'Esperando Imagen'}
                  {ocrStatus === 'preprocessing' && 'Mejorando contraste (Binarización)'}
                  {ocrStatus === 'recognizing' && `Tesseract.js OCR: ${ocrProgress}%`}
                  {ocrStatus === 'success' && 'Procesado Completado'}
                  {ocrStatus === 'failed' && 'Error en el Procesamiento'}
                </span>
              </div>
            </div>

            {/* Confidence Score Indicator */}
            {ocrStatus === 'success' && finalJson?.metadata && (
              <div className="text-right">
                <span className="text-xs text-neutral-400 block font-semibold uppercase">Confianza</span>
                <div className="flex items-center gap-1.5 text-emerald-400 justify-end">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.708.522L3.547 10.22a.75.75 0 00.316.892l6.237 3.822a.75.75 0 00.75-.02l5.762-3.823a.75.75 0 00.312-.898l-2.09-6.223a.75.75 0 00-.712-.511H6.267zm-.105 1.5h7.676l1.782 5.304-4.838 3.21-5.405-3.313 1.785-5.301z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-extrabold">{finalJson.metadata.ocrConfidence}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* Extracted Lines Panel */}
            <div className="flex flex-col border border-neutral-800 bg-neutral-950 rounded-xl overflow-hidden min-h-[300px]">
              <header className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                  Líneas Agrupadas (Y-Tol: 15px)
                </span>
                <span className="text-xs px-2 py-0.5 bg-neutral-800 rounded text-neutral-500 font-mono">
                  {groupedLines.length}
                </span>
              </header>
              <div className="p-4 overflow-y-auto max-h-[350px] font-mono text-[11px] text-neutral-300 leading-relaxed space-y-2 flex-1 scrollbar-thin">
                {groupedLines.length > 0 ? (
                  groupedLines.map((line, idx) => (
                    <div key={idx} className="border-b border-neutral-900 pb-1.5 hover:text-white transition-colors">
                      <span className="text-neutral-600 select-none mr-2">{String(idx + 1).padStart(2, '0')}:</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-700 text-center py-12 italic">
                    Sin líneas extraídas aún. Corre el pipeline para rellenar este panel.
                  </div>
                )}
              </div>
            </div>

            {/* Structured JSON Panel */}
            <div className="flex flex-col border border-neutral-800 bg-neutral-950 rounded-xl overflow-hidden min-h-[300px]">
              <header className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                  Resultado JSON Estructurado
                </span>
                {finalJson?.metadata?.processingTimeMs && (
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {finalJson.metadata.processingTimeMs} ms
                  </span>
                )}
              </header>
              <div className="p-4 overflow-y-auto max-h-[350px] font-mono text-[11px] text-neutral-300 leading-relaxed flex-1 scrollbar-thin">
                {finalJson ? (
                  <pre className="text-emerald-500/90 overflow-x-auto whitespace-pre-wrap select-all">
                    {JSON.stringify(finalJson, null, 2)}
                  </pre>
                ) : (
                  <div className="text-neutral-700 text-center py-12 italic">
                    Esperando salida del formateador LLM.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* HISTORY PANEL (Dexie Local DB View) */}
      <section className="mt-12 border-t border-neutral-800 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-200" style={{ fontFamily: 'var(--font-heading)' }}>
              Historial de Facturas Locales (IndexedDB / Dexie)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Todos los tickets procesados y persistidos offline en el navegador.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-neutral-800 rounded-full text-emerald-400 font-bold border border-neutral-700">
            {savedTickets.length} guardados
          </span>
        </div>

        {savedTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTickets.map((t) => (
              <div key={t.id} className="p-4 bg-neutral-800/30 border border-neutral-800 rounded-xl space-y-4 shadow-sm hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-neutral-200 text-sm truncate max-w-[180px]">
                      Ticket #{t.id}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(t.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-emerald-400 font-medium">
                    Confianza: {t.confidence}%
                  </span>
                </div>

                <div className="border-t border-neutral-900 pt-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Líneas de la compra:</span>
                  <ul className="text-xs text-neutral-300 mt-1 space-y-1.5">
                    {t.items?.map((item: any, i: number) => (
                      <li key={item.id || i} className="flex justify-between">
                        <span className="truncate max-w-[140px]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-neutral-200">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-neutral-900 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-400">TOTAL</span>
                  <span className="text-sm font-extrabold text-amber-500 font-mono">
                    {t.totalAmount.toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-neutral-800 bg-neutral-800/10 rounded-xl text-center text-neutral-600 text-sm italic">
            No hay tickets guardados en IndexedDB. Procesa un ticket para guardarlo automáticamente.
          </div>
        )}
      </section>

    </div>
  );
};
