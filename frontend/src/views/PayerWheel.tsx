import React, { useState } from 'react';

interface PayerWheelProps {
  participants?: string[];
  onWinnerSelected?: (winner: string) => void;
  onClose?: () => void;
}

export const PayerWheel: React.FC<PayerWheelProps> = ({
  participants = ['Carlos', 'Elena', 'Juan', 'Sofia'],
  onWinnerSelected,
  onClose
}) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const startSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    const extraSpins = 3 + Math.floor(Math.random() * 5);
    const degree = Math.floor(Math.random() * 360);
    const newRotation = rotation + extraSpins * 360 + degree;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      // Determine winner based on final angle
      const finalAngle = (360 - (newRotation % 360)) % 360;
      const segmentDegrees = 360 / participants.length;
      const winnerIndex = Math.floor(finalAngle / segmentDegrees);
      const selectedWinner = participants[winnerIndex];
      setWinner(selectedWinner);

      if (onWinnerSelected) {
        onWinnerSelected(selectedWinner);
      }
    }, 3000);
  };

  return (
    <div className="payer-wheel-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      padding: '24px',
      backgroundColor: 'var(--bg-base-light, #FFFFFF)',
      color: 'var(--text-primary, #111415)',
      borderRadius: '16px',
      border: '1px solid var(--border, #e2e8f0)',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {onClose && (
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Sorteo de Pagador</h2>

      {/* Wheel area */}
      <div style={{ position: 'relative', width: '220px', height: '220px' }}>
        {/* Pointer pointing down at 12 o'clock, colored with --color-amber */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '18px solid var(--color-amber, #C88A36)',
          zIndex: 10
        }} />

        {/* The Wheel */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '4px solid var(--color-sage, #5F8575)',
          position: 'relative',
          overflow: 'hidden',
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 3s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
          backgroundColor: '#F4F6F5'
        }}>
          {participants.map((name, index) => {
            const angle = 360 / participants.length;
            const rotateVal = index * angle;
            // Alternate colors for segments using dark-olive / slate for dark-mode compatible base styles
            const isEven = index % 2 === 0;
            const segmentColor = isEven ? '#5F8575' : '#4A5568';
            
            return (
              <div
                key={name}
                style={{
                  position: 'absolute',
                  width: '50%',
                  height: '50%',
                  top: 0,
                  left: '50%',
                  transformOrigin: '0% 100%',
                  transform: `rotate(${rotateVal}deg) skewY(${90 - angle}deg)`,
                  backgroundColor: segmentColor,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
            );
          })}
        </div>

        {/* Center spin button with --color-amber */}
        <button
          onClick={startSpin}
          disabled={spinning}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-amber, #C88A36)',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            cursor: spinning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            zIndex: 5
          }}
        >
          {spinning ? '...' : 'GIRAR'}
        </button>
      </div>

      {winner && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px'
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>¡Ganador/a!</span>
          
          {/* Winner avatar container with winner-bounce animation */}
          <div 
            className="winner-bounce" 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card-light, #F4F6F5)',
              border: '3px solid var(--color-sage, #5F8575)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--color-sage, #5F8575)',
              boxShadow: 'none'
            }}
          >
            {winner.charAt(0)}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-sage, #5F8575)' }}>
            {winner}
          </span>
        </div>
      )}
    </div>
  );
};
