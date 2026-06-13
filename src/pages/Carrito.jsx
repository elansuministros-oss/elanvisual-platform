import React, { useMemo, useState } from 'react';
import { CreditCard, Send, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const formatoC$ = (valor) => {
  const numero = Number(valor || 0);
  return `C$ ${numero.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const limpiarTelefono = (telefono) => String(telefono || '').replace(/[^0-9]/g, '');

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
  return cuenta?.activa !== false && cuenta?.visible !== false && numero.length >= 6 && !/^0+$/.test(numero);
};

export default function Carrito() {
  const { carrito, cambiarCantidad, quitar, resumen, veterinaria, cuentasBancarias, configuracion, crearPedidoTransferencia } = useApp();
  const [cliente, setCliente] = useState({ nombre: '', whatsapp: '' });
  const [errorWhatsapp, setErrorWhatsapp] = useState('');
  const [pagoTipo, setPagoTipo] = useState('anticipo');
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const cuentasActivas = useMemo(() => cuentasBancarias.filter(cuentaReal), [cuentasBancarias]);
  const anticipoPorcentaje = Number(configuracion.anticipoPorcentaje || 60);
  const montoAnticipo = resumen.total * (anticipoPorcentaje / 100);
  const montoSolicitado = pagoTipo === 'total' ? resumen.total : montoAnticipo;
  const saldoPendiente = Math.max(0, resumen.total - montoSolicitado);

  function textoCliente(pedido) {
    const cuentas = cuentasActivas.length > 0 ? cuentasActivas.map((c) => `${c.banco}\nCuenta: ${c.numero}\nTitular: ${c.titular}\nMoneda: ${c.moneda}`).join('\n\n') : 'No hay cuentas bancarias configuradas. Contactá a ELANPET para confirmar la cuenta oficial antes de transferir.';
    return `Hola ${cliente.nombre || 'cliente'}.\n\nGracias por tu pedido en ELANPET.\n\nPedido: ${pedido.numero}\nTotal del pedido: ${formatoC$(resumen.total)}\nModalidad seleccionada: ${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}\nMonto a transferir ahora: ${formatoC$(montoSolicitado)}\nSaldo pendiente: ${formatoC$(saldoPendiente)}\n\nCuentas oficiales:\n\n${cuentas}\n\n${configuracion.instruccionesPago || 'Después de transferir, responde este mensaje enviando el comprobante para confirmar tu pedido.'}\n\nTu pedido entrará a producción cuando validemos el pago.`;
  }

  function textoElan(pedido) {
    const lineas = carrito.map((i) => `- ${i.cantidad} x ${i.nombre} (${formatoC$(i.precio)})`).join('\n');
    return `Nuevo pedido ELAN PET pendiente de pago.\n\nPedido: ${pedido.numero}\nCliente: ${cliente.nombre}\nWhatsApp: ${normalizarWhatsApp(cliente.whatsapp)}\nVeterinaria origen: ${veterinaria?.nombre || 'Venta directa'} ${veterinaria?.codigo ? `(${veterinaria.codigo})` : ''}\n\nProductos:\n${lineas}\n\nSubtotal: ${formatoC$(resumen.subtotal)}\nDescuento: ${resumen.descuentoPorcentaje}% (${formatoC$(resumen.descuentoMonto)})\nTotal: ${formatoC$(resumen.total)}\nModalidad: ${pagoTipo === 'total' ? 'Pago total 100%' : `Anticipo ${anticipoPorcentaje}%`}\nMonto solicitado: ${formatoC$(montoSolicitado)}\nSaldo pendiente: ${formatoC$(saldoPendiente)}\n\nEstado: Pendiente de pago. Dar seguimiento si no envía comprobante.`;
  }

  function enviarPedido() {
    if (!cliente.nombre || !cliente.whatsapp) {
      alert('Escribí el nombre y WhatsApp del cliente antes de enviar el pedido.');
      return;
    }

    if (!whatsappValido(cliente.whatsapp)) {
      setErrorWhatsapp('WhatsApp inválido. Escribilo con código de país. Ej: 50588888888. Si escribís 8 dígitos, se agregará 505 automáticamente.');
      return;
    }

    if (carrito.length === 0) return;

    const clienteNormalizado = { ...cliente, whatsapp: normalizarWhatsApp(cliente.whatsapp) };
    setCliente(clienteNormalizado);
    setErrorWhatsapp('');

    let pedido;
    try {
      pedido = crearPedidoTransferencia({ cliente: clienteNormalizado, pagoTipo });
    } catch (error) {
      setErrorWhatsapp('No se pudo crear el pedido porque el WhatsApp no es válido.');
      return;
    }

    setUltimoPedido(pedido);
    window.open(`https://wa.me/${clienteNormalizado.whatsapp}?text=${encodeURIComponent(textoCliente(pedido))}`, '_blank');
    setTimeout(() => {
      window.open(`https://wa.me/${normalizarWhatsApp(import.meta.env.VITE_WHATSAPP_ELAN || configuracion.whatsapp)}?text=${encodeURIComponent(textoElan(pedido))}`, '_blank');
    }, 700);
  }

  return (
    <main>
      <h1>Carrito</h1>
      {carrito.length === 0 ? <p>Carrito vacío.</p> : <>
        <div className="list">
          {carrito.map((i) => <div className="item" key={i.id}>
            <div><b>{i.nombre}</b><p>{i.medidas}</p></div>
            <input type="number" value={i.cantidad} onChange={(e) => cambiarCantidad(i.id, Number(e.target.value))} />
            <span>{formatoC$(i.precio * i.cantidad)}</span>
            <button onClick={() => quitar(i.id)}><Trash2 size={16} /> Quitar</button>
          </div>)}
        </div>
        <div className="checkout">
          <h2>Pago por transferencia</h2>
          <p>Subtotal: {formatoC$(resumen.subtotal)}</p>
          <p>Descuento: {resumen.descuentoPorcentaje}%</p>
          <p>Total: <b>{formatoC$(resumen.total)}</b></p>

          <div className="payment-options">
            <label className={pagoTipo === 'anticipo' ? 'option active' : 'option'}>
              <input type="radio" name="pagoTipo" checked={pagoTipo === 'anticipo'} onChange={() => setPagoTipo('anticipo')} />
              <span><b>Anticipo {anticipoPorcentaje}%</b><small>Recomendado para iniciar fabricación personalizada.</small><strong>{formatoC$(montoAnticipo)}</strong></span>
            </label>
            <label className={pagoTipo === 'total' ? 'option active' : 'option'}>
              <input type="radio" name="pagoTipo" checked={pagoTipo === 'total'} onChange={() => setPagoTipo('total')} />
              <span><b>Pago total 100%</b><small>Deja el pedido completamente cancelado.</small><strong>{formatoC$(resumen.total)}</strong></span>
            </label>
          </div>

          <div className="payment-box">
            <h3><CreditCard size={18} /> Resumen de pago</h3>
            <p>Monto a transferir ahora: <b>{formatoC$(montoSolicitado)}</b></p>
            <p>Saldo pendiente: <b>{formatoC$(saldoPendiente)}</b></p>
          </div>

          <input placeholder="Nombre cliente" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
          <input placeholder="WhatsApp con código de país. Ej: 50588888888" value={cliente.whatsapp} onChange={(e) => { setCliente({ ...cliente, whatsapp: e.target.value }); setErrorWhatsapp(''); }} onBlur={() => setCliente((prev) => ({ ...prev, whatsapp: normalizarWhatsApp(prev.whatsapp) }))} />
          {errorWhatsapp && <p className="error-text">{errorWhatsapp}</p>}
          <button className="send-full" onClick={enviarPedido}><Send size={18} /> Enviar pedido</button>
          {ultimoPedido && <p className="success-msg">Pedido {ultimoPedido.numero} creado como pendiente de pago y registrado para administración. Al confirmar el pago se generará el código de seguimiento.</p>}
        </div>
      </>}
    </main>
  );
}
