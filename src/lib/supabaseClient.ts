// Supabase client centralizado para o app (apenas frontend)
// Observação importante: use SOMENTE a anon key no frontend. NUNCA exponha service_role.
// A persistência padrão do Supabase usa LocalStorage com a chave: sb-<project-ref>-auth-token
// (o SDK gerencia automaticamente salvar/restaurar a sessão e o auto-refresh do token).

import { createClient } from '@supabase/supabase-js';

// Correção para HashRouter: se a URL vier como "#/rota#access_token=...",
// movemos o fragmento de token para o início do hash para o SDK conseguir ler.
if (typeof window !== 'undefined') {
  const h = window.location.hash || '';
  const tokenPos = h.indexOf('#access_token=');
  if (h.startsWith('#/') && tokenPos > -1) {
    // Ex.: "#/login#access_token=..." -> "#access_token=..."
    window.location.hash = h.substring(tokenPos);
  }
}

// Em Vite, variáveis públicas começam com VITE_
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Config recomendada (copiada exatamente do requisito)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // salva a sessão no LocalStorage automaticamente
    autoRefreshToken: true, // renova o access_token em silêncio via refresh_token
    detectSessionInUrl: true, // detecta hash/params de OAuth/password reset, quando aplicável
    storage: window.localStorage, // a chave usada é sb-<project-ref>-auth-token
  },
});

// Expor no window para facilitar depuração no console
// Ex.: const { data:{ session } } = await window.supabase.auth.getSession()
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
