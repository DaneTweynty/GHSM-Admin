/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: 'development' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
