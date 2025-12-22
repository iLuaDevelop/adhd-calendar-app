import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';
import { PreferencesProvider } from './context/PreferencesContext';

// Suppress AudioContext device errors from console
const originalError = console.error;
console.error = function(...args) {
  // Suppress AudioContext audio device errors
  if (args.some(arg => typeof arg === 'string' && (arg.includes('AudioContext') || arg.includes('audio device')))) {
    return;
  }
  originalError.apply(console, args);
};

ReactDOM.render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>,
  document.getElementById('root')
);