import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import QuotationCard from '../modules/quotation-viewer/components/QuotationCard';
import QuotationFilters from '../modules/quotation-viewer/components/QuotationFilters';
import { listQuotations } from '../modules/quotation-viewer/services/quotationViewerService';
import { useApp } from '../context/AppContext';
import '../styles/quotation-viewer.css';

const asSearchText = (quotation) => [
  quotation.quotationNumber,
  quotation.customer?.name,
  quotation.customer?.companyName,
  quotation.customer?.phone
].filter(Boolean).join(' ').toLowerCase();

const sellerIdentity = (usuario = {}) =>
  usuario?.vendedor_id || usuario?.vendedorId || usuario?.id || '';

export default function QuotationsViewer({ onOpenQuotation, onEditQuotation }) {
  const { usuario } = useApp();
  const role = String(usuario?.rol || '').trim().toLowerCase();
  const userId = role === 'ventas' ? sellerIdentity(usuario) : usuario?.id || '';
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const keepOwnForSeller = (rows) => {
    if (role !== 'ventas') return rows;
    if (!userId) return [];
    return rows.filter((quotation) => String(quotation.executiveId || '') === String(userId));
  };

  async function loadQuotations() {
    setLoading(true);
    setError('');
    try {
      const result = await listQuotations({ limit: 200, role, userId });
      setQuotations(keepOwnForSeller(result.quotations));
    } catch (loadError) {
      setQuotations([]);
      setError(loadError.message || 'No fue posible cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const result = await listQuotations({ limit: 200, role, userId });
        if (mounted) setQuotations(keepOwnForSeller(result.quotations));
      } catch (loadError) {
        if (mounted) {
          setQuotations([]);
          setError(loadError.message || 'No fue posible cargar las cotizaciones.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [role, userId]);

  const statusOptions = useMemo(() => {
    const values = new Set(quotations.map((quotation) => quotation.status).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return quotations.filter((quotation) => {
      const matchesSearch = !query || asSearchText(quotation).includes(query);
      const matchesStatus = !status || quotation.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, status]);

  return (
    <main className="qv-shell">
      <header className="qv-page-header">
        <div>
          <span>ELANVISUAL</span>
          <h1>{role === 'ventas' ? 'Mis cotizaciones' : 'Cotizaciones realizadas'}</h1>
          <p>{role === 'ventas' ? 'Solo se muestran las cotizaciones vinculadas a tu cuenta de ventas.' : 'Visor comercial conectado a CONNECT.'}</p>
        </div>
        <button type="button" onClick={loadQuotations} disabled={loading}>
          <RefreshCw size={18} /> Actualizar
        </button>
      </header>

      <QuotationFilters
        search={search}
        status={status}
        statusOptions={statusOptions}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <section className="qv-list-meta" aria-live="polite">
        <strong>{filteredQuotations.length}</strong>
        <span>{filteredQuotations.length === 1 ? 'cotizacion visible' : 'cotizaciones visibles'}</span>
      </section>

      {loading && (
        <section className="qv-state">
          <strong>Cargando cotizaciones...</strong>
          <p>Consultando CONNECT.</p>
        </section>
      )}

      {!loading && error && (
        <section className="qv-state qv-state-error">
          <strong>No se pudo cargar el listado.</strong>
          <p>{error}</p>
          <button type="button" onClick={loadQuotations}>Reintentar</button>
        </section>
      )}

      {!loading && !error && quotations.length === 0 && (
        <section className="qv-state">
          <strong>{role === 'ventas' ? 'No tenés cotizaciones asignadas.' : 'No hay cotizaciones realizadas.'}</strong>
          <p>{role === 'ventas' ? 'Cuando generes una cotización con tu cuenta aparecerá aquí.' : 'CONNECT no entregó registros para ELANVISUAL.'}</p>
        </section>
      )}

      {!loading && !error && quotations.length > 0 && filteredQuotations.length === 0 && (
        <section className="qv-state">
          <strong>Sin resultados.</strong>
          <p>No hay cotizaciones que coincidan con la busqueda actual.</p>
        </section>
      )}

      {!loading && !error && filteredQuotations.length > 0 && (
        <section className="qv-list">
          {filteredQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.id || quotation.quotationNumber}
              quotation={quotation}
              onOpen={onOpenQuotation}
              onEdit={onEditQuotation}
            />
          ))}
        </section>
      )}
    </main>
  );
}