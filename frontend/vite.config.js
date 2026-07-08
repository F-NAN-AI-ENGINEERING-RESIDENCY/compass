import { defineConfig } from 'vite' // Vite's config helper — gives us type hints/validation for the object below
import react from '@vitejs/plugin-react' // Plugin that teaches Vite how to compile JSX/React fast-refresh

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // enable the React plugin
  server: {
    port: 3000, // match the backend's CORS_ORIGINS=http://localhost:3000 (see app/config.py) so API calls aren't blocked
  },
  test: {
    environment: 'jsdom', // tests render components, so they need a fake DOM, not Node's default environment
    setupFiles: './src/test/setup.js',
  },
})
