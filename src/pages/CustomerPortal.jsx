import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  FileText,
  FolderKanban,
  Search,
  ShieldCheck
} from 'lucide-react';

import {
  approvePublicCustomerQuotation,
  getPublicCustomerPortal
} from '../modules/quotation-viewer/services/publicQuotationService';

import '../styles/customer-portal.css';

const PHRASES = [
  'Las grandes ideas comienzan cuando decidimos hacerlas visibles.',
  'Tu marca habla antes que vos. Hagamos que diga algo extraordinario.',
  'Cada proyecto es una oportunidad para dejar una impresión memorable.',
  'Una buena idea merece una ejecución que esté a su altura.',
  'Lo que imaginás hoy puede convertirse en lo que todos recuerden mañana.',
  'Diseñar bien es convertir una necesidad en una experiencia.',
  'Tu proyecto merece claridad, seguimiento y una entrega a la altura.',
  'Cuando cada detalle cuenta, el resultado también se nota.',
  'Las marcas que se ven bien también se recuerdan mejor.',
  'Hagamos visible lo que hace especial a tu negocio.',
  'Cada espacio puede contar mejor la historia de tu marca.',
  'Una gran ejecución comienza con una decisión clara.'
];

function readAccessCode() {
  const match = window.location.pathname.match(
    /^\/c\/([A-Za-z0-9_-]{22})\/?$/
  );
  return match?.[1] || '';
}

function nextPhrase() {
  const key = 'elanvisual_customer_portal_phrase_index';
  let previous = Number(window.localStorage.getItem(key));

  if (!Number.isInteger(previous) || previous < 0) {
    previous = Math.floor(Math.random() * PHRASES.length);
  }

  const next = (previous + 1) % PHRASES.length;
  window.localStorage.setItem(key, String(next));
  return PHRASES[next];
}

function money(value) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0));
}

function date(value) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsed);
}

function statusLabel(value) {
  switch (String(value || '').toLowerCase()) {
    case 'sent': return 'Enviada';
    case 'approved': return 'Aprobada';
    case 'accepted': return 'Aprobada';
    case 'expired': return 'Vencida';
    case 'rejected': return 'No aprobada';
    case 'cancelled': return 'Cancelada';
    default: return 'En seguimiento';
  }
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (['approved', 'accepted'].includes(normalized)) return 'is-approved';
  if (['expired', 'rejected', 'cancelled'].includes(normalized)) return 'is-muted';
  return 'is-active';
}

