import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import OfficialQuotationDocument from '../modules/quotation-viewer/components/OfficialQuotationDocument';
import { getPublicQuotation } from '../modules/quotation-viewer/services/publicQuotationService';
import '../styles/quotation-viewer.css';
import '../styles/public-quotation.css';

const PUBLIC_QUOTATION_REFRESH_MS = 45 * 60 * 1000;

function readProjectId() {
  const match = window.location.pathname.match(/^\/cotizaciones\/publicas\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function quotationDocumentKey(quotation) {
  const imageUrls = (quotation?.items || [])
    .flatMap((item) => (Array.isArray(item?.images) ? item.images : []))
    .map((image) => String(image?.url || '').trim())
    .filter(Boolean);

  return [quotation?.quotationId, quotation?.quotationNumber, ...imageUrls]
    .filter(Boolean)
    .join('|');
}

export default function PublicQuotation() {
  const projectId = useMemo(() => readProjectId(), []);
  const [quotation, setQuotation] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuotation = useCallback(async ({ initial = false } = {}) => {
    if (initial) {
      setQuotation(null);
      setPdfUrl('');
      setLoading(true);
    }

    setError(null);

    try {
      const result = await getPublicQuotation(projectId);
      setQuotation(result.quotation);
      setPdfUrl(result.pdfUrl);
    } catch (requestError) {
      setError(requestError);
    } finally {
      if (initial) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let active = true;

    const runInitialLoad = async () => {
      if (!active) return;
      await loadQuotation({ initial: true });
    };

    runInitialLoad();

    const refreshTimer = window.setInterval(() => {
      if (active && document.visibilityState === 'visible') {
        loadQuotation();
      }
    }, PUBLIC_QUOTATION_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (active && document.visibilityState === 'visible') {
        loadQuotation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadQuotation]);

  if (loading) {
    return <main className="public-quotation-state"><FileText size={34} /><strong>Cargando cotización…</strong></main>;
  }

  if (error || !quotation) {
    const unavailable = error?.status === 410;
    return (
      <main className="public-quotation-state public-quotation-error">
        <FileText size={34} />
        <strong>{unavailable ? 'Cotización no disponible' : 'Cotización no encontrada'}</strong>
        <p>{unavailable ? 'La cotización venció o dejó de estar disponible.' : 'Revisá que el enlace recibido esté completo.'}</p>
      </main>
    );
  }

  const downloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.print();
  };

  const documentKey = quotationDocumentKey(quotation);

  return (
    <main className="public-quotation-page">
      <div className="public-quotation-toolbar no-print">
        <div>
          <span>ELANVISUAL</span>
          <strong>{quotation.quotationNumber || 'Cotización'}</strong>
        </div>
        <button type="button" onClick={downloadPdf}>
          <Download size={19} /> {pdfUrl ? 'Descargar PDF' : 'Guardar como PDF'}
        </button>
      </div>
      <div className="public-quotation-document">
        <OfficialQuotationDocument key={documentKey} quotation={quotation} />
      </div>
    </main>
  );
}
