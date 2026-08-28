/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string
  }
}
declare const process: {
  env: {
    NODE_ENV: string
  }
}
