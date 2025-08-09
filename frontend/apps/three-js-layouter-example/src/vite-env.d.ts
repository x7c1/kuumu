/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KUUMU_FONT_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
