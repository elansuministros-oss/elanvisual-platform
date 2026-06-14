import React, { useState } from 'react';
import { useCore } from '../core/context/CoreContext';

export default function Empresas() {
  const { empresas, crearEmpresa, eliminarEmpresa } = useCore();

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    telefono: '',
    correo: '',
    estado: 'Activo',
  });

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) return;

    crearEmpresa({
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      estado: form.estado,
    });

    setForm({
      nombre: '',
      codigo: '',
      descripcion: '',
      telefono: '',
      correo: '',
      estado: 'Activo',
    });
  };

  return (
    <div>
      <h2>Empresas</h2>
      <p>Registro maestro de empresas del CRM Central ELANKAV.</p>

      <form onSubmit={guardar} style={{ display: 'grid', gap: 10, maxWidth: 600 }}>
        <input name="nombre" placeholder="Nombre de empresa" value={form.nombre} onChange={cambiar} />
        <input name="codigo" placeholder="CÃ³digo" value={form.codigo} onChange={cambiar} />
        <input name="telefono" placeholder="TelÃ©fono" value={form.telefono} onChange={cambiar} />
        <input name="correo" placeholder="Correo" value={form.correo} onChange={cambiar} />
        <textarea name="descripcion" placeholder="DescripciÃ³n" value={form.descripcion} onChange={cambiar} />

        <select name="estado" value={form.estado} onChange={cambiar}>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        <button type="submit">Guardar empresa</button>
      </form>

      <hr />

      <h3>Empresas registradas</h3>

      {empresas.length === 0 ? (
        <p>No hay empresas registradas.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {empresas.map((empresa) => (
            <div key={empresa.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
              <strong>{empresa.nombre}</strong>
              <p>{empresa.descripcion}</p>
              <small>
                CÃ³digo: {empresa.codigo || 'N/A'} | Tel: {empresa.telefono || 'N/A'} | Estado: {empresa.estado}
              </small>
              <br />
              <button onClick={() => eliminarEmpresa(empresa.id)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
