import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/gold-preview.css'
import './goldPreview.js'
import App from './App.jsx'
import BlackBoxProvider from './blackbox/BlackBoxProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BlackBoxProvider><App /></BlackBoxProvider>
  </StrictMode>,
)
