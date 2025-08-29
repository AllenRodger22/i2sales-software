import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [view, setView] = useState<'login' | 'forgot_password'>('login');

  const { login, sendPasswordResetEmail, state, error: authError } = useAuth();
  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // já logado? redireciona
  useEffect(() => {
    if (state === 'authed') {
      navigate('/dashboard', { replace: true });
    }
  }, [state, navigate]);

  // listener de erro vindo do contexto
  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  // foco inteligente no campo certo ao trocar de view
  useEffect(() => {
    const t = setTimeout(() => {
      if (view === 'login') {
        (emailRef.current ?? undefined)?.focus?.();
      } else {
        (emailRef.current ?? undefined)?.focus?.();
      }
    }, 50);
    return () => clearTimeout(t);
  }, [view]);

  const isGlobalLoading = state === 'loading';
  const isFormDisabled = useMemo(
    () => submitting || isGlobalLoading || !!successMessage,
    [submitting, isGlobalLoading, successMessage]
  );

  const sanitizedEmail = useMemo(() => (email || '').trim().toLowerCase(), [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!sanitizedEmail || !password) {
      setLocalError('Email e senha são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      await login(sanitizedEmail, password); // autentica e atualiza contexto
      navigate('/dashboard', { replace: true }); // role redirect no app
    } catch (err: any) {
      // o hook já popula authError; ainda assim mostramos fallback local
      setLocalError(err?.message || 'Falha no login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!sanitizedEmail) {
      setLocalError('Por favor, digite seu e-mail.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(sanitizedEmail);
      setSuccessMessage(
        'Se uma conta existir para este e-mail, um link para redefinir a senha foi enviado.'
      );
    } catch (err: any) {
      setLocalError(err?.message || 'Falha ao enviar o e-mail de redefinição.');
    } finally {
      setSubmitting(false);
    }
  };

  // submit com Enter no input de senha
  const onKeyDownPassword: React.KeyboardEventHandler<HTMLInputElement> = (ev) => {
    if (ev.key === 'Enter' && view === 'login' && !isFormDisabled) {
      // força submit do form de login
      const form = (ev.currentTarget as HTMLInputElement).form;
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const renderLoginView = () => (
    <>
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
          Bem-vindo ao <span className="text-orange-500">i2Sales</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">Faça login para continuar</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleLogin} noValidate>
        <input
          ref={emailRef}
          id="email-address"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input-glass"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isFormDisabled}
        />

        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="input-glass pr-12"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDownPassword}
            disabled={isFormDisabled}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-white px-2 py-1 rounded-md bg-white/10"
            tabIndex={-1}
            aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPass ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <div className="flex items-center justify-end text-sm">
          <button
            type="button"
            onClick={() => {
              setView('forgot_password');
              setLocalError(null);
              setSuccessMessage(null);
            }}
            className="font-medium text-orange-400 hover:text-orange-300"
            disabled={isFormDisabled}
          >
            Esqueceu a senha?
          </button>
        </div>

        <button type="submit" disabled={isFormDisabled} className="btn btn-primary w-full">
          {submitting || isGlobalLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Não tem uma conta?{' '}
        <Link to="/register" className="font-medium text-orange-400 hover:text-orange-300">
          Registre-se
        </Link>
      </p>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
          Redefinir Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Digite seu e-mail para receber o link de redefinição.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handlePasswordReset} noValidate>
        <input
          ref={emailRef}
          id="reset-email-address"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input-glass"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isFormDisabled}
        />

        <button type="submit" disabled={isFormDisabled} className="btn btn-primary w-full">
          {submitting || isGlobalLoading ? 'Enviando...' : 'Enviar link de redefinição'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Lembrou a senha?{' '}
        <button
          onClick={() => {
            setView('login');
            setLocalError(null);
            setSuccessMessage(null);
          }}
          className="font-medium text-orange-400 hover:text-orange-300"
          disabled={isFormDisabled}
        >
          Voltar para o Login
        </button>
      </p>
    </>
  );

  return (
    <div className="auth-forest flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 glass-strong">
        {view === 'login' ? renderLoginView() : renderForgotPasswordView()}

        {localError && (
          <p className="mt-4 text-sm text-red-400 text-center" role="alert">
            {localError}
          </p>
        )}
        {successMessage && (
          <p className="mt-4 text-sm text-green-400 text-center" role="status">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
