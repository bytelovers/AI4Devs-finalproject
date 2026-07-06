import React, { useState, useEffect } from 'react';
import { DemoOCR } from './components/DemoOCR';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    // Listen to custom pushState/replaceState events if triggered within the app
    window.addEventListener('pushstate-change', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate-change', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    // Dispatch custom event to notify other listeners if necessary
    window.dispatchEvent(new Event('pushstate-change'));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-body flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-secondary)] py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 
              onClick={() => navigate('/')}
              className="text-2xl font-bold tracking-tight text-[var(--color-sage)] cursor-pointer hover:opacity-85 select-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              SplitEat
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium">
              Offline-First PoC
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => navigate('/demo')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/demo' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              Demo OCR
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {currentPath === '/demo' ? (
          <DemoOCR />
        ) : (
          <div className="max-w-3xl mx-auto py-12 space-y-8">
            <section className="welcome-card p-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-md space-y-4" id="welcome-info-card">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--color-sage)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  ¡Proyecto inicializado con éxito!
                </h2>
                <div className="status-badge px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-900 text-xs font-semibold" id="status-badge-ready">
                  Listo para el MVP Offline
                </div>
              </div>
              
              <p className="text-[var(--text-secondary)] leading-relaxed">
                El andamiaje de la aplicación React + TypeScript + Vitest + Tokens CSS se ha configurado
                correctamente. El sistema está configurado para ejecutarse en modo cliente-servidor o 
                totalmente local/desconectado.
              </p>

              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Características del MVP Offline:</h3>
                <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-1.5">
                  <li>Procesamiento OCR offline directo en el navegador usando Tesseract.js.</li>
                  <li>Canvas local para binarización de imagen con algoritmos Otsu y control manual.</li>
                  <li>Base de datos IndexedDB local mediante Dexie.js para persistencia de tickets y participantes.</li>
                  <li>Orquestación en segundo plano con Web Workers y Comlink para una UI suave a 60fps.</li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => navigate('/demo')}
                  className="px-6 py-3 bg-[var(--color-sage)] hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
                >
                  Probar Demo OCR Pipeline
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)]">
        &copy; {new Date().getFullYear()} SplitEat — División inteligente de cuentas al céntimo.
      </footer>
    </div>
  );
};
