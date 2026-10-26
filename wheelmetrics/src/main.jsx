import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WheelMetrics from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WheelMetrics />
  </StrictMode>,
)
