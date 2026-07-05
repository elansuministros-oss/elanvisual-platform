function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMeasure(line) {
  const ancho = line.medidas?.ancho || '-';
  const alto = line.medidas?.alto || '-';
  return `${escapeHtml(ancho)} x ${escapeHtml(alto)} ${escapeHtml(line.unidad || '')}`.trim();
}

function buildQuoteHtml(quote) {
  const lines = (quote.lineas || [])
    .map(
      (line) => `
        <tr>
          <td>
            <strong>${escapeHtml(line.producto?.nombre || 'Producto registrado')}</strong>
            <small>${escapeHtml(line.producto?.categoria || line.producto?.id || '')}</small>
          </td>
          <td>${escapeHtml(line.cantidad || 1)}</td>
          <td>${formatMeasure(line)}</td>
          <td>${escapeHtml(line.observaciones || 'Sin observaciones')}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Cotizacion V2 - ${escapeHtml(quote.proyecto?.nombre || quote.id)}</title>
        <style>
          @page { size: letter; margin: 18mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #0f172a;
            font-family: Inter, Arial, sans-serif;
            background: #ffffff;
          }
          .document {
            width: 100%;
          }
          .topbar {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .brand {
            display: grid;
            gap: 4px;
          }
          .brand strong {
            font-size: 28px;
            letter-spacing: 0;
          }
          .brand span {
            color: #997400;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .meta {
            min-width: 220px;
            border: 1px solid #d8dee8;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
          }
          .meta p {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 0 0 8px;
            font-size: 13px;
          }
          .meta p:last-child { margin-bottom: 0; }
          h1 {
            margin: 0 0 6px;
            font-size: 30px;
          }
          .summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 22px;
          }
          .summary div {
            border: 1px solid #d8dee8;
            border-radius: 8px;
            padding: 14px;
          }
          .summary span {
            display: block;
            color: #64748b;
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .summary strong {
            font-size: 17px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d8dee8;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 12px;
            text-align: left;
            text-transform: uppercase;
          }
          th, td {
            border-bottom: 1px solid #d8dee8;
            padding: 12px;
            vertical-align: top;
          }
          td {
            font-size: 13px;
          }
          td small {
            display: block;
            color: #64748b;
            margin-top: 3px;
          }
          .notice {
            margin-top: 22px;
            border-top: 1px solid #d8dee8;
            padding-top: 12px;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <main class="document">
          <section class="topbar">
            <div class="brand">
              <span>ELANVISUAL</span>
              <strong>Cotizacion V2</strong>
            </div>
            <div class="meta">
              <p><span>Fecha</span><strong>${escapeHtml(quote.fecha || '')}</strong></p>
              <p><span>Estado</span><strong>${escapeHtml(quote.estado || '')}</strong></p>
            </div>
          </section>

          <h1>${escapeHtml(quote.proyecto?.nombre || 'Proyecto')}</h1>

          <section class="summary">
            <div>
              <span>Proyecto</span>
              <strong>${escapeHtml(quote.proyecto?.nombre || '')}</strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong>${escapeHtml(quote.cliente || '')}</strong>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Medidas</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>${lines}</tbody>
          </table>

          <p class="notice">
            Documento generado desde Quote V2. No incluye precios, IVA, costos, pagos ni checkout.
          </p>
        </main>
      </body>
    </html>
  `;
}

export const PDFService = Object.freeze({
  buildQuoteHtml,

  openQuotePdf(quote) {
    if (!quote || !quote.id) {
      throw new Error('Quote is required');
    }

    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      throw new Error('PDF window was blocked');
    }

    pdfWindow.document.open();
    pdfWindow.document.write(buildQuoteHtml(quote));
    pdfWindow.document.close();
    pdfWindow.focus();
    pdfWindow.setTimeout(() => pdfWindow.print(), 100);

    return {
      ok: true,
      quoteId: quote.id,
    };
  },
});
