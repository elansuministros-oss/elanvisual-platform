if (typeof window !== 'undefined' && !localStorage.getItem('elanvisual_limpieza_masiva_20260615')) {
  Object.keys(localStorage).forEach((key) => {
    const k = key.toLowerCase();
    if (
      k.includes('elanpet') ||
      k.includes('veterinaria') ||
      k.includes('mascota') ||
      k.includes('pet_') ||
      k.includes('productos') ||
      k.includes('catalogo') ||
      k.includes('trabajos') ||
      k.includes('banners')
    ) {
      localStorage.removeItem(key);
    }
  });

  localStorage.setItem('elanvisual_limpieza_masiva_20260615', 'ok');
}
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import PublicReceipt from './pages/PublicReceipt';

import { AppProvider } from './context/AppContext';
import { CoreProvider } from './core/context/CoreContext';

const pathname = typeof window !== 'undefined' ? String(window.location.pathname || '').replace(/^\/+|\/+$/g, '').toUpperCase() : '';
const isPublicReceipt = /^ELV-REC-\d{4}-\d{6}$/.test(pathname);

createRoot(document.getElementById('root')).render(
  isPublicReceipt ? (
    <PublicReceipt />
  ) : (
    <CoreProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </CoreProvider>
  )
);

