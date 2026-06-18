import React from 'react';
import { useCore } from '../core/context/CoreContext';

export default function Clientes() {
  const { contactos } = useCore();

  const clientes = contactos.filter((contacto) => contacto.rol === 'Cliente');

  return (
    <div>
      <h2>Clientes</h2>
      <p>Contactos clasificados como clientes dentro del CRM Central.</p>

      {clientes.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {clientes.map((cliente) => (
            <div key={cliente.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
              <strong>{cliente.nombre}</strong>
              <p>{cliente.cargo || 'Sin cargo'}</p>
              <small>
                WhatsApp: {cliente.whatsapp || 'N/A'} | Correo: {cliente.correo || 'N/A'}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
