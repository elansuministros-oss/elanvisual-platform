import CRM from './crm/App/CRM.jsx';
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import VeterinariaPanel from './pages/VeterinariaPanel';
import ProduccionPanel from './pages/ProduccionPanel';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Contacto from './pages/Contacto';
import Trabajos from './pages/Trabajos';
import LandingVeterinaria from './pages/LandingVeterinaria';
import Seguimiento from './pages/Seguimiento';
import { useApp } from './context/AppContext';
import './styles/global.css';

export default function App() {
  const pathInicial = window.location.pathname || '/';

  const paginaInicial = (() => {
    if (pathInicial.startsWith('/crm')) return 'crm';
    if (pathInicial.startsWith('/seguimiento')) return 'seguimiento';
    if (pathInicial.startsWith('/login')) return 'login';
    if (pathInicial.startsWith('/admin')) return 'admin';
    if (pathInicial.startsWith('/produccion')) return 'produccion';
    if (pathInicial.startsWith('/v/')) return 'catalogo';
    return 'home';
  })();

  const [page, setPage] = useState(paginaInicial);

  const { usuario, configuracion, veterinarias, setVeterinaria } = useApp();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--azul',
      configuracion.colorPrincipal || '#1E5AA8'
    );

    document.documentElement.style.setProperty(
      '--teal',
      configuracion.colorSecundario || '#058B8C'
    );
  }, [configuracion]);

  useEffect(() => {
    const path = window.location.pathname || '/';
    const matchVet = path.match(/^\/v\/([^/]+)/i);

    if (!matchVet) return;

    const codigo = decodeURIComponent(matchVet[1]).trim().toLowerCase();

    if (!veterinarias?.length) {
      setPage('catalogo');
      return;
    }

    const vet = veterinarias.find(
      (v) =>
        String(v.codigo || '').toLowerCase() === codigo ||
        String(v.slug || '').toLowerCase() === codigo
    );

    if (vet) {
      setVeterinaria(vet);
      setPage('catalogo');
    } else {
      setPage('catalogo');
    }
  }, [veterinarias, setVeterinaria]);

  const ir = (destino) => {
    setPage(destino);

    if (destino === 'home') {
      window.history.pushState({}, '', '/');
    }

    if (destino === 'crm') {
      window.history.pushState({}, '', '/crm');
    }

    if (destino === 'seguimiento') {
      window.history.pushState({}, '', '/seguimiento');
    }

    if (destino === 'login') {
      window.history.pushState({}, '', '/login');
    }

    if (destino === 'admin') {
      window.history.pushState({}, '', '/admin');
    }

    if (destino === 'produccion') {
      window.history.pushState({}, '', '/produccion');
    }
  };

  return (
    <>
      <Header page={page} setPage={ir} />

      {page === 'home' && <Home setPage={ir} />}
      {page === 'catalogo' && <Catalogo />}
      {page === 'trabajos' && <Trabajos />}
      {page === 'carrito' && <Carrito />}
      {page === 'contacto' && <Contacto />}
      {page === 'crm' && <CRM />}
      {page === 'seguimiento' && <Seguimiento />}
      {page === 'login' && <Login setPage={ir} />}
      {page === 'landing-vet' && <LandingVeterinaria setPage={ir} />}

      {page === 'vet' &&
        (usuario?.rol === 'veterinaria' ? (
          <VeterinariaPanel />
        ) : (
          <Login setPage={ir} destino="vet" />
        ))}

      {page === 'produccion' &&
        (usuario?.rol === 'admin' || usuario?.rol === 'produccion' ? (
          <ProduccionPanel />
        ) : (
          <Login setPage={ir} destino="produccion" />
        ))}

      {page === 'admin' &&
        (usuario?.rol === 'admin' ? (
          <AdminPanel />
        ) : (
          <Login setPage={ir} destino="admin" />
        ))}
    </>
  );
}