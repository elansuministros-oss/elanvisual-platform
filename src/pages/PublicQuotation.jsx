import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Download,
  FileText,
  ReceiptText,
  Wrench
} from 'lucide-react';

import OfficialQuotationDocument
  from '../modules/quotation-viewer/components/OfficialQuotationDocument';

import {
  getPublicQuotation,
  getPublicCustomerDossier
} from '../modules/quotation-viewer/services/publicQuotationService';

import '../styles/quotation-viewer.css';
import '../styles/public-quotation.css';

const PUBLIC_REFRESH_MS = 10 * 60 * 1000;

function readPublicKey() {
  const pathname =
    window.location.pathname || '';

  const match =
    pathname.match(/^\/q\/([^/?#]+)/) ||
    pathname.match(
      /^\/cotizaciones\/publicas\/([^/?#]+)/
    );

  return match
    ? decodeURIComponent(match[1])
    : '';
}

function isCustomerAccessCode(value) {
  return /^[A-Za-z0-9_-]{22}$/.test(
    String(value || '').trim()
  );
}

function quotationDocumentKey(quotation) {
  const imageUrls =
    (quotation?.items || [])
      .flatMap((item) =>
        Array.isArray(item?.images)
          ? item.images
          : []
      )
      .map((image) =>
        String(image?.url || '').trim()
      )
      .filter(Boolean);

  return [
    quotation?.quotationId,
    quotation?.quotationNumber,
    ...imageUrls
  ]
    .filter(Boolean)
    .join('|');
}

function money(value) {
  return new Intl.NumberFormat(
    'es-NI',
    {
      style: 'currency',
      currency: 'USD'
    }
  ).format(Number(value || 0));
}

export default function PublicQuotation() {
  const publicKey =
    useMemo(
      () => readPublicKey(),
      []
    );

  const connectedMode =
    isCustomerAccessCode(publicKey);

  const [quotation, setQuotation] =
    useState(null);

  const [dossier, setDossier] =
    useState(null);

  const [pdfUrl, setPdfUrl] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const loadQuotation =
    useCallback(
      async ({ initial = false } = {}) => {
        if (initial) {
          setQuotation(null);
          setDossier(null);
          setPdfUrl('');
          setLoading(true);
        }

        setError(null);

        try {
          if (connectedMode) {
            const result =
              await getPublicCustomerDossier(
                publicKey
              );

            setDossier(result);
            setQuotation(result.quotation);
            setPdfUrl('');
          } else {
            /*
             * Compatibilidad con enlaces históricos UUID.
             */
            const result =
              await getPublicQuotation(
                publicKey
              );

            const canonicalPublicUrl =
              String(result.publicUrl || '').trim();

            const canonicalMatch =
              canonicalPublicUrl.match(
                /\/q\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/
              );

            if (canonicalMatch) {
              const shortPath =
                `/q/${canonicalMatch[1]}`;

              if (
                window.location.pathname !== shortPath
              ) {
                window.location.replace(shortPath);
                return;
              }
            }

            setQuotation(result.quotation);
            setPdfUrl(result.pdfUrl);
          }
        } catch (cause) {
          setError(cause);
        } finally {
          if (initial) {
            setLoading(false);
          }
        }
      },
      [publicKey, connectedMode]
    );

  useEffect(() => {
    let active = true;

    void loadQuotation({
      initial: true
    });

    const timer =
      window.setInterval(
        () => {
          if (
            active &&
            document.visibilityState ===
              'visible'
          ) {
            void loadQuotation();
          }
        },
        PUBLIC_REFRESH_MS
      );

    const handleVisibility = () => {
      if (
        active &&
        document.visibilityState ===
          'visible'
      ) {
        void loadQuotation();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      active = false;

      window.clearInterval(timer);

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [loadQuotation]);

  if (loading) {
    return (
      <main className="public-quotation-state">
        <FileText size={34} />
        <strong>
          Cargando cotización…
        </strong>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="
        public-quotation-state
        public-quotation-error
      ">
        <FileText size={34} />

        <strong>
          Cotización no disponible
        </strong>

        <p>
          Revisá que el enlace recibido
          esté completo.
        </p>
      </main>
    );
  }

  /*
   * iPhone / Safari:
   * si existe PDF real navegamos directamente;
   * no usamos window.open().
   */
  const downloadQuotation = () => {
    if (pdfUrl) {
      window.location.assign(pdfUrl);
      return;
    }

    window.print();
  };

  const documents =
    dossier?.documents || {};

  const workOrder =
    documents.workOrder || null;

  const receipts =
    Array.isArray(documents.receipts)
      ? documents.receipts
      : [];

  return (
    <main className="public-quotation-page">

      <div className="
        public-quotation-toolbar
        no-print
      ">
        <div>
          <span>ELANVISUAL</span>

          <strong>
            {quotation.quotationNumber ||
             'Cotización'}
          </strong>
        </div>

        <button
          type="button"
          onClick={downloadQuotation}
        >
          <Download size={19} />

          Descargar cotización PDF
        </button>
      </div>


      <div className="
        public-quotation-document
      ">
        <OfficialQuotationDocument
          key={
            quotationDocumentKey(
              quotation
            )
          }
          quotation={quotation}
          dossier={dossier}
        />
      </div>


      {connectedMode && (
        <section className="
          customer-dossier
          no-print
        ">
          <header className="
            customer-dossier-heading
          ">
            <span>
              EXPEDIENTE DEL PROYECTO
            </span>

            <h2>
              Documentos y seguimiento
            </h2>

            <p>
              Este mismo enlace se
              actualiza automáticamente
              cuando existan nuevos
              documentos.
            </p>
          </header>


          {workOrder && (
            <article className="
              customer-document-card
            ">
              <Wrench size={23} />

              <div>
                <span>
                  ORDEN DE TRABAJO
                </span>

                <strong>
                  {workOrder.workOrderNumber}
                </strong>

                <small>
                  {workOrder.statusLabel}
                </small>
              </div>

              <a href={workOrder.viewUrl}>
                Ver seguimiento
              </a>
            </article>
          )}


          {receipts.length > 0 && (
            <div className="
              customer-receipts
            ">
              <h3>Recibos</h3>

              {receipts.map(
                (receipt) => (
                  <article
                    className="
                      customer-document-card
                    "
                    key={
                      receipt.receiptNumber
                    }
                  >
                    <ReceiptText size={23} />

                    <div>
                      <span>
                        RECIBO
                      </span>

                      <strong>
                        {receipt.receiptNumber}
                      </strong>

                      <small>
                        {money(
                          receipt.amountUsd
                        )}
                      </small>
                    </div>

                    <a
                      href={
                        receipt.viewUrl
                      }
                    >
                      Ver / descargar
                    </a>
                  </article>
                )
              )}
            </div>
          )}

        </section>
      )}

    </main>
  );
}
