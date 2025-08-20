import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryContextProvider } from './contexts/QueryContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryContextProvider>
      <App />
    </QueryContextProvider>
  </React.StrictMode>
);
