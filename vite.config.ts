import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [
        honox(),
        tailwindcss()
      ],
      build: {
        rollupOptions: {
          input: ['/app/client.ts', '/app/style.css'],
          output: {
            entryFileNames: 'static/[name]-[hash].js',
            chunkFileNames: 'static/[name]-[hash].js',
            assetFileNames: 'static/[name]-[hash].[ext]'
          }
        },
        manifest: true,
        emptyOutDir: false,
        copyPublicDir: true
      }
    }
  } else {
    return {
      plugins: [
        honox(),
        tailwindcss()
      ],
      build: {
        ssr: true,
        rollupOptions: {
          input: {
            index: './app/node.ts'
          },
          output: {
            format: 'esm',
            entryFileNames: '[name].js'
          }
        },
        emptyOutDir: false,
        minify: false,
        outDir: 'dist',
        target: 'node18'
      },
      ssr: {
        external: ['@hono/node-server']
      }
    }
  }
})