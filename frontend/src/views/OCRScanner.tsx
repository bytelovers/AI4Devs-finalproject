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
    <div className="ocr-scanner-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '20px',
      backgroundColor: 'var(--bg-base-dark, #111415)',
      color: '#FFFFFF',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      minHeight: '400px',
      border: '1px solid var(--border, #2d3748)'
    }}>
      {onClose && (
        <button 
          onClick={onClose} 
          aria-label="Cerrar escáner"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          ✕
        </button>
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>Escáner de Tickets</h2>

      {/* Viewfinder area */}
      <div 
        className="viewfinder"
        style={{
          width: '240px',
          height: '240px',
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Corners using flat Sage Green */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '3px solid var(--color-sage, #5F8575)', borderLeft: '3px solid var(--color-sage, #5F8575)' }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '3px solid var(--color-sage, #5F8575)', borderRight: '3px solid var(--color-sage, #5F8575)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '3px solid var(--color-sage, #5F8575)', borderLeft: '3px solid var(--color-sage, #5F8575)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '3px solid var(--color-sage, #5F8575)', borderRight: '3px solid var(--color-sage, #5F8575)' }}></div>

        {/* Scan line: flat sage green, zero blur or glow */}
        {scanning && (
          <div 
            className="scan-line"
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--color-sage, #5F8575)',
              top: `${progress}%`,
              transition: 'top 0.2s linear'
            }}
          />
        )}

        <span style={{ fontSize: '0.875rem', color: '#a0aec0', textAlign: 'center', padding: '10px' }}>
          {scanning ? `Escaneando... ${progress}%` : 'Alinea el ticket aquí'}
        </span>
      </div>

      <button
        onClick={simulateScan}
        disabled={scanning}
        style={{
          backgroundColor: 'var(--color-sage, #5F8575)',
          color: '#FFFFFF',
          padding: '12px 24px',
          border: '1px solid var(--color-sage, #5F8575)',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: scanning ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: scanning ? 0.7 : 1,
          boxShadow: 'none' /* No neon/glow shadow */
        }}
      >
        {scanning ? 'Procesando...' : 'Iniciar Escaneo'}
      </button>
    </div>
  );
};
