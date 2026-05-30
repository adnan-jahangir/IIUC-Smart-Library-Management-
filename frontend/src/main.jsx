import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Configure API base from Vite env or default to localhost during development
const API_BASE = 'https://iiuc-smart-library-management.onrender.com';
axios.defaults.baseURL = API_BASE;

// Rewrite any hardcoded absolute backend URLs at runtime so existing code works
if (typeof window !== 'undefined' && API_BASE && API_BASE !== 'http://localhost:5000') {
  // Axios interceptor to rewrite absolute URLs
  axios.interceptors.request.use((config) => {
    if (config && typeof config.url === 'string' && config.url.startsWith('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', API_BASE);
    }
    return config;
  }, (err) => Promise.reject(err));

  // Monkey-patch window.fetch to rewrite absolute backend URLs
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      if (typeof input === 'string' && input.startsWith('http://localhost:5000')) {
        input = input.replace('http://localhost:5000', API_BASE);
      } else if (input instanceof Request && input.url.startsWith('http://localhost:5000')) {
        input = new Request(input.url.replace('http://localhost:5000', API_BASE), input);
      }
    } catch (e) {
      // ignore and fallback to original
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
