import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <WalletProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
              },
            }}
          />
        </WalletProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
); 