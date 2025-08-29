import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Role } from './types';
import { ApiError } from './services/apiClient';
import { supabase } from './src/lib/supabaseClient';
import * as authService from './services/auth'; // manter apenas para getMe()

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

  const fetchBackendUser = useCallback(async () => {
    try {
      const me = await authService.getMeFull();
      setUser(me.user);
      setState('authed');
      // Usa routing do backend quando disponível
      const rt = me?.routing?.target || '/app';
      const map: Record<string, string> = {
        '/admin': '/dashboard/admin',
        '/manager': '/dashboard/manager',
        '/app': '/dashboard/broker',
        '/onboarding': '/dashboard',
      };
      const target = map[rt] || '/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      console.warn('Falha ao carregar usuário do backend. Tentando fallback do Supabase...', err);
      // Tenta sempre o fallback via Supabase (mesmo em 401), para não travar navegação em dev
      try {
        const { data: { user: sUser } } = await supabase.auth.getUser();
        const meta: any = sUser?.user_metadata || {};
        const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
        const role = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
        if (sUser && sUser.email) {
          setUser({
            id: sUser.id,
            name: meta.name || (sUser.email.split('@')[0]),
            email: sUser.email,
            role: role as any,
          });
          setState('authed');
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (_) { /* ignore - handled below */ }

      // Se não conseguir fallback, trata 401 com signOut; outros erros liberam UI como guest
      if (err instanceof ApiError && err.status === 401) {
        await supabase.auth.signOut();
        setUser(null);
        setToken(null);
        setState('guest');
        navigate('/login', { replace: true });
      } else {
        setError('Não foi possível carregar seu perfil.');
        setState('guest');
      }
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
      // Navegação otimista após login; RouteGuard aguardará estado 'authed'.
      navigate('/dashboard', { replace: true });
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
      // 1) Registrar no backend: POST /api/v1/auth/register
      //    O apiClient já usa BASE_URL e não envia Authorization antes do login
      await authService.register({ name, email, password, role });

      // 2) Login no Supabase com as mesmas credenciais
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // 3) Recuperar token/sessão e consultar /api/me
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão não disponível após login.');
      }

      // 4) Buscar perfil do backend e redirecionar conforme routing.target/role
      await fetchBackendUser();

      // O listener onAuthStateChange também chamará fetchBackendUser; manter estado consistente
      setError(null);
      return { confirmationSent: false };
    } catch (err: any) {
      console.error('Registration flow failed', err);
      // Mapear 409 do backend explicitamente
      if (err?.status === 409 || (err?.message && String(err.message).toLowerCase().includes('already'))) {
        setError('Um usuário com este e-mail já existe.');
      } else {
        setError(mapAuthError(err?.message));
      }
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



