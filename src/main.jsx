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