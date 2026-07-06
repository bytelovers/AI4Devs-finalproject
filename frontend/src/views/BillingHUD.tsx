import React, { useState } from 'react';

interface BillingHUDProps {
  totalAmount?: number;
  tipAmount?: number;
  qrValue?: string;
  onClose?: () => void;
}

export const BillingHUD: React.FC<BillingHUDProps> = ({
  totalAmount = 22.00,
  tipAmount = 2.20,
  qrValue = "https://www.bizum.es",
  onClose
}) => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="billing-hud-container" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '24px',
      backgroundColor: 'var(--bg-base-light, #FFFFFF)',
      color: 'var(--text-primary, #111415)',
      borderRadius: '16px',
      border: '1px solid var(--border, #e2e8f0)',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dictado y Pago</h2>
        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        backgroundColor: 'var(--bg-card-light, #F4F6F5)',
        borderRadius: '12px',
        border: '1px solid var(--color-sage, #5F8575)' /* Flat Sage Green border, no glow */
      }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #718096)' }}>Total Cuenta</div>
        <div style={{ 
          fontSize: '2.25rem', 
          fontWeight: 'black', 
          color: 'var(--color-amber, #C88A36)' /* Warm Amber */
        }}>
          {(totalAmount).toFixed(2)}€
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px' }}>
          <span>Propina acumulada:</span>
          <span style={{ fontWeight: 'bold', color: 'var(--color-amber, #C88A36)' }}>{(tipAmount).toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <span>Total a cobrar:</span>
          <span style={{ fontWeight: 'bold', color: 'var(--color-amber, #C88A36)' }}>{(totalAmount + tipAmount).toFixed(2)}€</span>
        </div>
      </div>

      <button 
        onClick={() => setShowQR(true)}
        style={{
          backgroundColor: 'var(--color-sage, #5F8575)',
          color: '#FFFFFF',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--color-sage, #5F8575)',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Mostrar QR de Bizum
      </button>

      {showQR && (
        <div className="qr-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="qr-modal" style={{
            backgroundColor: 'var(--bg-base-light, #FFFFFF)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            boxShadow: 'none' /* No neon/glow shadow */
          }}>
            <button 
              onClick={() => setShowQR(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--text-secondary)'
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Pago por Bizum</h3>

            {/* QR container with qr-container class for invert filter in Dark Mode */}
            <div className="qr-container" style={{
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Fallback QR representation using standard high contrast B&W SVG blocks */}
              <svg width="150" height="150" viewBox="0 0 29 29" style={{ display: 'block' }}>
                <path fill="#000000" d="M0 0h7v7H0zm1 1v5h5V1zm8 0h3v1h-1v2h1v3H9zm4 0h1v1h-1zm2 0h1v2h-1zm3 0h3v1h-1v1h-2zm4 0h3v7h-3zm1 1v5h1V2zm-15 7v1h2v1h-2v3h1v-2h2v-2zm7 0h1v2h-1zm1 0h1v1h-1zm3 0h1v1h1v1h-2zm3 0h1v3h-1zm-6 2h1v1h-1zm1 1h2v1h-2zm3 0h1v2h-1zm-15 2h7v7H0zm1 1v5h5V16zm11 0h1v1h-1zm2 0h1v2h-1zm5 0h1v1h-1zm-6 2h1v1h-1zm2 0h1v3h-1zm1 0h1v1h-1zm3 0h1v2h-1zm-3 2h2v1h-2zm3 0h2v1h-2zm-6 1h1v1h-1z" />
              </svg>
            </div>

            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Escanea para realizar el Bizum
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
