/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string
  readonly VITE_DEV_MODE?: string
  readonly VITE_USE_MOCKS?: string
  readonly VITE_API_BASE?: string
  readonly VITE_DEV_SKIP_AUTH?: string
  readonly VITE_OAUTH_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
