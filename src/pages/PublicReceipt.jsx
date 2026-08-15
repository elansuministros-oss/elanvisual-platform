import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import '../styles/public-receipt.css';

import {
  getPublicCustomerDossier
} from '../modules/quotation-viewer/services/publicQuotationService';

const CONNECT_BASE_URL =
  'https://connect.elankav.com';

const PLATFORM_URL =
  'https://visual.elankav.com';

const PHONE_DISPLAY =
  '+505 7882 8089';

const PHONE_LINK =
  'tel:+50578828089';

const OFFICIAL_LOGO =
  '/assets/branding/visualkav.svg';

const money = (
  value,
  currency = 'USD'
) =>
  new Intl.NumberFormat(
    'es-NI',
    {
      style: 'currency',
      currency
    }
  ).format(Number(value || 0));


function paymentTypeLabel(value) {
  if (value === 'deposit') {
    return 'Anticipo';
  }

  if (value === 'balance') {
    return 'Cancelación';
  }

  if (value === 'refund') {
    return 'Reembolso';
  }

  return 'Pago';
}


function paymentMethodLabel(value) {
  if (
    value === 'bank_transfer' ||
    value === 'transfer'
  ) {
    return 'Transferencia / depósito bancario';
  }

  if (
    value === 'electronic_withdrawal'
  ) {
    return 'Retiro sin tarjeta / electrónico';
  }

  if (value === 'cash') {
    return 'Efectivo';
  }

  if (value === 'card') {
    return 'Tarjeta';
  }

  if (value === 'cheque') {
    return 'Cheque';
  }

  if (value === 'other') {
    return 'Otro';
  }

  return value || 'No especificado';
}


function Row({
  label,
  value,
  strong = false
}) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  return (
    <div>
      <span>{label}</span>

      <strong
        className={
          strong
            ? 'receipt-amount'
            : ''
        }
      >
        {value}
      </strong>
    </div>
  );
}


function readRoute() {
  const pathname =
    String(
      window.location.pathname || ''
    );

  const shortMatch =
    pathname.match(
      /^\/r\/([A-Za-z0-9_-]{22})\/(\d{10})\/?$/
    );

  if (shortMatch) {
    return {
      mode: 'connected',
      accessCode: shortMatch[1],
      receiptCode: shortMatch[2],
      receiptNumber: ''
    };
  }

  const legacy =
    pathname
      .replace(/^\/+|\/+$/g, '')
      .toUpperCase();

  return {
    mode: 'legacy',
    accessCode: '',
    receiptCode: '',
    receiptNumber: legacy
  };
}


