import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';
import { PreferencesProvider } from './context/PreferencesContext';

// Suppress AudioContext device errors from console - these are harmless system-level issues
const originalError = console.error;
const originalWarn = console.warn;
console.error = function(...args) {
  // Suppress AudioContext audio device errors - these are harmless and common on some systems
  const message = args.map(a => String(a)).join(' ');
  if (message.includes('AudioContext') || message.includes('audio device') || message.includes('WebAudio')) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(a => String(a)).join(' ');
  if (message.includes('AudioContext') || message.includes('audio device') || message.includes('WebAudio')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Also suppress audio errors from global error handlers
let errorSuppressed = false;
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('AudioContext') || event.message.includes('audio device') || event.message.includes('WebAudio'))) {
    event.preventDefault();
    errorSuppressed = true;
  }
}, true);

// Suppress unhandled rejection errors related to audio
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && String(event.reason).includes('AudioContext')) {
    event.preventDefault();
  }
}, true);

ReactDOM.render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>,
  document.getElementById('root')
);