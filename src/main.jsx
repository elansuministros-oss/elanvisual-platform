import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { ElanProvider } from './core/context/ElanContext.jsx';

import './styles/reset.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/admin.css';
import './styles/public.css';
import './styles/tables.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ElanProvider>
        <App />
      </ElanProvider>
    </BrowserRouter>
  </React.StrictMode>
);