import React from 'react';
import { BadgeDollarSign, MessageCircle, ShieldCheck, Users, FileText } from 'lucide-react';

export default function CotizadorVendedorSeguro({ setPage }) {
  return (
    <main className="qv-shell">
      <header className="qv-page-header">
        <div>
          <span>ELANVISUAL · VENTAS</span>
          <h1>Cotizar con precios autorizados</h1>
          <p>Como ejecutiva de ventas no podés escribir ni inventar precios manualmente.</p>
        </div>
      </header>

      <section className="qv-state" style={{ textAlign: 'left', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ShieldCheck size={24} />
          <strong>Regla comercial</strong>
        </div>
        <p>
          Los precios salen de la autoridad oficial de ELANVISUAL/CONNECT. Si una tarifa es “desde”,
          ELAN la usa solamente como referencia mínima y te pedirá los datos necesarios antes de
          generar un precio final y una cotización formal.
        </p>
      </section>

      <section className="qv-list" style={{ marginTop: 18 }}>
        <article className="qv-state" style={{ textAlign: 'left', alignItems: 'stretch' }}>
          <MessageCircle size={24} />
          <strong>Cotizá hablando con ELAN por WhatsApp</strong>
          <p>
            Escribile a ELAN como hablás normalmente. No necesitás memorizar comandos. Por ejemplo:
            “cotizale a María un roll up de 85 x 200” o “cuánto vale un rótulo botón de 60 x 60”.
            ELAN resolverá internamente cliente, producto y precio autorizado.
          </p>
        </article>

        <article className="qv-state" style={{ textAlign: 'left', alignItems: 'stretch' }}>
          <BadgeDollarSign size={24} />
          <strong>ELAN valida el precio</strong>
          <p>
            ELAN buscará el producto autorizado y solicitará medidas, acabado, cantidad, interior/exterior
            u otra condición cuando sea necesaria. No existe un campo libre para que el vendedor defina el precio.
          </p>
        </article>
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
        <button type="button" className="primary-btn" onClick={() => setPage?.('clientes')}>
          <Users size={18} /> Mis clientes
        </button>
        <button type="button" className="secondary-btn" onClick={() => setPage?.('cotizaciones')}>
          <FileText size={18} /> Mis cotizaciones
        </button>
      </section>
    </main>
  );
}
