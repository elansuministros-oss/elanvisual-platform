import React from 'react';
import { createRoot } from 'react-dom/client';
import CleanApp from './clean/App.jsx';
import './clean/styles.css';
import './clean/recovered.css';
import './clean/orientation.css';
import './clean/private-surface.css';

if (window.location.pathname.startsWith('/vendedor')) {
  window.history.replaceState({}, '', '/');
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CleanApp />
  </React.StrictMode>
);
