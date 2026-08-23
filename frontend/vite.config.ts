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
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/midnight-ledger-wasm']
  },
  build: {
    target: 'esnext'
  }
});