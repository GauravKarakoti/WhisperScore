import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    react(),
    // @ts-ignore: Vite Wasm plugin type mismatch workaround
    wasm()
  ],
  resolve: {
    // Force a single physical copy of the Midnight packages in the bundle.
    // The frontend builds CompiledContract (from midnight-js-protocol/compact-js)
    // and calls findDeployedContract (from midnight-js-contracts); if those two
    // resolve to different copies of compact-js / onchain-runtime, the contract
    // ctor (stored under a per-copy Symbol) reads back undefined and writes throw
    // "expected instance of StateValue".
    dedupe: [
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/midnight-js-protocol',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/onchain-runtime-v3',
    ],
    alias: {
      // Replaces __dirname to fix the configLoader: 'native' warning
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    // Required to prevent Vite from improperly pre-bundling the Midnight WASM ledger
    exclude: ['@midnight-ntwrk/midnight-ledger-wasm']
    // Removed the deprecated 'esbuildOptions' block. Vite now uses Rolldown 
    // and natively respects the build.target setting below for modern features.
  },
  build: {
    target: 'esnext',
    // Switches the CSS minifier to esbuild to bypass the lightningcss syntax crash
    // caused by the Shadcn/Tailwind v4 CSS variables
    cssMinify: 'esbuild'
  }
});