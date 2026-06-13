import { useMemo, useState } from 'react';
import {
  useElan,
  convertirAMetros,
} from '../../core/context/ElanContext.jsx';
import { leerListaCostos } from '../../CRM/ListaCostos.jsx';
import {
  leerFormulasCosto,
  calcularPrecioVenta,
} from '../../CRM/FormulasCosto.jsx';

const unidades = ['m', 'cm', 'mm', 'pulgadas', 'pies'];

const inicial = {
  categoria: '',
  subcategoria: '',
  productoId: '',
  ancho: '',
  alto: '',
  unidad: 'm',
  cantidad: 1,
  cliente: '',
  observacion: '',
};

function buscarCosto(costos, categoria, texto) {
  return (
    costos.find(
      (item) =>
        String(item.categoria || '').toLowerCase() ===
          String(categoria || '').toLowerCase() &&
        String(item.concepto || '')
          .toLowerCase()
          .includes(String(texto || '').toLowerCase()) &&
        item.estado !== 'Inactivo'
    ) || null
  );
}

export default function CotizadorInterno({ modo = 'admin' }) {
  const {
    productos,
    proveedores,
    guardarCotizacion,
    sesion,
  } = useElan();

  const [form, setForm] = useState(inicial);
  const [items, setItems] = useState([]);

  const costos = useMemo(() => leerListaCostos(), []);
  const formulas = useMemo(() => leerFormulasCosto(), []);

  const categorias = [
    ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
  ];

  const subcategorias = [
    ...new Set(
      productos
        .filter((p) => !form.categoria || p.categoria === form.categoria)
        .map((p) => p.subcategoria)
        .filter(Boolean)
    ),
  ];

  const productosFiltrados = productos.filter(
    (p) =>
      (!form.categoria || p.categoria === form.categoria) &&
      (!form.subcategoria || p.subcategoria === form.subcategoria)
  );

  const producto = productos.find((p) => p.id === form.productoId);

  const proveedor = proveedores.find(
    (p) => p.id === producto?.proveedorId
  );

  const calculoActual = useMemo(() => {
    const cantidad = Number(form.cantidad || 1);
    const anchoM = convertirAMetros(form.ancho || 0, form.unidad);
    const altoM = convertirAMetros(form.alto || 0, form.unidad);
    const areaUnidad = anchoM * altoM;
    const areaTotal = areaUnidad * cantidad;

    if (!producto) {
      return null;
    }

    const costoProducto = Number(producto.costo || 0);
    const precioProducto = Number(producto.precioVenta || 0);

    let materiales = 0;

    if (producto.calculo === 'area') {
      materiales = areaTotal * costoProducto;
    } else if (producto.calculo === 'unidad') {
      materiales = cantidad * costoProducto;
    } else {
      materiales = areaTotal > 0 ? areaTotal * costoProducto : costoProducto;
    }

    const desperdicio =
      (materiales * Number(formulas.desperdicioMaterial || 0)) / 100;

    const materialesConDesperdicio = materiales + desperdicio;

    const costoProduccionHora =
      buscarCosto(costos, 'Producción', 'Mano de obra')?.costo ||
      buscarCosto(costos, 'Producción', 'Corte CNC')?.costo ||
      0;

    const costoTecnico =
      buscarCosto(costos, 'Instalación', 'Técnico')?.costo || 0;

    const costoAyudante =
      buscarCosto(costos, 'Instalación', 'Ayudante')?.costo || 0;

    const costoKm =
      buscarCosto(costos, 'Transporte', 'Kilómetro')?.costo || 0;

    const baseArea = areaTotal > 0 ? areaTotal : cantidad;

    const produccion =
      baseArea *
      Number(formulas.horasProduccionPorM2 || 0) *
      Number(costoProduccionHora || 0) *
      Number(formulas.factorComplejidad || 1);

    const instalacion =
      baseArea *
      Number(formulas.horasInstalacionPorM2 || 0) *
      ((Number(formulas.tecnicoInstalacion || 0) *
        Number(costoTecnico || 0)) +
        (Number(formulas.ayudantesInstalacion || 0) *
          Number(costoAyudante || 0)));

    const transporte =
      Number(formulas.distanciaKmDefault || 0) *
      Number(costoKm || 0);

    const calculo = calcularPrecioVenta({
      materiales: materialesConDesperdicio,
      produccion,
      instalacion,
      transporte,
      margen: formulas.margenDefault,
    });

    const precioVentaBase =
      producto.calculo === 'unidad' && precioProducto > 0
        ? precioProducto * cantidad
        : calculo.precioVenta;

    const precioVenta =
      precioVentaBase > calculo.precioVenta
        ? precioVentaBase
        : calculo.precioVenta;

    const utilidad = precioVenta - calculo.costoBase;

    return {
      anchoM,
      altoM,
      areaUnidad,
      areaTotal,
      cantidad,
      materiales: materialesConDesperdicio,
      produccion,
      instalacion,
      transporte,
      costoTotal: calculo.costoBase,
      margen: Number(formulas.margenDefault || 0),
      utilidad,
      precioVenta,
      proveedor: proveedor?.nombre || 'Sin proveedor',
    };
  }, [form, producto, proveedor, costos, formulas]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'categoria'
        ? { subcategoria: '', productoId: '' }
        : {}),
      ...(name === 'subcategoria' ? { productoId: '' } : {}),
    }));
  };

  const agregarItem = () => {
    if (!producto) {
      alert('Seleccione un producto');
      return;
    }

    if (producto.calculo !== 'unidad' && (!form.ancho || !form.alto)) {
      alert('Ingrese ancho y alto');
      return;
    }

    if (!calculoActual) return;

    const item = {
      id: Date.now(),
      productoId: producto.id,
      producto: producto.nombre,
      categoria: producto.categoria,
      subcategoria: producto.subcategoria,
      calculo: producto.calculo,
      ancho: Number(form.ancho || 0),
      alto: Number(form.alto || 0),
      unidad: form.unidad,
      anchoM: calculoActual.anchoM,
      altoM: calculoActual.altoM,
      areaUnidad: calculoActual.areaUnidad,
      areaTotal: calculoActual.areaTotal,
      cantidad: calculoActual.cantidad,
      costoMateriales: calculoActual.materiales,
      costoProduccion: calculoActual.produccion,
      costoInstalacion: calculoActual.instalacion,
      costoTransporte: calculoActual.transporte,
      costoTotal: calculoActual.costoTotal,
      margen: calculoActual.margen,
      utilidad: calculoActual.utilidad,
      precioVenta: calculoActual.precioVenta,
      proveedorId: producto.proveedorId,
      proveedor: calculoActual.proveedor,
      observacion: form.observacion,
    };

    setItems((prev) => [item, ...prev]);

    setForm((prev) => ({
      ...prev,
      ancho: '',
      alto: '',
      cantidad: 1,
      observacion: '',
    }));
  };

  const eliminarItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totales = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.areaTotal += Number(item.areaTotal || 0);
        acc.materiales += Number(item.costoMateriales || 0);
        acc.produccion += Number(item.costoProduccion || 0);
        acc.instalacion += Number(item.costoInstalacion || 0);
        acc.transporte += Number(item.costoTransporte || 0);
        acc.costoTotal += Number(item.costoTotal || 0);
        acc.utilidad += Number(item.utilidad || 0);
        acc.precioVenta += Number(item.precioVenta || 0);
        return acc;
      },
      {
        areaTotal: 0,
        materiales: 0,
        produccion: 0,
        instalacion: 0,
        transporte: 0,
        costoTotal: 0,
        utilidad: 0,
        precioVenta: 0,
      }
    );
  }, [items]);

  const guardar = () => {
    if (items.length === 0) {
      alert('Agregue al menos un producto');
      return;
    }

    const cotizacion = {
      id: Date.now(),
      codigo: `COT-${Date.now()}`,
      fecha: new Date().toISOString(),
      cliente: form.cliente || 'Cliente sin registrar',
      vendedor: sesion?.nombre || 'Sistema',
      vendedorId: sesion?.vendedorId || '',
      estado: 'Pendiente',
      origen: modo,
      items,
      subtotal: totales.precioVenta,
      total: totales.precioVenta,
      costoTotal: totales.costoTotal,
      utilidad: totales.utilidad,
      areaTotal: totales.areaTotal,
      observacion: form.observacion,
    };

    guardarCotizacion(cotizacion);
    setItems([]);
    setForm(inicial);
    alert('Cotización guardada correctamente');
  };

  return (
    <main>
      <h1>Cotizador Interno</h1>

      <section className="card">
        <p>
          Cotizador operativo con cálculo automático de materiales,
          producción, instalación, transporte y margen comercial.
        </p>
      </section>

      <section className="card form">
        <h2>Datos de cotización</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: 10,
          }}
        >
          <input
            name="cliente"
            placeholder="Cliente"
            value={form.cliente}
            onChange={cambiar}
          />

          <select
            name="categoria"
            value={form.categoria}
            onChange={cambiar}
          >
            <option value="">Categoría</option>
            {categorias.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            name="subcategoria"
            value={form.subcategoria}
            onChange={cambiar}
          >
            <option value="">Subcategoría</option>
            {subcategorias.map((sub) => (
              <option key={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr repeat(4,minmax(80px,1fr)) auto',
            gap: 10,
            marginTop: 10,
          }}
        >
          <select
            name="productoId"
            value={form.productoId}
            onChange={cambiar}
          >
            <option value="">Producto</option>
            {productosFiltrados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <input
            name="ancho"
            type="number"
            step="0.01"
            placeholder="Ancho"
            value={form.ancho}
            onChange={cambiar}
          />

          <input
            name="alto"
            type="number"
            step="0.01"
            placeholder="Alto"
            value={form.alto}
            onChange={cambiar}
          />

          <select
            name="unidad"
            value={form.unidad}
            onChange={cambiar}
          >
            {unidades.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>

          <input
            name="cantidad"
            type="number"
            min="1"
            step="1"
            placeholder="Cant."
            value={form.cantidad}
            onChange={cambiar}
          />

          <button type="button" onClick={agregarItem}>
            Agregar
          </button>
        </div>

        <textarea
          name="observacion"
          placeholder="Observación técnica"
          value={form.observacion}
          onChange={cambiar}
          style={{ marginTop: 10 }}
        />
      </section>

      {calculoActual && (
        <section className="kpis">
          <div className="kpi">
            <b>{calculoActual.areaTotal.toFixed(2)} m²</b>
            <span>Área total</span>
          </div>

          <div className="kpi">
            <b>US$ {calculoActual.costoTotal.toFixed(2)}</b>
            <span>Costo total</span>
          </div>

          <div className="kpi">
            <b>{calculoActual.margen}%</b>
            <span>Margen</span>
          </div>

          <div className="kpi">
            <b>US$ {calculoActual.precioVenta.toFixed(2)}</b>
            <span>Precio sugerido</span>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Detalle de cotización</h2>

        <table className="crm-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Medida</th>
              <th>Cant.</th>
              <th>Área</th>
              <th>Materiales</th>
              <th>Producción</th>
              <th>Instalación</th>
              <th>Transporte</th>
              <th>Total</th>
              <th>Venta</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.producto}</td>
                <td>
                  {item.ancho} × {item.alto} {item.unidad}
                </td>
                <td>{item.cantidad}</td>
                <td>{Number(item.areaTotal || 0).toFixed(2)} m²</td>
                <td>US$ {Number(item.costoMateriales || 0).toFixed(2)}</td>
                <td>US$ {Number(item.costoProduccion || 0).toFixed(2)}</td>
                <td>US$ {Number(item.costoInstalacion || 0).toFixed(2)}</td>
                <td>US$ {Number(item.costoTransporte || 0).toFixed(2)}</td>
                <td>US$ {Number(item.costoTotal || 0).toFixed(2)}</td>
                <td>
                  <strong>
                    US$ {Number(item.precioVenta || 0).toFixed(2)}
                  </strong>
                </td>
                <td>
                  <button onClick={() => eliminarItem(item.id)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan="11">No hay productos agregados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="kpis">
        <div className="kpi">
          <b>{totales.areaTotal.toFixed(2)} m²</b>
          <span>Área total</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.materiales.toFixed(2)}</b>
          <span>Materiales</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.produccion.toFixed(2)}</b>
          <span>Producción</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.instalacion.toFixed(2)}</b>
          <span>Instalación</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.transporte.toFixed(2)}</b>
          <span>Transporte</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.costoTotal.toFixed(2)}</b>
          <span>Costo total</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.utilidad.toFixed(2)}</b>
          <span>Utilidad</span>
        </div>

        <div className="kpi">
          <b>US$ {totales.precioVenta.toFixed(2)}</b>
          <span>Precio venta</span>
        </div>
      </section>

      <section className="card">
        <button type="button" onClick={guardar}>
          Guardar cotización
        </button>
      </section>
    </main>
  );
}