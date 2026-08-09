/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string
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
