import { useMemo, useState } from 'react';
import {
  calcularResumenCompras,
  construirFacturaOC,
  construirOC,
  construirPagoOC,
  construirRecepcionOC,
  estadosOC,
  generarHTMLOrdenCompra,
} from '../../services/ot/comprasService';

export default function useComprasOT({ pedido, proveedores, actualizarPedido }) {
  const [formOC, setFormOC] = useState({
    concepto: '',
    categoria: 'Impresión',
    proveedorId: '',
    proveedor: '',
    monto: '',
    fechaSolicitud: new Date().toISOString().slice(0, 10),
    fechaEntrega: '',
    estado: 'Borrador',
    notas: '',
  });

  const ordenesCompra = useMemo(() => {
    return Array.isArray(pedido?.compras?.ordenesCompra)
      ? pedido.compras.ordenesCompra
      : [];
  }, [pedido]);

  const proveedoresDisponibles = useMemo(() => {
    return Array.isArray(proveedores) ? proveedores : [];
  }, [proveedores]);

  const resumenCompras = useMemo(() => calcularResumenCompras(ordenesCompra), [ordenesCompra]);

  const actualizarCampoOC = (campo, valor) => {
    setFormOC((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarOC = () => {
    setFormOC({
      concepto: '',
      categoria: 'Impresión',
      proveedorId: '',
      proveedor: '',
      monto: '',
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      fechaEntrega: '',
      estado: 'Borrador',
      notas: '',
    });
  };

  const guardarOrdenes = (ordenesActualizadas) => {
    actualizarPedido?.({
      ...pedido,
      compras: {
        ...(pedido.compras || {}),
        ordenesCompra: ordenesActualizadas,
        actualizadoEn: new Date().toISOString(),
      },
    });
  };

  const crearOC = () => {
    if (!pedido) return { ok: false, mensaje: 'No hay OT seleccionada.' };
    if (!formOC.concepto.trim()) return { ok: false, mensaje: 'Indicá el concepto de la Orden de Compra.' };
    if (!formOC.proveedorId && !formOC.proveedor.trim()) return { ok: false, mensaje: 'Seleccioná o escribí un proveedor.' };

    const nuevaOC = construirOC({
      pedido,
      formOC,
      cantidadActual: ordenesCompra.length,
      proveedores: proveedoresDisponibles,
    });

    guardarOrdenes([...ordenesCompra, nuevaOC]);
    limpiarOC();

    return { ok: true, mensaje: `${nuevaOC.codigo} generada correctamente.` };
  };

  const actualizarOC = (ocId, cambios) => {
    if (!pedido) return;

    const ordenesActualizadas = ordenesCompra.map((oc) =>
      oc.id === ocId ? { ...oc, ...cambios, actualizadoEn: new Date().toISOString() } : oc
    );

    guardarOrdenes(ordenesActualizadas);
  };

  const registrarRecepcion = (ocId) => {
    actualizarOC(ocId, { estado: 'Recibida', recepcion: construirRecepcionOC() });
  };

  const registrarFactura = (ocId, montoFactura) => {
    actualizarOC(ocId, { estado: 'Facturada', factura: construirFacturaOC(montoFactura) });
  };

  const registrarPago = (ocId, montoPago) => {
    actualizarOC(ocId, { estado: 'Pagada', pago: construirPagoOC(montoPago) });
  };

  const imprimirOC = (oc) => {
    const html = generarHTMLOrdenCompra({ oc, pedido });
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return alert('El navegador bloqueó la ventana de impresión.');

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
    }, 400);
  };

  return {
    estadosOC,
    formOC,
    ordenesCompra,
    proveedoresDisponibles,
    resumenCompras,
    actualizarCampoOC,
    crearOC,
    actualizarOC,
    registrarRecepcion,
    registrarFactura,
    registrarPago,
    imprimirOC,
  };
}

