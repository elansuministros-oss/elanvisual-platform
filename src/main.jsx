import React from 'react';
import { createRoot } from 'react-dom/client';
import CleanApp from './clean/App.jsx';
import './clean/styles.css';
import './clean/recovered.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CleanApp />
  </React.StrictMode>
);
