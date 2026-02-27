import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/JSON-Formatter/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('monaco-editor') || id.includes('@monaco-editor/loader')) {
            return 'monaco'
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 
