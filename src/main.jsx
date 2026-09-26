import React from 'react';
import { createRoot } from 'react-dom/client';
import CleanApp from './clean/App.jsx';
import CustomerPortal from './pages/CustomerPortal.jsx';
import './clean/styles.css';
import './clean/recovered.css';
import './clean/orientation.css';
import './clean/private-surface.css';

if (window.location.pathname.startsWith('/vendedor')) {
  window.history.replaceState({}, '', '/');
}

const isCustomerPortal = /^\/c\/[A-Za-z0-9_-]{22}\/?$/.test(
  window.location.pathname || ''
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCustomerPortal ? <CustomerPortal /> : <CleanApp />}
  </React.StrictMode>
);
