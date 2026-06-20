import React from 'react';

export default function PanelVentas({ setPage }) {
  return (
    <div className="crm-page" style={{ padding: 20 }}>
      <div className="crm-page-header">
        <div>
          <h2>Panel Comercial</h2>
          <p>Accesos del vendedor para operar clientes, cotizaciones y pedidos.</p>
        </div>
      </div>

      <div className="crm-grid">
        <button className="crm-card" type="button" onClick={() => setPage('clientes')}>
          <h3>Clientes</h3>
          <p>Ver y gestionar mis clientes.</p>
        </button>

        <button className="crm-card" type="button" onClick={() => setPage('capturaInteligente')}>
          <h3>Captura Inteligente</h3>
          <p>Registrar cliente nuevo rápidamente.</p>
        </button>

<button className="crm-card" type="button" onClick={() => setPage('aiStudio')}>
  <h3>AI Studio</h3>
  <p>Conversar con IA, crear proyectos y generar borradores de cotización.</p>
</button>

        <button className="crm-card" type="button" onClick={() => setPage('cotizador')}>
          <h3>Cotizador</h3>
          <p>Crear cotizaciones comerciales.</p>
        </button>

        <button className="crm-card" type="button" onClick={() => setPage('pedidos')}>
          <h3>Pedidos</h3>
          <p>Consultar pedidos asignados.</p>
        </button>

        <button className="crm-card" type="button" onClick={() => setPage('seguimiento')}>
          <h3>Seguimiento</h3>
          <p>Ver avances comerciales.</p>
        </button>
      </div>
    </div>
  );
}
