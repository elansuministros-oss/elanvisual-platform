import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const CATEGORIAS = ['Material', 'Producto terminado', 'Herramienta', 'Insumo', 'Equipo', 'Otro'];
const UNIDADES = ['Unidad', 'Lámina', 'Metro', 'Metro cuadrado', 'Rollo', 'Galón', 'Caja', 'Kit'];
const MONEDAS = ['C$', 'USD'];

const numero = (valor) => Number(valor || 0);

const dinero = (valor, moneda = 'C$') => {
  const currency = moneda === 'USD' ? 'USD' : 'NIO';

  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numero(valor));
};

const fechaActual = () => new Date().toISOString().slice(0, 10);

const formInicial = () => ({
  codigo: '',
  producto: '',
  categoria: 'Material',
  unidad: 'Unidad',
  cantidad: '',
  entradas: '',
  salidas: '',
  stockMinimo: '',
  costoUnitario: '',
  costoPromedio: '',
  moneda: 'C$',
  proveedor: '',
  ubicacion: '',
  estado: 'Disponible',
  fechaIngreso: fechaActual(),
  observaciones: '',
});

export default function Inventario() {
  const {
    inventario,
    crearInventario,
    actualizarInventario,
    eliminarInventario,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState(formInicial());

  const resumen = useMemo(() => {
    return inventario.reduce(
      (acc, item) => {
        const existencia = numero(item.cantidad);
        const costo = numero(item.costoPromedio || item.costoUnitario);
        const valor = existencia * costo;

        acc.items += 1;
        acc.existencia += existencia;
        acc.valor += valor;

        if (existencia <= numero(item.stockMinimo)) {
          acc.stockBajo += 1;
        }

        return acc;
      },
      { items: 0, existencia: 0, valor: 0, stockBajo: 0 }
    );
  }, [inventario]);

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return inventario;

    return inventario.filter((item) =>
      [item.codigo, item.producto, item.categoria, item.proveedor, item.ubicacion, item.estado]
        .join(' ')
        .toLowerCase()
        .includes(texto)
    );
  }, [inventario, busqueda]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiar = () => {
    setForm(formInicial());
    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.producto.trim()) return;

    const cantidadInicial = numero(form.cantidad);
    const entradas = numero(form.entradas);
    const salidas = numero(form.salidas);
    const existencia = cantidadInicial + entradas - salidas;
    const costoUnitario = numero(form.costoUnitario);
    const costoPromedio = numero(form.costoPromedio || form.costoUnitario);
    const valorInventario = existencia * costoPromedio;

    const datos = {
      ...form,
      id: editandoId || form.id,
      codigo: form.codigo.trim() || `INV-${Date.now()}`,
      producto: form.producto.trim(),
      proveedor: form.proveedor.trim(),
      ubicacion: form.ubicacion.trim(),
      observaciones: form.observaciones.trim(),
      cantidad: existencia,
      entradas,
      salidas,
      stockMinimo: numero(form.stockMinimo),
      costoUnitario,
      costoPromedio,
      valorInventario,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarInventario(editandoId, datos);
    } else {
      crearInventario(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm({
      ...formInicial(),
      ...item,
      cantidad: item.cantidad ?? '',
      entradas: '',
      salidas: '',
      stockMinimo: item.stockMinimo ?? '',
      costoUnitario: item.costoUnitario ?? '',
      costoPromedio: item.costoPromedio ?? '',
    });
  };

  const eliminar = (id) => {
    eliminarInventario(id);
    if (editandoId === id) limpiar();
  };

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Inventario</h2>
          <p>Existencias, entradas, salidas, costo promedio y valor real del inventario.</p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Items</span>
          <strong>{resumen.items}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Existencia total</span>
          <strong>{resumen.existencia}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Valor inventario</span>
          <strong>{dinero(resumen.valor)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Stock bajo</span>
          <strong>{resumen.stockBajo}</strong>
        </div>
      </div>

      <div className="crm-card">
        <h3>{editandoId ? 'Editar inventario' : 'Nuevo item de inventario'}</h3>

        <form onSubmit={guardar} className="crm-form-grid">
          <label>
            Código
            <input name="codigo" value={form.codigo} onChange={cambiar} placeholder="Automático" />
          </label>

          <label>
            Producto
            <input name="producto" value={form.producto} onChange={cambiar} />
          </label>

          <label>
            Categoría
            <select name="categoria" value={form.categoria} onChange={cambiar}>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </label>

          <label>
            Unidad
            <select name="unidad" value={form.unidad} onChange={cambiar}>
              {UNIDADES.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </label>

          <label>
            Existencia actual
            <input name="cantidad" type="number" step="0.01" value={form.cantidad} onChange={cambiar} />
          </label>

          <label>
            Entrada nueva
            <input name="entradas" type="number" step="0.01" value={form.entradas} onChange={cambiar} />
          </label>

          <label>
            Salida nueva
            <input name="salidas" type="number" step="0.01" value={form.salidas} onChange={cambiar} />
          </label>

          <label>
            Stock mínimo
            <input name="stockMinimo" type="number" step="0.01" value={form.stockMinimo} onChange={cambiar} />
          </label>

          <label>
            Moneda
            <select name="moneda" value={form.moneda} onChange={cambiar}>
              {MONEDAS.map((moneda) => (
                <option key={moneda} value={moneda}>{moneda}</option>
              ))}
            </select>
          </label>

          <label>
            Costo unitario
            <input name="costoUnitario" type="number" step="0.01" value={form.costoUnitario} onChange={cambiar} />
          </label>

          <label>
            Costo promedio
            <input name="costoPromedio" type="number" step="0.01" value={form.costoPromedio} onChange={cambiar} />
          </label>

          <label>
            Proveedor
            <input name="proveedor" value={form.proveedor} onChange={cambiar} />
          </label>

          <label>
            Ubicación
            <input name="ubicacion" value={form.ubicacion} onChange={cambiar} />
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="En uso">En uso</option>
              <option value="Agotado">Agotado</option>
              <option value="Dañado">Dañado</option>
            </select>
          </label>

          <label>
            Fecha ingreso
            <input name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={cambiar} />
          </label>

          <div className="crm-field-full crm-cost-box">
            <strong>Resultado de movimiento</strong>
            <span>Existencia final: {numero(form.cantidad) + numero(form.entradas) - numero(form.salidas)} {form.unidad}</span>
            <span>
              Valor estimado:{' '}
              {dinero(
                (numero(form.cantidad) + numero(form.entradas) - numero(form.salidas)) *
                  numero(form.costoPromedio || form.costoUnitario),
                form.moneda
              )}
            </span>
          </div>

          <div className="crm-actions crm-field-full">
            <button type="submit">{editandoId ? 'Actualizar item' : 'Crear item'}</button>
            {editandoId && (
              <button type="button" onClick={limpiar} className="btn-secondary">
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="crm-card">
        <div className="crm-page-header">
          <div>
            <h3>Listado de inventario</h3>
            <p>Control de existencias y valor en almacén.</p>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar inventario..."
          />
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Existencia</th>
                <th>Stock mínimo</th>
                <th>Costo promedio</th>
                <th>Valor</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => {
                const existencia = numero(item.cantidad);
                const bajoStock = existencia <= numero(item.stockMinimo);
                const costo = numero(item.costoPromedio || item.costoUnitario);
                const valor = existencia * costo;

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>{item.producto}</td>
                    <td>{item.categoria}</td>
                    <td>
                      {existencia} {item.unidad}
                      {bajoStock && (
                        <>
                          <br />
                          <small>Stock bajo</small>
                        </>
                      )}
                    </td>
                    <td>{numero(item.stockMinimo)} {item.unidad}</td>
                    <td>{dinero(costo, item.moneda)}</td>
                    <td>{dinero(valor, item.moneda)}</td>
                    <td>{item.ubicacion || '-'}</td>
                    <td>{item.estado}</td>
                    <td>
                      <button type="button" onClick={() => editar(item)}>Editar</button>
                      <button type="button" onClick={() => eliminar(item.id)} className="btn-danger">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="10">No hay items de inventario registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .crm-cost-box {
          display: grid;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
        }
      `}</style>
    </div>
  );
}
