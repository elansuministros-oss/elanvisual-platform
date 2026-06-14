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
        : 'No hay cuentas bancarias configuradas. ContactÃ¡ a ELANVISUAL para confirmar la cuenta oficial antes de transferir.';

    return `Hola ${cliente.nombre || 'cliente'}.

Gracias por solicitar un servicio en ELANVISUAL.

Solicitud: ${pedido.numero}
Empresa: ${cliente.empresa || 'No indicada'}
UbicaciÃ³n: ${cliente.ubicacion || 'No indicada'}

Servicios solicitados:
${serviciosSeleccionados
  .map((i) => `- ${i.cantidad || 1} Ã— ${i.nombre} (${i.medidas || 'medidas por definir'})`)
  .join('\n')}

DescripciÃ³n del proyecto:
${cliente.descripcionProyecto || 'Pendiente de completar'}

Medidas / referencia:
${cliente.medidas || 'Pendiente de levantamiento tÃ©cnico'}

Modalidad seleccionada:
${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}

Monto de referencia:
${baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}

Monto a transferir ahora:
${baseCotizacion > 0 ? formatoC$(montoSolicitado) : 'Pendiente de cotizaciÃ³n'}

Saldo pendiente:
${baseCotizacion > 0 ? formatoC$(saldoPendiente) : 'Pendiente de cotizaciÃ³n'}

Cuentas oficiales:

${cuentas}

${configuracion.instruccionesPago || 'DespuÃ©s de transferir, responde este mensaje enviando el comprobante para confirmar tu solicitud.'}

Tu solicitud serÃ¡ revisada para cotizaciÃ³n, orden de trabajo y programaciÃ³n de producciÃ³n.`;
  }

  function textoElan(pedido) {
    const lineas = serviciosSeleccionados
      .map(
        (i) =>
          `- ${i.cantidad || 1} Ã— ${i.nombre} | ${i.categoria || 'Servicio'} | ${i.medidas || 'medidas por definir'}`
      )
      .join('\n');

    return `Nueva solicitud ELANVISUAL.

Solicitud: ${pedido.numero}
Cliente: ${cliente.nombre}
Empresa: ${cliente.empresa || 'No indicada'}
WhatsApp: ${normalizarWhatsApp(cliente.whatsapp)}
Correo: ${cliente.correo || 'No indicado'}
UbicaciÃ³n: ${cliente.ubicacion || 'No indicada'}

Servicios:
${lineas}

DescripciÃ³n del proyecto:
${cliente.descripcionProyecto || 'Pendiente'}

Medidas / referencia:
${cliente.medidas || 'Pendiente'}

Monto de referencia: ${baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}
Modalidad: ${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}
Monto solicitado: ${baseCotizacion > 0 ? formatoC$(montoSolicitado) : 'Pendiente de cotizaciÃ³n'}
Saldo pendiente: ${baseCotizacion > 0 ? formatoC$(saldoPendiente) : 'Pendiente de cotizaciÃ³n'}

Estado: Solicitud recibida. Revisar para cotizaciÃ³n, pedido, OT y producciÃ³n.`;
  }

  function enviarSolicitud() {
    if (!cliente.nombre || !cliente.whatsapp) {
      alert('EscribÃ­ el nombre y WhatsApp del cliente antes de enviar la solicitud.');
      return;
    }

    if (!whatsappValido(cliente.whatsapp)) {
      setErrorWhatsapp(
        'WhatsApp invÃ¡lido. Escribilo con cÃ³digo de paÃ­s. Ej: 50588888888. Si escribÃ­s 8 dÃ­gitos, se agregarÃ¡ 505 automÃ¡ticamente.'
      );
      return;
    }

    if (carrito.length === 0) {
      alert('AgregÃ¡ al menos un servicio antes de enviar la solicitud.');
      return;
    }

    const clienteNormalizado = {
      ...cliente,
      whatsapp: normalizarWhatsApp(cliente.whatsapp),
      telefono: normalizarWhatsApp(cliente.whatsapp),
      nombre: cliente.empresa
        ? `${cliente.nombre} Â· ${cliente.empresa}`
        : cliente.nombre,
      observaciones: [
        cliente.descripcionProyecto,
        cliente.medidas ? `Medidas: ${cliente.medidas}` : '',
        cliente.ubicacion ? `UbicaciÃ³n: ${cliente.ubicacion}` : '',
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
      setErrorWhatsapp('No se pudo crear la solicitud porque el WhatsApp no es vÃ¡lido.');
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
          <span className="badge">ELANVISUAL Â· Solicitud de Servicio</span>
          <h1>Preparar solicitud para cotizaciÃ³n</h1>
          <p>
            ConfirmÃ¡ los servicios seleccionados, agregÃ¡ los datos del cliente y
            enviÃ¡ la solicitud para revisiÃ³n comercial, cotizaciÃ³n y producciÃ³n.
          </p>
        </div>

        <aside className="cart-summary-mini">
          <b>Flujo activo</b>
          <span>Solicitud â†’ CotizaciÃ³n â†’ OT</span>
          <strong>{baseCotizacion > 0 ? formatoC$(baseCotizacion) : 'A cotizar'}</strong>
        </aside>
      </section>

      {carrito.length === 0 ? (
        <section className="panel empty-catalog">
          <h2>No hay servicios seleccionados</h2>
          <p className="note">
            VolvÃ© a Servicios y seleccionÃ¡ al menos una opciÃ³n para preparar la
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
            <h2>Datos para cotizaciÃ³n</h2>

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
                placeholder="WhatsApp con cÃ³digo de paÃ­s. Ej: 50588888888"
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
                placeholder="Correo electrÃ³nico"
                value={cliente.correo}
                onChange={(e) =>
                  setCliente({ ...cliente, correo: e.target.value })
                }
              />

              <input
                className="span-2"
                placeholder="UbicaciÃ³n del proyecto / instalaciÃ³n"
                value={cliente.ubicacion}
                onChange={(e) =>
                  setCliente({ ...cliente, ubicacion: e.target.value })
                }
              />

              <textarea
                className="span-2"
                placeholder="DescripciÃ³n del proyecto: tipo de rÃ³tulo, material, ubicaciÃ³n, uso, instalaciÃ³n, referencia visual..."
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
                placeholder="Medidas aproximadas, cantidades, color, iluminaciÃ³n, estructura o detalles tÃ©cnicos"
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
                Este formulario conserva compatibilidad con pedidos, producciÃ³n y
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
                    Se usarÃ¡ cuando el proyecto tenga precio confirmado.
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
                administraciÃ³n. Al validarse comercialmente podrÃ¡ continuar a
                cotizaciÃ³n, orden de trabajo y producciÃ³n.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
