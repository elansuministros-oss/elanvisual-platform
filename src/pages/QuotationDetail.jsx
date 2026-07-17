import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import OfficialQuotationDocument from '../modules/quotation-viewer/components/OfficialQuotationDocument';
import { getQuotationDetail } from '../modules/quotation-viewer/services/quotationViewerService';
import '../styles/quotation-viewer.css';

const PUBLIC_QUOTATION_BASE_URL = 'https://visual.elankav.com/cotizaciones/publicas';

function readQuotationIdFromPath() {
  const match = window.location.pathname.match(/^\/cotizaciones\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function normalizeWhatsappPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 8) return `505${digits}`;
  if (digits.startsWith('505') && digits.length === 11) return digits;
  return digits.length >= 10 ? digits : '';
}

function buildPublicQuotationUrl(projectId) {
  const id = String(projectId || '').trim();
  return id ? `${PUBLIC_QUOTATION_BASE_URL}/${encodeURIComponent(id)}` : '';
}

function openWhatsappChat(phone, quotationNumber, projectId) {
  const target = normalizeWhatsappPhone(phone);
  if (!target) {
    window.alert('El cliente no tiene un numero de WhatsApp valido registrado.');
    return;
  }

  const publicUrl = buildPublicQuotationUrl(projectId);
  if (!publicUrl) {
    window.alert('No fue posible obtener el enlace publico de esta cotizacion.');
    return;
  }

  const message = [
    `Hola, le comparto la cotizacion ${quotationNumber || ''} de ELANVISUAL.`,
    '',
    'Puede verla aqui:',
    publicUrl
  ].join('\n');
  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${target}&text=${encodedMessage}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${target}&text=${encodedMessage}&type=phone_number&app_absent=0`;

  let fallbackTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.assign(webUrl);
    }
  }, 900);

  const clearFallback = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') clearFallback();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.location.href = appUrl;
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

  const handleDocumentClickCapture = (event) => {
    const button = event.target.closest('button');
    if (!button || !button.textContent?.toLowerCase().includes('whatsapp')) return;

    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    openWhatsappChat(
      quotation.customer?.phone,
      quotation.quotationNumber,
      quotation.projectId || quotation.project?.id || quotation.id
    );
  };

  return (
    <div onClickCapture={handleDocumentClickCapture}>
      <OfficialQuotationDocument quotation={quotation} onBack={onBack} />
    </div>
  );
}
