import { StrictMode } from 'react' // wraps the app to surface extra warnings in development
import { createRoot } from 'react-dom/client' // React 18+ API for mounting an app onto a DOM node
import './index.css' // global base styles, loaded once here so every component gets them
import App from './App.jsx' // the top-level component holding all routes

// Find the <div id="root"> from index.html and render the whole app into it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
