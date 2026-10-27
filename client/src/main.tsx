import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConfigErrorScreen from './screens/ConfigErrorScreen';
import { missingConfig } from './config';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find the #root element to mount to');

if (missingConfig.length > 0) {
  console.error(`TripSync cannot start: missing required environment variable(s) ${missingConfig.join(', ')}. See client/.env.example.`);
  createRoot(rootElement).render(<ConfigErrorScreen missing={missingConfig} />);
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Offline shell: only in production builds, so it never gets in the way of the dev server.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker not registered:', error));
  });
}