export default function PublicReceipt() {
  const route =
    useMemo(
      () => readRoute(),
      []
    );

  const [receipt, setReceipt] =
    useState(null);

  const [dossier, setDossier] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        let receiptNumber =
          route.receiptNumber;

        let dossierResult = null;

        if (
          route.mode === 'connected'
        ) {
          dossierResult =
            await getPublicCustomerDossier(
              route.accessCode
            );

          const relatedReceipt =
            (
              dossierResult
                ?.documents
                ?.receipts || []
            ).find(
              (entry) =>
                String(
                  entry.receiptCode || ''
                ) === route.receiptCode
            );

          if (!relatedReceipt) {
            throw new Error(
              'El recibo no pertenece a este expediente.'
            );
          }

          receiptNumber =
            relatedReceipt.receiptNumber;

          if (active) {
            setDossier(
              dossierResult
            );
          }
        }


        if (
          !/^ELV-REC-\d{4}-\d{6}$/.test(
            String(
              receiptNumber || ''
            ).toUpperCase()
          )
        ) {
          throw new Error(
            'Número de recibo ELANVISUAL no válido.'
          );
        }


        const response =
          await fetch(
            `${CONNECT_BASE_URL}` +
            `/api/v1/business/vqs/public/receipts/` +
            encodeURIComponent(
              receiptNumber
            ),
            {
              cache: 'no-store'
            }
          );


        const payload =
          await response
            .json()
            .catch(() => ({}));


        if (!response.ok) {
          throw new Error(
            payload?.error?.message ||
            'No fue posible consultar el recibo.'
          );
        }


        if (
          payload?.data?.platform &&
          String(
            payload.data.platform
          ).toUpperCase() !==
            'ELANVISUAL'
        ) {
          throw new Error(
            'Este recibo pertenece a otra plataforma ELANKAV.'
          );
        }


        if (active) {
          setReceipt(
            payload?.data || null
          );
        }

      } catch (cause) {
        if (active) {
          setError(
            cause?.message ||
            'No fue posible consultar el recibo.'
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
  }, [route]);


  if (loading) {
    return (
      <main className="
        public-receipt-shell
      ">
        <div className="
          receipt-status
        ">
          Cargando recibo…
        </div>
      </main>
    );
  }


  if (error || !receipt) {
    return (
      <main className="
        public-receipt-shell
      ">
        <div className="
          receipt-status
          receipt-error
        ">
          <strong>
            Recibo no disponible
          </strong>

          <span>
            {error ||
             'No encontramos este recibo.'}
          </span>
        </div>
      </main>
    );
  }


  const isPaid =
    Number(
      receipt.pendingBalanceUsd || 0
    ) <= 0.009 &&
    Number(
      receipt.quotationTotalUsd || 0
    ) > 0;


  const originalCurrency =
    String(
      receipt.originalCurrency ||
      'USD'
    ).toUpperCase();


  const isNio =
    originalCurrency === 'NIO';


  const isWithdrawal =
    String(
      receipt.paymentMethod || ''
    ).toLowerCase() ===
      'electronic_withdrawal';


  const priorPaidUsd =
    Number(
      receipt.priorPaidUsd || 0
    );


  const relatedReceipts =
    dossier?.documents?.receipts ||
    [];


  return (
    <main className="
      public-receipt-shell
    ">

      <section className="
        public-receipt-card
      ">

        <header className="
          receipt-head
        ">
          <div className="
            receipt-brand-box
          ">
            <img
              className="
                receipt-brand-logo
              "
              src={OFFICIAL_LOGO}
              alt="Visual KAV"
            />
          </div>

          <span>
            RECIBO OFICIAL
          </span>

          <h1>
            {receipt.receiptNumber}
          </h1>
        </header>


        <div className="receipt-body">

          <div className="
            receipt-project
          ">
            <small>
              PROYECTO
            </small>

            <strong>
              {receipt.projectName ||
               'Proyecto ELANVISUAL'}
            </strong>
          </div>


          <h2 className="
            receipt-section-title
          ">
            Datos del documento
          </h2>

          <div className="
            receipt-grid
          ">
            <Row
              label="Tipo de pago"
              value={
                paymentTypeLabel(
                  receipt.paymentType
                )
              }
            />

            <Row
              label="Cotización"
              value={
                receipt.quotationNumber
              }
            />

            <Row
              label="Fecha de pago"
              value={
                new Date(
                  receipt.paidAt
                ).toLocaleString(
                  'es-NI'
                )
              }
            />

            <Row
              label="Cliente"
              value={
                receipt.customerName
              }
            />

            <Row
              label="Empresa"
              value={
                receipt.companyName
              }
            />

            <Row
              label="Ejecutivo"
              value={
                receipt.executiveName
              }
            />
          </div>


          <h2 className="
            receipt-section-title
          ">
            Detalle del pago
          </h2>

          <div className="
            receipt-grid
          ">
            <Row
              label="Forma de pago"
              value={
                paymentMethodLabel(
                  receipt.paymentMethod
                )
              }
            />

            <Row
              label="Banco"
              value={
                receipt.bankName
              }
            />

            <Row
              label={
                isWithdrawal
                  ? 'Referencia / operación'
                  : 'Referencia bancaria'
              }
              value={
                receipt.paymentReference
              }
            />

            {isNio && (
              <Row
                label="Monto recibido"
                value={
                  money(
                    receipt.originalAmount,
                    'NIO'
                  )
                }
                strong
              />
            )}

            {isNio && (
              <Row
                label="Tipo de cambio"
                value={
                  `C$ ${Number(
                    receipt.exchangeRate ||
                    0
                  ).toFixed(4)} / USD`
                }
              />
            )}

            <Row
              label={
                isNio
                  ? 'Monto aplicado'
                  : 'Monto recibido'
              }
              value={
                money(
                  receipt.amountUsd,
                  'USD'
                )
              }
              strong
            />
          </div>


          <h2 className="
            receipt-section-title
          ">
            Resumen al emitir este recibo
          </h2>

          <div className="
            receipt-grid
            receipt-financial
          ">
            <Row
              label="Total de la cotización"
              value={
                money(
                  receipt.quotationTotalUsd
                )
              }
            />

            <Row
              label="Abonos anteriores"
              value={
                money(priorPaidUsd)
              }
            />

            <Row
              label="Este pago"
              value={
                money(receipt.amountUsd)
              }
            />

            <Row
              label="Pagado acumulado"
              value={
                money(
                  receipt.totalPaidUsd
                )
              }
            />

            <Row
              label="Saldo después de este pago"
              value={
                money(
                  receipt.pendingBalanceUsd
                )
              }
              strong
            />
          </div>


          {receipt.notes && (
            <div className="
              receipt-notes
            ">
              <small>
                OBSERVACIONES
              </small>

              <p>
                {receipt.notes}
              </p>
            </div>
          )}


          <div
            className={
              `receipt-paid ${
                isPaid
                  ? 'is-paid'
                  : ''
              }`
            }
          >
            {isPaid
              ? 'PAGADO'
              : 'PAGO REGISTRADO'}
          </div>

        </div>


        <footer className="
          receipt-footer
        ">
          <strong>
            ELANVISUAL
          </strong>

          <span>
            Documento oficial de recepción
            de pago
          </span>

          <div className="
            receipt-contact
          ">
            <a href={PLATFORM_URL}>
              visual.elankav.com
            </a>

            <span>•</span>

            <a href={PHONE_LINK}>
              {PHONE_DISPLAY}
            </a>
          </div>
        </footer>

      </section>


      <nav className="
        receipt-actions
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


        {dossier?.documents
          ?.quotation?.viewUrl && (
          <a
            href={
              dossier.documents
                .quotation.viewUrl
            }
          >
            Cotización
          </a>
        )}


        {dossier?.documents
          ?.workOrder?.viewUrl && (
          <a
            href={
              dossier.documents
                .workOrder.viewUrl
            }
          >
            Seguimiento OT
          </a>
        )}


        {!dossier && (
          <a href={PLATFORM_URL}>
            Ir a ELANVISUAL
          </a>
        )}
      </nav>


      {relatedReceipts.length > 1 && (
        <nav className="
          receipt-related
          no-print
        ">
          <strong>
            Otros recibos del proyecto
          </strong>

          {relatedReceipts
            .filter(
              (entry) =>
                entry.receiptNumber !==
                receipt.receiptNumber
            )
            .map(
              (entry) => (
                <a
                  key={
                    entry.receiptNumber
                  }
                  href={
                    entry.viewUrl
                  }
                >
                  {entry.receiptNumber}
                </a>
              )
            )}
        </nav>
      )}

    </main>
  );
}
