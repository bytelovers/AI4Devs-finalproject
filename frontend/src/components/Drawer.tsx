/**
 * Drawer — Side navigation drawer with ThemeSelector in footer.
 * Accessible navigation drawer component for SplitEat.
 */

import React, { useEffect, useRef } from 'react';
import { ThemeSelector } from './ThemeSelector';

interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/scan', label: 'Escanear Ticket', icon: '📷' },
  { href: '/allocation', label: 'Asignar Platos', icon: '🍽️' },
  { href: '/billing', label: 'Facturación', icon: '💳' },
  { href: '/wheel', label: 'Ruleta del Pagador', icon: '🎡' },
];

interface DrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
}

export function Drawer({ isOpen, onClose }: DrawerProps): React.ReactElement {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Trap focus inside drawer and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    firstFocusableRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        aria-hidden="true"
        className={`drawer-backdrop ${isOpen ? 'drawer-backdrop--visible' : ''}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <nav
        id="main-drawer"
        ref={drawerRef}
        role="navigation"
        aria-label="Menú de navegación principal"
        aria-hidden={!isOpen}
        className={`drawer ${isOpen ? 'drawer--open' : ''}`}
      >
        {/* Drawer header */}
        <div className="drawer-header">
          <span className="drawer-title">SplitEat</span>
          <button
            ref={firstFocusableRef}
            type="button"
            aria-label="Cerrar menú"
            className="drawer-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Navigation links */}
        <ul className="drawer-nav-list" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="drawer-nav-link"
                onClick={onClose}
              >
                {link.icon && (
                  <span className="drawer-nav-icon" aria-hidden="true">
                    {link.icon}
                  </span>
                )}
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Drawer footer — theme selector */}
        <div className="drawer-footer">
          <ThemeSelector />
        </div>
      </nav>
    </>
  );
}

export default Drawer;
