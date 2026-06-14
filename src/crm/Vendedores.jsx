import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

export default function Vendedores() {
  const {
    vendedores,
    crearVendedor,
    actualizarVendedor,
    eliminarVendedor,
  } = useCore();

  const [formulario, setFormulario] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    zona: '',
    ventas: '',
    comisionPorcentaje: 10,
    estado: 'Activo',
    nota: '',
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [editandoId, setEditandoId] = useState(null);

  const formatoCordobas = (valor) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO',
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  };

  const vendedoresFiltrados = useMemo(() => {
    return vendedores.filter((vendedor) => {
      const texto = `${vendedor.nombre} ${vendedor.telefono} ${vendedor.correo} ${vendedor.zona} ${vendedor.estado} ${vendedor.nota}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideEstado =
        filtroEstado === 'Todos' || vendedor.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [vendedores, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    const totalVentas = vendedores.reduce(
      (total, vendedor) => total + Number(vendedor.ventas || 0),
      0
    );

    const totalComisiones = vendedores.reduce((total, vendedor) => {
      const ventas = Number(vendedor.ventas || 0);
      const porcentaje = Number(vendedor.comisionPorcentaje || 0);
      return total + (ventas * porcentaje) / 100;
    }, 0);

    return {
      totalVendedores: vendedores.length,
      activos: vendedores.filter((v) => v.estado === 'Activo').length,
      inactivos: vendedores.filter((v) => v.estado === 'Inactivo').length,
      totalVentas,
      totalComisiones,
    };
  }, [vendedores]);

  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      telefono: '',
      correo: '',
      zona: '',
      ventas: '',
      comisionPorcentaje: 10,
      estado: 'Activo',
      nota: '',
    });

    setEditandoId(null);
  };

  const guardarVendedor = (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert('DebÃ©s ingresar el nombre del vendedor.');
      return;
    }

    const datosVendedor = {
      ...formulario,
      ventas: Number(formulario.ventas || 0),
      comisionPorcentaje: Number(formulario.comisionPorcentaje || 0),
    };

    if (editandoId) {
      actualizarVendedor(editandoId, datosVendedor);
    } else {
      crearVendedor(datosVendedor);
    }

    limpiarFormulario();
  };

  const editarVendedor = (vendedor) => {
    setFormulario({
      nombre: vendedor.nombre || '',
      telefono: vendedor.telefono || '',
      correo: vendedor.correo || '',
      zona: vendedor.zona || '',
      ventas: vendedor.ventas || '',
      comisionPorcentaje: vendedor.comisionPorcentaje || 10,
      estado: vendedor.estado || 'Activo',
      nota: vendedor.nota || '',
    });

    setEditandoId(vendedor.id);
  };

  const confirmarEliminarVendedor = (id) => {
    const confirmar = window.confirm(
      'Â¿Seguro que querÃ©s eliminar este vendedor?'
    );

    if (!confirmar) return;

    eliminarVendedor(id);

    if (editandoId === id) {
      limpiarFormulario();
    }
  };

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Vendedores</h2>
          <p>
            AdministraciÃ³n de vendedores, ventas acumuladas y comisiones del CRM
            Central ELANKAV.
          </p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Vendedores</span>
          <strong>{resumen.totalVendedores}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Activos</span>
          <strong>{resumen.activos}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Total vendido</span>
          <strong>{formatoCordobas(resumen.totalVentas)}</strong>
        </div>

        <div className="crm-stat-card">
          <span>Comisiones</span>
          <strong>{formatoCordobas(resumen.totalComisiones)}</strong>
        </div>
      </div>

      <div className="crm-grid">
        <form className="crm-card" onSubmit={guardarVendedor}>
          <h3>{editandoId ? 'Editar vendedor' : 'Nuevo vendedor'}</h3>

          <label>
            Nombre
            <input
              type="text"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
              placeholder="Ej: Erick Cano"
            />
          </label>

          <label>
            TelÃ©fono / WhatsApp
            <input
              type="text"
              value={formulario.telefono}
              onChange={(e) =>
                setFormulario({ ...formulario, telefono: e.target.value })
              }
              placeholder="Ej: +505 8888 8888"
            />
          </label>

          <label>
            Correo
            <input
              type="email"
              value={formulario.correo}
              onChange={(e) =>
                setFormulario({ ...formulario, correo: e.target.value })
              }
              placeholder="Ej: vendedor@elankav.com"
            />
          </label>

          <label>
            Zona
            <input
              type="text"
              value={formulario.zona}
              onChange={(e) =>
                setFormulario({ ...formulario, zona: e.target.value })
              }
              placeholder="Ej: Managua, Masaya, Granada"
            />
          </label>

          <label>
            Total vendido
            <input
              type="number"
              min="0"
              value={formulario.ventas}
              onChange={(e) =>
                setFormulario({ ...formulario, ventas: e.target.value })
              }
              placeholder="Ej: 15000"
            />
          </label>

          <label>
            ComisiÃ³n %
            <input
              type="number"
              min="0"
              max="100"
              value={formulario.comisionPorcentaje}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  comisionPorcentaje: e.target.value,
                })
              }
              placeholder="Ej: 10"
            />
          </label>

          <label>
            Estado
            <select
              value={formulario.estado}
              onChange={(e) =>
                setFormulario({ ...formulario, estado: e.target.value })
              }
            >
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Suspendido</option>
            </select>
          </label>

          <label>
            Nota
            <textarea
              value={formulario.nota}
              onChange={(e) =>
                setFormulario({ ...formulario, nota: e.target.value })
              }
              placeholder="Notas del vendedor, acuerdos o condiciones..."
              rows="4"
            />
          </label>

          <div className="crm-actions">
            <button type="submit">
              {editandoId ? 'Guardar cambios' : 'Agregar vendedor'}
            </button>

            {editandoId && (
              <button type="button" onClick={limpiarFormulario}>
                Cancelar ediciÃ³n
              </button>
            )}
          </div>
        </form>

        <div className="crm-card">
          <div className="crm-toolbar">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar vendedor, telÃ©fono, zona o nota..."
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Suspendido</option>
            </select>
          </div>

          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>WhatsApp</th>
                  <th>Correo</th>
                  <th>Zona</th>
                  <th>Ventas</th>
                  <th>ComisiÃ³n %</th>
                  <th>ComisiÃ³n</th>
                  <th>Estado</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {vendedoresFiltrados.length > 0 ? (
                  vendedoresFiltrados.map((vendedor) => {
                    const comision =
                      (Number(vendedor.ventas || 0) *
                        Number(vendedor.comisionPorcentaje || 0)) /
                      100;

                    return (
                      <tr key={vendedor.id}>
                        <td>{vendedor.nombre}</td>
                        <td>{vendedor.telefono || 'Sin telÃ©fono'}</td>
                        <td>{vendedor.correo || 'Sin correo'}</td>
                        <td>{vendedor.zona || 'Sin zona'}</td>
                        <td>{formatoCordobas(vendedor.ventas)}</td>
                        <td>{vendedor.comisionPorcentaje}%</td>
                        <td>{formatoCordobas(comision)}</td>
                        <td>{vendedor.estado}</td>
                        <td>{vendedor.nota || 'Sin nota'}</td>
                        <td>
                          <div className="crm-row-actions">
                            <button
                              type="button"
                              onClick={() => editarVendedor(vendedor)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                confirmarEliminarVendedor(vendedor.id)
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10">
                      No hay vendedores registrados con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
