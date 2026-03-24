import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alias the Plotly path that `react-plotly.js` tries to require
// to the lighter `plotly.js-basic-dist` bundle we installed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'plotly.js/dist/plotly': 'plotly.js-basic-dist'
    }
  },
  server: {
    port: 5173
  }
})
