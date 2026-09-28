import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base obrigatória para GitHub Pages em https://huydan19.github.io/localiza-docs/
export default defineConfig({
  plugins: [react()],
  base: '/localiza-docs/',
})
