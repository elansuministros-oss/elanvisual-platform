import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import OfficialQuotationDocument from '../modules/quotation-viewer/components/OfficialQuotationDocument';
import { getQuotationDetail } from '../modules/quotation-viewer/services/quotationViewerService';
import '../styles/quotation-viewer.css';

function readQuotationIdFromPath() {
  const match = window.location.pathname.match(/^\/cotizaciones\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function QuotationDetail({ onBack }) {
  const quotationId = useMemo(() => readQuotationIdFromPath(), []);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      setError('');
      try {
        const detail = await getQuotationDetail(quotationId);
        if (mounted) setQuotation(detail);
      } catch (loadError) {
        if (mounted) {
          setQuotation(null);
          setError(loadError.message || 'No fue posible cargar la cotizacion.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      mounted = false;
    };
  }, [quotationId]);

  if (loading) {
    return (
      <main className="qv-shell">
        <section className="qv-state">
          <strong>Cargando cotizacion...</strong>
          <p>Consultando el detalle en el Orchestrator.</p>
        </section>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="qv-shell">
        <section className="qv-state qv-state-error">
          <strong>No se pudo cargar la cotizacion.</strong>
          <p>{error || 'No se recibio informacion del Orchestrator.'}</p>
          <button type="button" onClick={onBack}>
            <ArrowLeft size={18} /> Regresar al listado
          </button>
        </section>
      </main>
    );
  }

  return <OfficialQuotationDocument quotation={quotation} onBack={onBack} />;
}
