import honox from 'honox/vite'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [honox()],
      build: {
        rollupOptions: {
          input: ['/app/client.ts'],
          output: {
            entryFileNames: 'static/[name]-[hash].js',
            chunkFileNames: 'static/[name]-[hash].js',
            assetFileNames: 'static/[name].[ext]'
          }
        },
        manifest: true,
        emptyOutDir: false,
        copyPublicDir: false
      }
    }
  } else {
    return {
      plugins: [honox()],
      build: {
        ssr: true,
        rollupOptions: {
          input: ['./app/server.ts']
        },
        emptyOutDir: false
      }
    }
  }
})