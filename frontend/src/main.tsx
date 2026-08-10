import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MidnightProvider } from './hooks/useMidnight.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MidnightProvider>
      <App />
    </MidnightProvider>
  </StrictMode>,
)
