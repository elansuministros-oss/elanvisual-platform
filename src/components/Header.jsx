import React, { useState } from 'react';
import { PawPrint, ShoppingCart, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header({ page, setPage }) {
  const { resumen, usuario, logout, configuracion } = useApp();
  const [open, setOpen] = useState(false);

  const go = (p) => {
    setPage(p);
    setOpen(false);
  };

  const salir = () => {
    logout();
    go('home');
  };

  const publicLinks = [
    ['home', 'Inicio'],
    ['catalogo', 'Catálogo'],
    ['trabajos', 'Trabajos'],
    ['seguimiento', 'Seguimiento'],
    ['contacto', 'Contacto'],
  ];

  const links = usuario ? [] : publicLinks;

  return (
    <>
      <header className="desktop-header">
        <div className="brand" onClick={() => go('home')}>
          <span className="brand-mark"><PawPrint size={20} /></span>
          <strong>{configuracion.nombreSitio || 'PET.ELANKAV.COM'}</strong>
        </div>

        <nav className="desktop-nav">
          {links.map(([key, label]) => (
            <button key={key} className={page === key ? 'nav-active' : ''} onClick={() => go(key)}>
              {label}
            </button>
          ))}

          {usuario?.rol === 'admin' && <button onClick={() => go('admin')}>Admin</button>}
          {usuario?.rol === 'admin' && <button onClick={() => go('crm')}>CRM</button>}
          {usuario?.rol === 'admin' && <button onClick={() => go('produccion')}>Producción</button>}
          {usuario?.rol === 'produccion' && <button onClick={() => go('produccion')}>Producción</button>}
          {usuario?.rol === 'veterinaria' && <button onClick={() => go('vet')}>Mi Panel</button>}

          {usuario ? <button onClick={salir}>Salir</button> : <button onClick={() => go('login')}>Portal</button>}

          <button className="cart" onClick={() => go('carrito')}>
            <ShoppingCart size={18} /> {resumen?.cantidad || 0}
          </button>
        </nav>
      </header>

      <header className="mobile-header">
        <div className="mobile-bar">
          <div className="brand" onClick={() => go('home')}>
            <span className="brand-mark"><PawPrint size={18} /></span>
            <strong>{configuracion.logoTexto || configuracion.nombreSitio || 'ELANPET'}</strong>
          </div>

          <div className="mobile-actions">
            <button className="mobile-cart" onClick={() => go('carrito')}>
              <ShoppingCart size={18} />
              <span>{resumen?.cantidad || 0}</span>
            </button>

            <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="mobile-nav">
            {links.map(([key, label]) => (
              <button key={key} className={page === key ? 'nav-active' : ''} onClick={() => go(key)}>
                {label}
              </button>
            ))}

            {usuario?.rol === 'admin' && <button onClick={() => go('admin')}>Panel Admin</button>}
            {usuario?.rol === 'admin' && <button onClick={() => go('crm')}>CRM</button>}
            {usuario?.rol === 'admin' && <button onClick={() => go('produccion')}>Producción</button>}
            {usuario?.rol === 'produccion' && <button onClick={() => go('produccion')}>Producción</button>}
            {usuario?.rol === 'veterinaria' && <button onClick={() => go('vet')}>Mi Panel</button>}

            {usuario ? <button onClick={salir}>Salir</button> : <button onClick={() => go('login')}>Portal</button>}
          </nav>
        )}
      </header>
    </>
  );
}