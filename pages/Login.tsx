import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  
  const { login, sendPasswordResetEmail, state, error: authError } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if user is already logged in
    if (state === 'authed') {
      navigate('/dashboard', { replace: true });
    }
  }, [state, navigate]);
  
  useEffect(() => {
      if (authError) {
          setLocalError(authError);
      }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    
    try {
      await login(email, password);
      // Garante navegação imediata após login
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // AuthProvider sets the error, which is picked up by the useEffect
      console.error(err);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
     if (!email) {
        setLocalError('Por favor, digite seu e-mail.');
        return;
    }
    try {
        await sendPasswordResetEmail(email);
        setSuccessMessage('Se uma conta existir para este e-mail, um link para redefinir a senha foi enviado.');
    } catch (err: any) {
        setLocalError(err.message || 'Falha ao enviar o e-mail de redefinição.');
    }
  };

  const isFormDisabled = state === 'loading' || !!successMessage;

  const renderLoginView = () => (
    <>
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
          Bem-vindo ao <span className="text-orange-500">i2Sales</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Faça login para continuar
        </p>
      </div>
      <form className="mt-8 space-y-4" onSubmit={handleLogin}>
        <input
          id="email-address" name="email" type="email" autoComplete="email" required
          className="input-glass"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <input
          id="password" name="password" type="password" autoComplete="current-password" required
          className="input-glass"
          placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-end text-sm">
          <button type="button" onClick={() => { setView('forgot_password'); setLocalError(null); setSuccessMessage(null); }} className="font-medium text-orange-400 hover:text-orange-300">
            Esqueceu a senha?
          </button>
        </div>
        <button type="submit" disabled={isFormDisabled} className="btn btn-primary w-full">
          {state === 'loading' ? 'Entrando...' : 'Entrar'}
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
          Digite seu email para receber o link de redefinição.
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
        <input
          id="email-address" name="email" type="email" autoComplete="email" required
          className="input-glass"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={isFormDisabled} className="btn btn-primary w-full">
          {state === 'loading' ? 'Enviando...' : 'Enviar Link de Redefinição'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Lembrou a senha?{' '}
        <button onClick={() => { setView('login'); setLocalError(null); setSuccessMessage(null); }} className="font-medium text-orange-400 hover:text-orange-300">
          Voltar para o Login
        </button>
      </p>
    </>
  );

  return (
    <div className="auth-forest flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 glass-strong">
        {view === 'login' ? renderLoginView() : renderForgotPasswordView()}
        {localError && <p className="mt-4 text-sm text-red-400 text-center">{localError}</p>}
        {successMessage && <p className="mt-4 text-sm text-green-400 text-center">{successMessage}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
