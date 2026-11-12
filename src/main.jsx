import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import BlackBoxProvider from './blackbox/BlackBoxProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BlackBoxProvider><App /></BlackBoxProvider>
  </StrictMode>,
)
