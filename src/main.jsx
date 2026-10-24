import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Signal that React DOM has loaded
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    if (typeof window.__DISMISS_WRAPSTORE_INTRO__ === 'function') {
      window.__DISMISS_WRAPSTORE_INTRO__();
    }
  });
}
