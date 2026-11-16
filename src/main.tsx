import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// Tipografías servidas desde el propio sitio: funcionan sin conexión y sin pedidos a terceros
import '@fontsource/rozha-one/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './index.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Falta el elemento #root')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
