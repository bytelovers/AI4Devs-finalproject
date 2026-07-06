import React, { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  totalAllocated: number;
}

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  allocatedTo: string[]; // participant IDs
}

interface AllocationProps {
  items?: Item[];
  participants?: Participant[];
  onBack?: () => void;
  onNext?: () => void;
}

export const Allocation: React.FC<AllocationProps> = ({
  items: initialItems,
  participants: initialParticipants,
  onBack,
  onNext
}) => {
  const [items, setItems] = useState<Item[]>(initialItems || [
    { id: '1', name: 'Hamburguesa Sage', price: 12.50, quantity: 1, allocatedTo: [] },
    { id: '2', name: 'Patatas Amber', price: 4.50, quantity: 1, allocatedTo: [] },
    { id: '3', name: 'Refresco', price: 2.50, quantity: 2, allocatedTo: [] },
  ]);

  const [participants, setParticipants] = useState<Participant[]>(initialParticipants || [
    { id: 'p1', name: 'Carlos', totalAllocated: 0 },
    { id: 'p2', name: 'Elena', totalAllocated: 0 },
    { id: 'p3', name: 'Juan', totalAllocated: 0 },
  ]);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleSelectItem = (item: Item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleToggleParticipant = (participantId: string) => {
    if (!selectedItem) return;

    const updatedItems = items.map(item => {
      if (item.id === selectedItem.id) {
        const isAllocated = item.allocatedTo.includes(participantId);
        const allocatedTo = isAllocated
          ? item.allocatedTo.filter(id => id !== participantId)
          : [...item.allocatedTo, participantId];
        return { ...item, allocatedTo };
      }
      return item;
    });

    setItems(updatedItems);
    setSelectedItem(updatedItems.find(item => item.id === selectedItem.id) || null);

    // Recalculate participant totals
    const updatedParticipants = participants.map(part => {
      const total = updatedItems.reduce((acc, item) => {
        if (item.allocatedTo.includes(part.id)) {
          const share = (item.price * item.quantity) / item.allocatedTo.length;
          return acc + share;
        }
        return acc;
      }, 0);
      return { ...part, totalAllocated: Number(total.toFixed(2)) };
    });
    setParticipants(updatedParticipants);
  };

  return (
    <div className="allocation-container" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      backgroundColor: 'var(--bg-base-light, #FFFFFF)',
      color: 'var(--text-primary, #111415)',
      borderRadius: '16px',
      border: '1px solid var(--border, #e2e8f0)',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Reparto de Ítems</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => {
          const isSelected = selectedItem?.id === item.id;
          const isAllocated = item.allocatedTo.length > 0;

          return (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className="allocation-item-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isSelected 
                  ? '1.5px solid var(--color-sage, #5F8575)' 
                  : '1px solid var(--border, #e2e8f0)',
                backgroundColor: isSelected 
                  ? 'var(--bg-card-light, #F4F6F5)' 
                  : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #718096)' }}>
                  {item.quantity}x • {(item.price).toFixed(2)}€
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{(item.price * item.quantity).toFixed(2)}€</span>
                {isAllocated && (
                  <span className="badge-flat" style={{
                    backgroundColor: 'var(--bg-card-light, #F4F6F5)',
                    color: 'var(--color-sage, #5F8575)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    border: '1px solid var(--border, #e2e8f0)'
                  }}>
                    {item.allocatedTo.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div style={{
          backgroundColor: 'var(--bg-card-light, #F4F6F5)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
            Asignar: {selectedItem.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {participants.map(part => {
              const isAssigned = selectedItem.allocatedTo.includes(part.id);
              return (
                <button
                  key={part.id}
                  onClick={() => handleToggleParticipant(part.id)}
                  className="participant-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    border: isAssigned 
                      ? '1px solid var(--color-sage, #5F8575)' 
                      : '1px solid var(--border, #e2e8f0)',
                    backgroundColor: isAssigned 
                      ? 'var(--color-sage, #5F8575)' 
                      : '#FFFFFF',
                    color: isAssigned ? '#FFFFFF' : 'var(--text-primary, #111415)',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  {part.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Orbs section */}
      <div style={{
        marginTop: '10px',
        borderTop: '1px solid var(--border, #e2e8f0)',
        paddingTop: '16px'
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '10px' }}>Progreso de Comensales</h4>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {participants.map(part => {
            const hasAllocations = part.totalAllocated > 0;
            return (
              <div 
                key={part.id} 
                className="participant-orb-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '70px'
                }}
              >
                <div 
                  className="participant-orb"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    backgroundColor: hasAllocations ? 'var(--bg-card-light, #F4F6F5)' : '#E2E8F0',
                    border: hasAllocations 
                      ? '2px solid var(--color-sage, #5F8575)' 
                      : '1.5px solid var(--border, #cbd5e0)',
                    color: 'var(--text-primary, #111415)',
                    boxShadow: 'none'
                  }}
                >
                  {part.name.charAt(0)}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'medium' }}>{part.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #718096)' }}>
                  {part.totalAllocated.toFixed(2)}€
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        {onBack && <button onClick={onBack} style={{ backgroundColor: 'transparent', border: '1px solid var(--border, #e2e8f0)', color: 'var(--text-primary)' }}>Atrás</button>}
        {onNext && <button onClick={onNext} style={{ backgroundColor: 'var(--color-sage, #5F8575)', color: '#FFFFFF' }}>Siguiente</button>}
      </div>
    </div>
  );
};
