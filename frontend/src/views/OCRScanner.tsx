import React, { useState } from 'react';

interface OCRScannerProps {
  onScanComplete?: (data: { items: any[]; total: number }) => void;
  onClose?: () => void;
}

export const OCRScanner: React.FC<OCRScannerProps> = ({ onScanComplete, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateScan = () => {
    setScanning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          if (onScanComplete) {
            onScanComplete({
              items: [
                { id: '1', name: 'Hamburguesa Sage', price: 12.50, quantity: 1 },
                { id: '2', name: 'Patatas Amber', price: 4.50, quantity: 1 },
                { id: '3', name: 'Refresco', price: 2.50, quantity: 2 },
              ],
              total: 22.00
            });
          }
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="ocr-scanner-container relative overflow-hidden w-full max-w-md mx-auto min-h-[420px] p-6 flex flex-col items-center justify-between rounded-2xl border border-[var(--border)] bg-neutral-900/90 backdrop-blur-xl shadow-2xl text-white transition-all duration-300 hover:shadow-emerald-950/20">
      {onClose && (
        <button 
          onClick={onClose} 
          aria-label="Cerrar escáner"
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700/80 transition-all cursor-pointer z-10"
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: 'none' }}
        >
          ✕
        </button>
      )}

      <div className="text-center w-full mt-2">
        <h2 className="text-xl font-bold tracking-tight text-neutral-100" style={{ fontFamily: 'var(--font-heading)' }}>
          Escáner de Tickets
        </h2>
        <p className="text-xs text-neutral-400 mt-1">Coloca tu ticket dentro del recuadro para escanearlo</p>
      </div>

      {/* Viewfinder area */}
      <div 
        className="viewfinder relative w-64 h-64 my-6 bg-black/40 border border-neutral-800/50 rounded-xl flex items-center justify-center overflow-hidden group transition-all"
      >
        {/* Corners using flat Sage Green */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[var(--color-sage)] rounded-tl-md"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[var(--color-sage)] rounded-tr-md"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[var(--color-sage)] rounded-bl-md"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[var(--color-sage)] rounded-br-md"></div>

        {/* Scan line: glowing sage green laser beam */}
        {scanning && (
          <div 
            className="scan-line absolute left-0 w-full h-1 bg-[var(--color-sage)] transition-all duration-200"
            style={{
              top: `${progress}%`,
              boxShadow: '0 0 10px 2px var(--color-sage), 0 0 4px 1px var(--color-sage)',
            }}
          />
        )}

        {/* Grid lines inside viewfinder to make it look like a camera screen */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10 pointer-events-none">
          <div className="border-r border-b border-dashed border-white"></div>
          <div className="border-r border-b border-dashed border-white"></div>
          <div className="border-b border-dashed border-white"></div>
          <div className="border-r border-b border-dashed border-white"></div>
          <div className="border-r border-b border-dashed border-white"></div>
          <div className="border-b border-dashed border-white"></div>
          <div className="border-r border-dashed border-white"></div>
          <div className="border-r border-dashed border-white"></div>
          <div className="pointer-events-none"></div>
        </div>

        <div className="text-center p-4 z-10 select-none">
          {scanning ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-emerald-400 animate-pulse">Escaneando...</span>
              <span className="text-xs font-mono text-neutral-400 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">{progress}%</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-neutral-400 tracking-wide bg-neutral-950/60 px-3 py-2 rounded-lg backdrop-blur-sm border border-neutral-850">
              Alinea el ticket aquí
            </span>
          )}
        </div>
      </div>

      <button
        onClick={simulateScan}
        disabled={scanning}
        className={`w-full py-3.5 px-6 rounded-xl font-bold tracking-wide transition-all duration-200 cursor-pointer shadow-md ${
          scanning
            ? 'bg-neutral-850 text-neutral-500 cursor-not-allowed border border-neutral-800 shadow-none'
            : 'bg-[var(--color-sage)] hover:bg-emerald-700 text-white border border-[var(--color-sage)] hover:border-emerald-700 active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-950/30'
        }`}
        style={{ border: 'none' }}
      >
        {scanning ? 'Procesando OCR...' : 'Iniciar Escaneo'}
      </button>
    </div>
  );
};
