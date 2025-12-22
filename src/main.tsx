import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';
import { PreferencesProvider } from './context/PreferencesContext';

// Suppress AudioContext device errors from console
const originalError = console.error;
console.error = function(...args) {
  // Suppress AudioContext audio device errors - these are harmless and common on some systems
  if (args.some(arg => typeof arg === 'string' && (arg.includes('AudioContext') || arg.includes('audio device') || arg.includes('WebAudio')))) {
    return;
  }
  originalError.apply(console, args);
};

// Also suppress audio errors from global error handler
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('AudioContext') || event.message.includes('audio device'))) {
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