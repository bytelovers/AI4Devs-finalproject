import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './styles/global.css';

const App = () => {
  return (
    <main className="app-container" id="app-root-main">
      <header className="app-header">
        <h1 className="logo">SplitEat</h1>
        <p className="subtitle">División inteligente de cuentas al céntimo</p>
      </header>
      <section className="welcome-card" id="welcome-info-card">
        <h2>¡Proyecto inicializado con éxito!</h2>
        <p>
          El andamiaje de la aplicación React + TypeScript + Vitest + Tokens CSS se ha configurado
          correctamente.
        </p>
        <div className="status-badge" id="status-badge-ready">Listo para el MVP Offline</div>
      </section>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
