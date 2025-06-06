import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { PredictionProvider } from './lib/PredictionContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PredictionProvider>
          <App />
        </PredictionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);