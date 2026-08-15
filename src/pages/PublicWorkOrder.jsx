import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  FileText,
  ReceiptText,
  Wrench
} from 'lucide-react';

import {
  getPublicCustomerDossier
} from '../modules/quotation-viewer/services/publicQuotationService';

import '../styles/public-work-order.css';


function readAccessCode() {
  const match =
    window.location.pathname.match(
      /^\/ot\/([A-Za-z0-9_-]{22})\/?$/
    );

  return match
    ? match[1]
    : '';
}


function formatDate(value) {
  if (!value) {
    return 'Pendiente';
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return 'Pendiente';
  }

  return parsed.toLocaleDateString(
    'es-NI',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }
  );
}


export default function PublicWorkOrder() {
  const accessCode =
    useMemo(
      () => readAccessCode(),
      []
    );

  const [dossier, setDossier] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result =
          await getPublicCustomerDossier(
            accessCode
          );

        if (
          !result
            ?.documents
            ?.workOrder
        ) {
          throw new Error(
            'Este proyecto todavía no tiene una orden de trabajo pública.'
          );
        }

        if (active) {
          setDossier(result);
        }
      } catch (cause) {
        if (active) {
          setError(
            cause?.message ||
            'No fue posible consultar el seguimiento.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [accessCode]);


  if (loading) {
    return (
      <main className="
        public-ot-state
      ">
        Cargando seguimiento…
      </main>
    );
  }


  if (
    error ||
    !dossier
  ) {
    return (
      <main className="
        public-ot-state
        public-ot-error
      ">
        <Wrench size={34} />

        <strong>
          Seguimiento no disponible
        </strong>

        <p>{error}</p>
      </main>
    );
  }


  const ot =
    dossier.documents.workOrder;

  const receipts =
    dossier.documents.receipts || [];


  return (
    <main className="
      public-ot-page
    ">

      <section className="
        public-ot-card
      ">

        <header className="
          public-ot-header
        ">
          <div className="
            public-ot-brand
          ">
            <img
              src="/assets/branding/elanvisual.svg"
              alt="ELANVISUAL"
            />
          </div>

          <span>
            SEGUIMIENTO DEL PROYECTO
          </span>

          <h1>
            {ot.workOrderNumber}
          </h1>
        </header>


        <div className="
          public-ot-project
        ">
          <small>
            PROYECTO
          </small>

          <strong>
            {dossier.project.title}
          </strong>

          <span>
            {dossier.project.projectNumber}
          </span>
        </div>


        <div className="
          public-ot-status
        ">
          <small>
            ESTADO ACTUAL
          </small>

          <strong>
            {ot.statusLabel}
          </strong>
        </div>


        <div className="
          public-ot-grid
        ">
          <div>
            <span>
              Orden de trabajo
            </span>

            <strong>
              {ot.workOrderNumber}
            </strong>
          </div>

          <div>
            <span>
              Activación
            </span>

            <strong>
              {formatDate(
                ot.createdAt
              )}
            </strong>
          </div>

          <div>
            <span>
              Entrega estimada
            </span>

            <strong>
              {formatDate(
                ot.expectedDeliveryAt
              )}
            </strong>
          </div>

          <div>
            <span>
              Última actualización
            </span>

            <strong>
              {formatDate(
                ot.updatedAt
              )}
            </strong>
          </div>
        </div>


        <footer>
          <strong>
            ELANVISUAL
          </strong>

          <span>
            Seguimiento público del proyecto
          </span>
        </footer>

      </section>


      <nav className="
        public-ot-actions
        no-print
      ">

        <button
          type="button"
          onClick={() =>
            window.print()
          }
        >
          Descargar PDF
        </button>


        <a
          href={
            dossier.documents
              .quotation.viewUrl
          }
        >
          <FileText size={17} />

          Cotización
        </a>


        {receipts.map(
          (receipt) => (
            <a
              key={
                receipt.receiptNumber
              }
              href={
                receipt.viewUrl
              }
            >
              <ReceiptText size={17} />

              {receipt.receiptNumber}
            </a>
          )
        )}

      </nav>

    </main>
  );
}
