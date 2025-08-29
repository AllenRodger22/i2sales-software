import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { api } from '../services/api';

export type Profile = {
  id: string;
  email: string;
  role: string;
  name: string;
};

// Tipos públicos expostos pelo hook/Provider
type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; needsConfirmation?: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(message?: string | null): string {
  const msg = (message || '').toLowerCase();
  // Mapeamento de mensagens comuns (PT-BR amigável)
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Email ou senha inválidos.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Este email já está cadastrado.';
  }
  if (msg.includes('password should be at least') || msg.includes('password is too weak')) {
    return 'Senha fraca: verifique a política de senha.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  }
  return 'Ocorreu um erro. Tente novamente.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão ao montar
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      if (data.session) {
        try {
          const me = await api<Profile>('/auth/me');
          setProfile(me);
        } catch (_) {
          /* ignore */
        }
      }
      setLoading(false);
    })();

    // Ouve mudanças de autenticação (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        api<Profile>('/auth/me')
          .then(setProfile)
          .catch(() => setProfile(null));
      } else {
        setProfile(null);
      }

      // Eventos úteis para depuração/comportamento
      if (event === 'SIGNED_IN') {
        setError(null);
      }
      if (event === 'SIGNED_OUT') {
        setError(null);
      }
      if (event === 'TOKEN_REFRESHED') {
        // Access token foi atualizado silenciosamente — nada a fazer.
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = mapAuthError(error.message);
      setError(msg);
      return { ok: false, error: msg };
    }
    // Se confirmação por email estiver ativa, session pode vir null
    const needsConfirmation = !data.session;
    return { ok: true, needsConfirmation };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = mapAuthError(error.message);
      setError(msg);
      return { ok: false, error: msg };
    }
    try {
      const me = await api<Profile>('/auth/me');
      setProfile(me);
    } catch (_) {
      /* ignore */
    }
    return { ok: true };
  }, []);

  const signOutFn = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut(); // limpa LocalStorage e estados via listener
    setProfile(null);
  }, []);

  const refresh = useCallback(async () => {
    // Não é necessário em uso normal porque autoRefreshToken: true já cuida disso.
    // Mantemos esta ação para cenários em que você queira forçar um refresh manual.
    const { error } = await supabase.auth.refreshSession();
    if (error) setError(mapAuthError(error.message));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut: signOutFn,
    refresh,
  }), [user, session, profile, loading, error, signUp, signIn, signOutFn, refresh]);

  // Evite JSX para permitir que este arquivo seja um .ts puro.
  return React.createElement(AuthContext.Provider, { value }, children);
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

