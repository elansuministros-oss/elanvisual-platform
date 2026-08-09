import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, FileText, ShoppingCart } from 'lucide-react';
import OfficialQuotationDocument from '../modules/quotation-viewer/components/OfficialQuotationDocument';
import CustomerPaymentsPanel from '../modules/quotation-viewer/components/CustomerPaymentsPanel';
import ProcurementPanel from '../modules/quotation-viewer/components/ProcurementPanel';
import { getQuotationDetail } from '../modules/quotation-viewer/services/quotationViewerService';
import {
  createWorkOrder,
  listPurchaseOrders,
  listWorkOrders
} from '../modules/quotation-viewer/services/operationalOrdersService';
import '../styles/quotation-viewer.css';
import '../styles/operational-flow.css';

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
    if (document.visibilityState === 'visible') window.location.assign(webUrl);
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

function OperationalFlowPanel({ projectId, workOrders, purchaseOrders, loading, error, onGenerateWorkOrder, procurementOpen, onToggleProcurement }) {
  const [showWorkOrders, setShowWorkOrders] = useState(false);
  const workOrder = workOrders[0] || null;

  return (
    <section className="qv-operational-panel" aria-label="Flujo operativo del proyecto">
      <div className="qv-operational-heading">
        <div>
          <span className="qv-eyebrow">Proyecto operativo</span>
          <h2>OT y Compras</h2>
          <p>{projectId}</p>
        </div>
        {loading && <small>Actualizando...</small>}
      </div>

      {error && <div className="qv-operational-error">{error}</div>}

      <div className="qv-operational-actions">
        <button type="button" className="qv-card-action" onClick={() => document.getElementById('documento-cotizacion')?.scrollIntoView({ behavior: 'smooth' })}>
          Ver cotizacion <FileText size={18} />
        </button>
        {!workOrder ? (
          <button type="button" className="qv-card-action" onClick={onGenerateWorkOrder} disabled={loading}>
            Generar OT <ClipboardList size={18} />
          </button>
        ) : (
          <button type="button" className="qv-card-action" onClick={() => setShowWorkOrders((value) => !value)}>
            Ver OT <ClipboardList size={18} />
          </button>
        )}
        <button type="button" className="qv-card-action" onClick={onToggleProcurement} disabled={loading}>
          {procurementOpen ? 'Cerrar Compras' : 'Compras / Abastecimiento'} <ShoppingCart size={18} />
        </button>
      </div>

      {showWorkOrders && workOrder && (
        <div className="qv-operational-record">
          <strong>{workOrder.workOrderNumber}</strong>
          <span>Estado: {workOrder.status}</span>
          <span>Proyecto: {workOrder.projectId}</span>
          <span>OC: {purchaseOrders.length}</span>
        </div>
      )}
    </section>
  );
}

export default function QuotationDetail({ onBack }) {
  const quotationId = useMemo(() => readQuotationIdFromPath(), []);
  const [quotation, setQuotation] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [procurementOpen, setProcurementOpen] = useState(false);
  const [error, setError] = useState('');
  const [operationError, setOperationError] = useState('');

  async function loadOperations(projectId) {
    if (!projectId) return;
    setOperationsLoading(true);
    setOperationError('');
    try {
      const [workOrderRows, purchaseOrderRows] = await Promise.all([
        listWorkOrders(projectId),
        listPurchaseOrders(projectId)
      ]);
      setWorkOrders(Array.isArray(workOrderRows) ? workOrderRows : []);
      setPurchaseOrders(Array.isArray(purchaseOrderRows) ? purchaseOrderRows : []);
    } catch (loadError) {
      setOperationError(loadError.message || 'No fue posible consultar OT y OC.');
    } finally {
      setOperationsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      setError('');
      try {
        const detail = await getQuotationDetail(quotationId);
        if (mounted) {
          setQuotation(detail);
          await loadOperations(detail.projectId || detail.project?.id || detail.id);
        }
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
    return () => { mounted = false; };
  }, [quotationId]);

  if (loading) {
    return (
      <main className="qv-shell">
        <section className="qv-state">
          <strong>Cargando cotizacion...</strong>
          <p>Consultando el detalle operativo.</p>
        </section>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="qv-shell">
        <section className="qv-state qv-state-error">
          <strong>No se pudo cargar la cotizacion.</strong>
          <p>{error || 'No se recibio informacion de la cotizacion.'}</p>
          <button type="button" onClick={onBack}>
            <ArrowLeft size={18} /> Regresar al listado
          </button>
        </section>
      </main>
    );
  }

  const projectId = quotation.projectId || quotation.project?.id || quotation.id;
  const workOrder = workOrders[0] || null;

  const handleGenerateWorkOrder = async () => {
    setOperationsLoading(true);
    setOperationError('');
    try {
      await createWorkOrder(projectId, quotation.quotationId);
      await loadOperations(projectId);
      setProcurementOpen(true);
    } catch (createError) {
      setOperationError(createError.message || 'No fue posible generar la OT.');
      setOperationsLoading(false);
    }
  };

  const handleDocumentClickCapture = (event) => {
    const button = event.target.closest('button');
    if (!button || !button.closest('#documento-cotizacion') || !button.textContent?.toLowerCase().includes('whatsapp')) return;

    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    openWhatsappChat(
      quotation.customer?.phone,
      quotation.quotationNumber,
      projectId
    );
  };

  return (
    <div onClickCapture={handleDocumentClickCapture}>
      <main className="qv-shell">
        <CustomerPaymentsPanel
          projectId={projectId}
          quotation={quotation}
          onDepositCompleted={() => loadOperations(projectId)}
        />
        <OperationalFlowPanel
          projectId={projectId}
          workOrders={workOrders}
          purchaseOrders={purchaseOrders}
          loading={operationsLoading}
          error={operationError}
          onGenerateWorkOrder={handleGenerateWorkOrder}
          procurementOpen={procurementOpen}
          onToggleProcurement={() => setProcurementOpen((value) => !value)}
        />
        {procurementOpen && (
          <ProcurementPanel
            projectId={projectId}
            workOrder={workOrder}
            purchaseOrders={purchaseOrders}
            onRefresh={() => loadOperations(projectId)}
          />
        )}
      </main>
      <div id="documento-cotizacion">
        <OfficialQuotationDocument quotation={quotation} onBack={onBack} />
      </div>
    </div>
  );
}
