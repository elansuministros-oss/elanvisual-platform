import { useMemo, useState } from 'react';
import {
  calcularResumenCompras,
  construirCosteoRealDesdeOC,
  construirEgresoProveedorDesdeOC,
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

  const guardarPedidoCompras = (ordenesActualizadas, extras = {}) => {
    const costeoProveedor = construirCosteoRealDesdeOC(ordenesActualizadas);

    actualizarPedido?.({
      ...pedido,
      ...extras,
      compras: {
        ...(pedido.compras || {}),
        ordenesCompra: ordenesActualizadas,
        resumen: calcularResumenCompras(ordenesActualizadas),
        actualizadoEn: new Date().toISOString(),
      },
      costeoReal: {
        ...(pedido.costeoReal || {}),
        ...costeoProveedor,
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

    guardarPedidoCompras([...ordenesCompra, nuevaOC]);
    limpiarOC();

    return { ok: true, mensaje: `${nuevaOC.codigo} generada correctamente.` };
  };

  const actualizarOC = (ocId, cambios) => {
    if (!pedido) return;

    const ordenesActualizadas = ordenesCompra.map((oc) =>
      oc.id === ocId ? { ...oc, ...cambios, actualizadoEn: new Date().toISOString() } : oc
    );

    guardarPedidoCompras(ordenesActualizadas);
  };

  const registrarRecepcion = (ocId) => {
    actualizarOC(ocId, { estado: 'Recibida', recepcion: construirRecepcionOC() });
  };

  const registrarFactura = (ocId, montoFactura) => {
    actualizarOC(ocId, { estado: 'Facturada', factura: construirFacturaOC(montoFactura) });
  };

  const registrarPago = (ocId, montoPago) => {
    if (!pedido) return;

    let movimientoProveedor = null;

    const ordenesActualizadas = ordenesCompra.map((oc) => {
      if (oc.id !== ocId) return oc;

      const pago = construirPagoOC(montoPago || oc.factura?.monto || oc.monto);
      const ocPagada = {
        ...oc,
        estado: 'Pagada',
        pago,
        actualizadoEn: new Date().toISOString(),
      };

      movimientoProveedor = construirEgresoProveedorDesdeOC({
        oc: ocPagada,
        pedido,
        pago,
      });

      return ocPagada;
    });

    const tesoreriaActual = pedido.tesoreria || {};
    const movimientos = Array.isArray(tesoreriaActual.movimientos)
      ? tesoreriaActual.movimientos
      : [];

    guardarPedidoCompras(ordenesActualizadas, {
      ultimoMovimientoProveedor: movimientoProveedor,
      tesoreria: {
        ...tesoreriaActual,
        movimientos: movimientoProveedor ? [...movimientos, movimientoProveedor] : movimientos,
        actualizadoEn: new Date().toISOString(),
      },
    });
  };

  const imprimirOC = (oc) => {
    const html = generarHTMLOrdenCompra({ oc, pedido });
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return alert('El navegador bloqueó la ventana de impresión.');

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
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

