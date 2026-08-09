import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    // @ts-ignore: Vite Wasm plugin type mismatch workaround
    wasm(),
    // @ts-ignore: Vite top-level await plugin type mismatch workaround
    topLevelAwait()
  ],
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/midnight-ledger-wasm'] 
  },
  build: {
    target: 'esnext'
  }
});