export default function CustomerPortal() {
  const accessCode = useMemo(() => readAccessCode(), []);
  const [portal, setPortal] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);
  const [approvalError, setApprovalError] = useState('');
  const [phrase] = useState(() => nextPhrase());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        const data = await getPublicCustomerPortal(accessCode);
        if (!cancelled) setPortal(data);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause?.message ||
            'No fue posible abrir tu espacio ELANVISUAL.'
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accessCode]);

  const projects = useMemo(() => {
    const items = Array.isArray(portal?.projects)
      ? portal.projects
      : [];

    const term = query.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      [
        item.projectTitle,
        item.projectNumber,
        item.quotationNumber
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [portal, query]);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (item) => item.quotationId === selectedQuotationId
      ) || null,
    [projects, selectedQuotationId]
  );

  async function approveSelectedQuotation() {
    if (!selectedProject || approvalBusy) return;

    const confirmed = window.confirm(
      `¿Aprobar la cotización ${selectedProject.quotationNumber} por ${money(selectedProject.totalUsd)}?`
    );

    if (!confirmed) return;

    setApprovalBusy(true);
    setApprovalError('');
    setApprovalResult(null);

    try {
      const result = await approvePublicCustomerQuotation(
        accessCode,
        selectedProject.quotationId
      );

      setPortal((current) => ({
        ...current,
        projects: (current?.projects || []).map((item) =>
          item.quotationId === selectedProject.quotationId
            ? { ...item, status: 'approved' }
            : item
        )
      }));

      setApprovalResult(result);
    } catch (cause) {
      setApprovalError(
        cause?.message ||
        'No fue posible aprobar la cotización.'
      );
    } finally {
      setApprovalBusy(false);
    }
  }

  if (error) {
    return (
      <main className="customer-portal customer-portal-state">
        <img
          className="customer-portal-state-logo"
          src="/assets/branding/elanvisual.svg"
          alt="ELANVISUAL"
        />
        <div className="customer-portal-state-card">
          <ShieldCheck size={32} />
          <h1>Espacio no disponible</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!portal) {
    return (
      <main className="customer-portal customer-portal-state">
        <img
          className="customer-portal-state-logo"
          src="/assets/branding/elanvisual.svg"
          alt="ELANVISUAL"
        />
        <div className="customer-portal-loader" />
        <p>Preparando tu espacio ELANVISUAL…</p>
      </main>
    );
  }

  const customerName =
    portal?.customer?.name ||
    'Cliente ELANVISUAL';

  return (
    <main className="customer-portal">
      <section className="customer-portal-hero">
        <div className="customer-portal-hero-copy">
          <img
            className="customer-portal-logo"
            src="/assets/branding/elanvisual.svg"
            alt="ELANVISUAL"
          />

          <div className="customer-portal-safe">
            <ShieldCheck size={15} />
            Espacio privado de cliente
          </div>

          <p className="customer-portal-eyebrow">
            Bienvenido a tu espacio ELANVISUAL
          </p>

          <h1>
            Hola, <span>{customerName}</span>
          </h1>

          <p className="customer-portal-intro">
            Aquí podés consultar tus cotizaciones y proyectos
            desde un solo lugar, siempre con el mismo enlace.
          </p>

          <blockquote className="customer-portal-quote">
            “{phrase}”
          </blockquote>
        </div>

        <div className="customer-portal-robot-wrap">
          <div className="customer-portal-robot-glow" />
          <img
            className="customer-portal-robot"
            src="/assets/branding/elan-ai-customer-portal.png"
            alt="ELAN AI"
          />
        </div>
      </section>

      <section className="customer-portal-content">
        <div className="customer-portal-heading">
          <div>
            <span className="customer-portal-section-kicker">
              Tus proyectos
            </span>
            <h2>Cotizaciones y seguimiento</h2>
            <p>
              {portal?.counts?.quotations || 0}
              {' '}
              {Number(portal?.counts?.quotations || 0) === 1
                ? 'cotización disponible'
                : 'cotizaciones disponibles'}
            </p>
          </div>

          <label className="customer-portal-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar proyecto o cotización"
              aria-label="Buscar proyecto o cotización"
            />
          </label>
        </div>

        {projects.length > 0 && (
          <label className="customer-portal-select-wrap">
            <span>Seleccioná una cotización</span>
            <select
              value={selectedQuotationId}
              onChange={(event) =>
                setSelectedQuotationId(event.target.value)
              }
            >
              <option value="">
                Elegí un proyecto
              </option>
              {projects.map((item) => (
                <option
                  key={item.quotationId}
                  value={item.quotationId}
                >
                  {item.projectTitle}
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedProject && (
          <section className="customer-portal-selected">
            <div className="customer-portal-selected-head">
              <div>
                <span className="customer-portal-selected-label">
                  Proyecto seleccionado
                </span>
                <h3>{selectedProject.projectTitle}</h3>
              </div>

              <span
                className={
                  'customer-portal-status ' +
                  statusClass(selectedProject.status)
                }
              >
                {statusLabel(selectedProject.status)}
              </span>
            </div>

            <div className="customer-portal-row-meta">
              <span>
                <FileText size={15} />
                {selectedProject.quotationNumber}
              </span>
              <span>{date(selectedProject.issuedAt)}</span>
              <strong>{money(selectedProject.totalUsd)}</strong>
            </div>

            <div className="customer-portal-row-actions">
              {selectedProject.viewUrl && (
                <a
                  className="customer-portal-open customer-portal-open-secondary"
                  href={selectedProject.viewUrl}
                >
                  Abrir cotización
                  <ArrowRight size={17} />
                </a>
              )}

              {String(selectedProject.status || '').toLowerCase() === 'sent' && (
                <button
                  className="customer-portal-approve"
                  type="button"
                  disabled={approvalBusy}
                  onClick={approveSelectedQuotation}
                >
                  {approvalBusy
                    ? 'Aprobando…'
                    : 'Aprobar cotización'}
                </button>
              )}
            </div>

            {approvalError && (
              <p className="customer-portal-approval-message is-error">
                {approvalError}
              </p>
            )}

            {approvalResult && (
              <div className="customer-portal-approval-message is-success">
                <strong>Cotización aprobada correctamente.</strong>
                <span>
                  Los términos de pago de esta cotización quedan vigentes para continuar el proyecto.
                </span>
              </div>
            )}
          </section>
        )}

        {!projects.length && (
          <div className="customer-portal-empty">
            <FolderKanban size={30} />
            <h3>No encontramos proyectos</h3>
            <p>
              Probá con otro nombre o número de cotización.
            </p>
          </div>
        )}
      </section>

      <footer className="customer-portal-footer">
        <img
          src="/assets/branding/elanvisual-isotipo.svg"
          alt=""
        />
        <span>
          ELANVISUAL · Comunicación Visual Nicaragua
        </span>
      </footer>
    </main>
  );
}
