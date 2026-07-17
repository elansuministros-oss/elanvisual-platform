import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import OfficialQuotationDocument from '../modules/quotation-viewer/components/OfficialQuotationDocument';
import { getPublicQuotation } from '../modules/quotation-viewer/services/publicQuotationService';
import '../styles/quotation-viewer.css';
import '../styles/public-quotation.css';

function readProjectId() {
  const match = window.location.pathname.match(/^\/cotizaciones\/publicas\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function PublicQuotation() {
  const projectId = useMemo(() => readProjectId(), []);
  const [quotation, setQuotation] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicQuotation(projectId)
      .then((result) => {
        if (!active) return;
        setQuotation(result.quotation);
        setPdfUrl(result.pdfUrl);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [projectId]);

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
        <OfficialQuotationDocument quotation={quotation} />
      </div>
    </main>
  );
}