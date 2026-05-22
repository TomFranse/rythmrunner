/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  // Add VITE_* variables here when needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
