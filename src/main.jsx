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

import { AppProvider } from './context/AppContext';
import { CoreProvider } from './core/context/CoreContext';

createRoot(document.getElementById('root')).render(
  <CoreProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </CoreProvider>
);

