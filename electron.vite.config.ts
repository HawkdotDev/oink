import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      target: 'node20',
      minify: 'esbuild',
      rollupOptions: {
        treeshake: true
      }
    }
  },
  preload: {
    build: {
      target: 'node20',
      minify: 'esbuild',
      rollupOptions: {
        treeshake: true
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        treeshake: true,
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('node_modules')) {
              if (id.includes('@editorjs') || id.includes('editorjs-drag-drop')) {
                return 'vendor-editor'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons'
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-react'
              }
            }
            return undefined
          }
        }
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
