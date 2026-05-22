/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Add VITE_* variables here when needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
