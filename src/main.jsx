import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

console.log('Main.jsx loaded');
console.log('Root element:', document.getElementById('root'));

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
  console.log('React mounted successfully');
} catch (error) {
  console.error('Error mounting React:', error);
  document.body.innerHTML = `<h1>Error: ${error.message}</h1><pre>${error.stack}</pre>`;
}