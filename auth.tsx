import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Role } from './types';
import { ApiError } from './services/api';
import { supabase } from './src/lib/supabaseClient';
import * as authService from './services/auth'; // manter apenas para getMe()
import { ensureUser } from './services/users';

type AuthState = 'loading' | 'authed' | 'guest';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ confirmationSent: boolean }>;
  logout: () => Promise<void>;
  error: string | null;
  state: AuthState;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || window.location.origin;

function mapAuthError(message?: string | null): string {
  const msg = (message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Email ou senha inválidos.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Um usuário com este e-mail já existe.';
  }
  if (msg.includes('password should be at least') || msg.includes('password is too weak')) {
    return 'Senha fraca: verifique a política de senha.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  }
  return 'Ocorreu um erro. Tente novamente.';
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchBackendUser = useCallback(async (): Promise<boolean> => {
    try {
      const me = await authService.getMe();
      setUser(me);
      setState('authed');
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await supabase.auth.signOut();
        setUser(null);
        setToken(null);
        setState('guest');
        navigate('/login', { replace: true });
      } else {
        // Fallback: usa dados básicos do Supabase quando o backend não responde
        try {
          const { data: { user: sUser } } = await supabase.auth.getUser();
          if (sUser && sUser.email) {
            const meta: any = sUser.user_metadata || {};
            const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
            const r = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
            setUser({
              id: sUser.id,
              email: sUser.email,
              name: meta.name || sUser.email.split('@')[0],
              role: r as any,
            });
            setState('authed');
            setError('Perfil básico carregado; alguns dados podem estar indisponíveis.');
            return true;
          }
        } catch (_) {
          /* ignore */
        }
        setError('Não foi possível carregar seu perfil.');
        setState('guest');
      }
      return false;
    }
  }, [navigate]);

  // Inicializa sessão do Supabase
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        await fetchBackendUser();
      } else {
        setState('guest');
      }
    })();

    // Listener para mudanças na sessão (login/logout/refresh/password recovery)
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setToken(session?.access_token ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setError(null);
        await fetchBackendUser();
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setState('guest');
        navigate('/login', { replace: true });
      }

      if (event === 'PASSWORD_RECOVERY') {
        // Link de recuperação chegou, redireciona para a página de mudança de senha
        navigate('/update-password', { replace: true });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchBackendUser, navigate]);

  const login = async (email: string, password: string) => {
    setState('loading');
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // opcionalmente garante existência no backend
      try {
        const { data: { user: sUser } } = await supabase.auth.getUser();
        if (sUser?.email) {
          const meta: any = sUser.user_metadata || {};
          const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
          const r = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
          await ensureUser({
            authId: sUser.id,
            ownerId: meta.sub || sUser.id,
            email: sUser.email,
            name: meta.name || sUser.email.split('@')[0],
            role: r as any,
          });
        }
      } catch (_) { /* ignore ensure errors */ }

      const ok = await fetchBackendUser();
      if (ok) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login failed', err);
      setError(mapAuthError(err?.message));
      setState('guest');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setState('loading');
    setError(null);
    try {
      // Cadastro é no Supabase; backend só consome o access_token depois
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, requested_role: role, role },
          emailRedirectTo: SITE_URL,
        },
      });
      if (error) throw error;

      const confirmationSent = !data.session; // se null, confirmação de email ativa

      if (!confirmationSent) {
        // Usuário já autenticado; define user provisório e redireciona
        const sUser = data.user;
        const meta: any = sUser?.user_metadata || {};
        try {
          if (sUser?.email) {
            const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
            const r = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
            await ensureUser({ authId: sUser.id, ownerId: meta.sub || sUser.id, email: sUser.email, name: meta.name || (sUser.email.split('@')[0]), role: r as any });
          }
        } catch (_) { /* ignore */ }
        const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
        const r = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
        if (sUser && sUser.email) {
          setUser({ id: sUser.id, name: meta.name || (sUser.email.split('@')[0]), email: sUser.email, role: r as any });
          setState('authed');
        }
        navigate('/dashboard', { replace: true });
        // onAuthStateChange fará fetchBackendUser e ajustará rota final
      } else {
        setState('guest');
      }
      return { confirmationSent };
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(mapAuthError(err?.message));
      setState('guest');
      throw err;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    setState('loading');
    setError(null);
    try {
      // Mesmo raciocínio do signup: não use '#/rota' aqui.
      // Após voltar para SITE_URL com o hash de tokens, o evento
      // 'PASSWORD_RECOVERY' do onAuthStateChange navega para '/update-password'.
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
      if (error) throw error;
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(mapAuthError(err?.message));
      throw err;
    } finally {
      setState('guest');
    }
  };

  // Evitar troca prematura para 'guest' enquanto buscamos /api/me após login
  // Removido o timeout que forçava 'guest' em 1.5s para não causar bounce do RouteGuard

  const updatePassword = async (password: string) => {
    setState('loading');
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (err: any) {
      console.error('Password update failed', err);
      setError(mapAuthError(err?.message));
      throw err;
    } finally {
      setState('authed');
    }
  };

  const logout = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut(); // limpa LocalStorage e dispara SIGNED_OUT
    setUser(null);
    setToken(null);
    setState('guest');
    navigate('/login', { replace: true });
  }, [navigate]);

  const value: AuthContextType = {
    token,
    user,
    login,
    register,
    logout,
    error,
    state,
    sendPasswordResetEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



