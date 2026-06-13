export default function CrudTable({
  title,
  rows = [],
  fields = [],
  onAdd,
  onDelete,
}) {
  const formatValue = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return String(value);
  };

  return (
    <section className="card crud-card">
      <style>
        {`
          .crud-card {
            width: 100%;
            overflow: hidden;
          }

          .crud-card .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }

          .crud-card .section-head h2 {
            margin: 0;
          }

          .crud-card .section-head button,
          .crud-action-btn {
            min-height: 48px;
            padding: 12px 18px;
            border-radius: 14px;
            font-weight: 800;
            cursor: pointer;
          }

          .crud-mobile-list {
            display: none;
          }

          .crud-mobile-item {
            border: 1px solid rgba(15, 23, 42, .12);
            border-radius: 18px;
            padding: 18px;
            background: #ffffff;
            box-shadow: 0 8px 22px rgba(15, 23, 42, .08);
          }

          .crud-mobile-row {
            display: grid;
            gap: 6px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(15, 23, 42, .08);
          }

          .crud-mobile-row:last-child {
            border-bottom: 0;
          }

          .crud-mobile-label {
            font-size: 14px;
            font-weight: 900;
            color: #667085;
            text-transform: uppercase;
            letter-spacing: .04em;
          }

          .crud-mobile-value {
            font-size: 20px;
            font-weight: 800;
            color: #172033;
            line-height: 1.25;
            overflow-wrap: anywhere;
          }

          .crud-mobile-actions {
            margin-top: 18px;
            display: flex;
            gap: 12px;
          }

          .crud-mobile-actions button {
            width: 100%;
            min-height: 58px;
            font-size: 18px;
            border-radius: 16px;
            font-weight: 900;
          }

          .crud-empty {
            padding: 28px;
            text-align: center;
            color: #667085;
            font-weight: 800;
          }

          @media (max-width: 760px) {
            .crud-card {
              padding: 18px !important;
              border-radius: 22px !important;
            }

            .crud-card .section-head {
              align-items: stretch;
              flex-direction: column;
              gap: 14px;
            }

            .crud-card .section-head h2 {
              font-size: 28px !important;
              line-height: 1.1;
            }

            .crud-card .section-head button {
              width: 100%;
              min-height: 64px;
              font-size: 22px;
              border-radius: 18px;
            }

            .crud-card .table-wrap {
              display: none !important;
            }

            .crud-mobile-list {
              display: grid;
              gap: 18px;
            }
          }
        `}
      </style>

      <div className="section-head">
        <h2>{title}</h2>
        {onAdd && (
          <button type="button" onClick={onAdd}>
            + Nuevo
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="crud-empty">No hay registros todavía.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  {onDelete && <th>Acción</th>}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {fields.map((field) => (
                      <td key={field.key}>{formatValue(row[field.key])}</td>
                    ))}

                    {onDelete && (
                      <td>
                        <button
                          type="button"
                          className="ghost danger crud-action-btn"
                          onClick={() => onDelete(row.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crud-mobile-list">
            {rows.map((row) => (
              <article className="crud-mobile-item" key={row.id}>
                {fields.map((field) => (
                  <div className="crud-mobile-row" key={field.key}>
                    <div className="crud-mobile-label">{field.label}</div>
                    <div className="crud-mobile-value">
                      {formatValue(row[field.key])}
                    </div>
                  </div>
                ))}

                {onDelete && (
                  <div className="crud-mobile-actions">
                    <button
                      type="button"
                      className="ghost danger"
                      onClick={() => onDelete(row.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}