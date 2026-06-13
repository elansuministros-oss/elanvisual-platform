import React, { useMemo, useState } from 'react';
import { ClipboardList, CreditCard, Send, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const formatoC$ = (valor) => {
  const numero = Number(valor || 0);
  return `C$ ${numero.toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const limpiarTelefono = (telefono) =>
  String(telefono || '').replace(/[^0-9]/g, '');

const normalizarWhatsApp = (telefono) => {
  const limpio = limpiarTelefono(telefono);
  if (limpio.length === 8) return `505${limpio}`;
  return limpio;
};

const whatsappValido = (telefono) => {
  const limpio = normalizarWhatsApp(telefono);
  return limpio.startsWith('505') && limpio.length === 11;
};

const cuentaReal = (cuenta) => {
  const numero = limpiarTelefono(cuenta?.numero);
  return (
    cuenta?.activa !== false &&
    cuenta?.visible !== false &&
    numero.length >= 6 &&
    !/^0+$/.test(numero)
  );
};

export default function Carrito() {
  const {
    carrito,
    cambiarCantidad,
    quitar,
    resumen,
    cuentasBancarias,
    configuracion,
    crearPedidoTransferencia,
  } = useApp();

  const [cliente, setCliente] = useState({
    nombre: '',
    empresa: '',
    whatsapp: '',
    correo: '',
    ubicacion: '',
    descripcionProyecto: '',
    medidas: '',
  });

  const [errorWhatsapp, setErrorWhatsapp] = useState('');
  const [pagoTipo, setPagoTipo] = useState('anticipo');
  const [ultimoPedido, setUltimoPedido] = useState(null);

  const cuentasActivas = useMemo(
    () => cuentasBancarias.filter(cuentaReal),
    [cuentasBancarias]
  );

  const anticipoPorcentaje = Number(configuracion.anticipoPorcentaje || 60);
  const baseCotizacion = Number(resumen.total || 0);
  const montoAnticipo = baseCotizacion * (anticipoPorcentaje / 100);
  const montoSolicitado = pagoTipo === 'total' ? baseCotizacion : montoAnticipo;
  const saldoPendiente = Math.max(0, baseCotizacion - montoSolicitado);

  const serviciosSeleccionados = carrito.map((item) => ({
    ...item,
    precio: Number(item.precio || 0),
  }));

  function textoCliente(pedido) {
    const cuentas =
      cuentasActivas.length > 0
        ? cuentasActivas
            .map(
              (c) =>
                `${c.banco}\nCuenta: ${c.numero}\nTitular: ${c.titular}\nMoneda: ${c.moneda}`
            )
            .join('\n\n')
        : 'No hay cuentas bancarias configuradas. Contactá a ELANVISUAL para confirmar la cuenta oficial antes de transferir.';

    return `Hola ${cliente.nombre || 'cliente'}.

Gracias por solicitar un servicio en ELANVISUAL.

Solicitud: ${pedido.numero}
Empresa: ${cliente.empresa || 'No indicada'}
Ubicación: ${cliente.ubicacion || 'No indicada'}

Servicios solicitados:
${serviciosSeleccionados
  .map((i) => `- ${i.cantidad || 1} × ${i.nombre} (${i.medidas || 'medidas por definir'})`)
  .join('\n')}

Descripción del proyecto:
${cliente.descripcionProyecto || 'Pendiente de completar'}

Medidas / referencia:
${cliente.medidas || 'Pendiente de levantamiento técnico'}

Modalidad seleccionada:
${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}

Monto de referencia:
${baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}

Monto a transferir ahora:
${baseCotizacion > 0 ? formatoC$(montoSolicitado) : 'Pendiente de cotización'}

Saldo pendiente:
${baseCotizacion > 0 ? formatoC$(saldoPendiente) : 'Pendiente de cotización'}

Cuentas oficiales:

${cuentas}

${configuracion.instruccionesPago || 'Después de transferir, responde este mensaje enviando el comprobante para confirmar tu solicitud.'}

Tu solicitud será revisada para cotización, orden de trabajo y programación de producción.`;
  }

  function textoElan(pedido) {
    const lineas = serviciosSeleccionados
      .map(
        (i) =>
          `- ${i.cantidad || 1} × ${i.nombre} | ${i.categoria || 'Servicio'} | ${i.medidas || 'medidas por definir'}`
      )
      .join('\n');

    return `Nueva solicitud ELANVISUAL.

Solicitud: ${pedido.numero}
Cliente: ${cliente.nombre}
Empresa: ${cliente.empresa || 'No indicada'}
WhatsApp: ${normalizarWhatsApp(cliente.whatsapp)}
Correo: ${cliente.correo || 'No indicado'}
Ubicación: ${cliente.ubicacion || 'No indicada'}

Servicios:
${lineas}

Descripción del proyecto:
${cliente.descripcionProyecto || 'Pendiente'}

Medidas / referencia:
${cliente.medidas || 'Pendiente'}

Monto de referencia: ${baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}
Modalidad: ${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}
Monto solicitado: ${baseCotizacion > 0 ? formatoC$(montoSolicitado) : 'Pendiente de cotización'}
Saldo pendiente: ${baseCotizacion > 0 ? formatoC$(saldoPendiente) : 'Pendiente de cotización'}

Estado: Solicitud recibida. Revisar para cotización, pedido, OT y producción.`;
  }

  function enviarSolicitud() {
    if (!cliente.nombre || !cliente.whatsapp) {
      alert('Escribí el nombre y WhatsApp del cliente antes de enviar la solicitud.');
      return;
    }

    if (!whatsappValido(cliente.whatsapp)) {
      setErrorWhatsapp(
        'WhatsApp inválido. Escribilo con código de país. Ej: 50588888888. Si escribís 8 dígitos, se agregará 505 automáticamente.'
      );
      return;
    }

    if (carrito.length === 0) {
      alert('Agregá al menos un servicio antes de enviar la solicitud.');
      return;
    }

    const clienteNormalizado = {
      ...cliente,
      whatsapp: normalizarWhatsApp(cliente.whatsapp),
      telefono: normalizarWhatsApp(cliente.whatsapp),
      nombre: cliente.empresa
        ? `${cliente.nombre} · ${cliente.empresa}`
        : cliente.nombre,
      observaciones: [
        cliente.descripcionProyecto,
        cliente.medidas ? `Medidas: ${cliente.medidas}` : '',
        cliente.ubicacion ? `Ubicación: ${cliente.ubicacion}` : '',
        cliente.correo ? `Correo: ${cliente.correo}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };

    setCliente((prev) => ({
      ...prev,
      whatsapp: clienteNormalizado.whatsapp,
    }));

    setErrorWhatsapp('');

    let pedido;

    try {
      pedido = crearPedidoTransferencia({
        cliente: clienteNormalizado,
        pagoTipo,
      });
    } catch (error) {
      setErrorWhatsapp('No se pudo crear la solicitud porque el WhatsApp no es válido.');
      return;
    }

    setUltimoPedido(pedido);

    window.open(
      `https://wa.me/${clienteNormalizado.whatsapp}?text=${encodeURIComponent(
        textoCliente(pedido)
      )}`,
      '_blank'
    );

    setTimeout(() => {
      window.open(
        `https://wa.me/${normalizarWhatsApp(
          import.meta.env.VITE_WHATSAPP_ELAN || configuracion.whatsapp
        )}?text=${encodeURIComponent(textoElan(pedido))}`,
        '_blank'
      );
    }, 700);
  }

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <div>
          <span className="badge">ELANVISUAL · Solicitud de Servicio</span>
          <h1>Preparar solicitud para cotización</h1>
          <p>
            Confirmá los servicios seleccionados, agregá los datos del cliente y
            enviá la solicitud para revisión comercial, cotización y producción.
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Flujo activo</b>
          <span>Solicitud → Cotización → OT</span>
          <strong>{baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}</strong>
        </aside>
      </section>

      {carrito.length === 0 ? (
        <section className="panel empty-catalog">
          <h2>No hay servicios seleccionados</h2>
          <p className="note">
            Volvé a Servicios y seleccioná al menos una opción para preparar la
            solicitud.
          </p>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>
              <ClipboardList size={20} /> Servicios seleccionados
            </h2>

            <div className="list">
              {serviciosSeleccionados.map((item) => (
                <div className="item" key={item.id}>
                  <div>
                    <b>{item.nombre}</b>
                    <p>{item.medidas || 'Medidas por definir'}</p>
                    <small>{item.categoria}</small>
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      cambiarCantidad(item.id, Number(e.target.value))
                    }
                  />

                  <span>{item.precio > 0 ? formatoC$(item.precio * item.cantidad) : 'A cotizar'}</span>

                  <button type="button" onClick={() => quitar(item.id)}>
                    <Trash2 size={16} /> Quitar
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="checkout">
            <h2>Datos para cotización</h2>

            <div className="form-grid">
              <input
                placeholder="Nombre del cliente"
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({ ...cliente, nombre: e.target.value })
                }
              />

              <input
                placeholder="Empresa / negocio"
                value={cliente.empresa}
                onChange={(e) =>
                  setCliente({ ...cliente, empresa: e.target.value })
                }
              />

              <input
                placeholder="WhatsApp con código de país. Ej: 50588888888"
                value={cliente.whatsapp}
                onChange={(e) => {
                  setCliente({ ...cliente, whatsapp: e.target.value });
                  setErrorWhatsapp('');
                }}
                onBlur={() =>
                  setCliente((prev) => ({
                    ...prev,
                    whatsapp: normalizarWhatsApp(prev.whatsapp),
                  }))
                }
              />

              <input
                placeholder="Correo electrónico"
                value={cliente.correo}
                onChange={(e) =>
                  setCliente({ ...cliente, correo: e.target.value })
                }
              />

              <input
                className="span-2"
                placeholder="Ubicación del proyecto / instalación"
                value={cliente.ubicacion}
                onChange={(e) =>
                  setCliente({ ...cliente, ubicacion: e.target.value })
                }
              />

              <textarea
                className="span-2"
                placeholder="Descripción del proyecto: tipo de rótulo, material, ubicación, uso, instalación, referencia visual..."
                rows="4"
                value={cliente.descripcionProyecto}
                onChange={(e) =>
                  setCliente({
                    ...cliente,
                    descripcionProyecto: e.target.value,
                  })
                }
              />

              <textarea
                className="span-2"
                placeholder="Medidas aproximadas, cantidades, color, iluminación, estructura o detalles técnicos"
                rows="3"
                value={cliente.medidas}
                onChange={(e) =>
                  setCliente({ ...cliente, medidas: e.target.value })
                }
              />
            </div>

            {errorWhatsapp && <p className="error-text">{errorWhatsapp}</p>}

            <div className="payment-box">
              <h3>
                <CreditCard size={18} /> Referencia comercial
              </h3>
              <p>
                Total de referencia:{' '}
                <b>{baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}</b>
              </p>
              <p>
                Anticipo configurado:{' '}
                <b>{anticipoPorcentaje}%</b>
              </p>
              <p>
                Este formulario conserva compatibilidad con pedidos, producción y
                seguimiento mientras se conecta el flujo nativo de cotizaciones.
              </p>
            </div>

            <div className="payment-options">
              <label className={pagoTipo === 'anticipo' ? 'option active' : 'option'}>
                <input
                  type="radio"
                  name="pagoTipo"
                  checked={pagoTipo === 'anticipo'}
                  onChange={() => setPagoTipo('anticipo')}
                />
                <span>
                  <b>Solicitud con anticipo {anticipoPorcentaje}%</b>
                  <small>
                    Se usará cuando el proyecto tenga precio confirmado.
                  </small>
                  <strong>
                    {baseCotizacion > 0 ? formatoC$(montoAnticipo) : 'A cotizar'}
                  </strong>
                </span>
              </label>

              <label className={pagoTipo === 'total' ? 'option active' : 'option'}>
                <input
                  type="radio"
                  name="pagoTipo"
                  checked={pagoTipo === 'total'}
                  onChange={() => setPagoTipo('total')}
                />
                <span>
                  <b>Pago total 100%</b>
                  <small>Disponible solo si el monto ya fue confirmado.</small>
                  <strong>
                    {baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}
                  </strong>
                </span>
              </label>
            </div>

            <button className="send-full" type="button" onClick={enviarSolicitud}>
              <Send size={18} /> Enviar solicitud
            </button>

            {ultimoPedido && (
              <p className="success-msg">
                Solicitud {ultimoPedido.numero} creada y registrada para
                administración. Al validarse comercialmente podrá continuar a
                cotización, orden de trabajo y producción.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}