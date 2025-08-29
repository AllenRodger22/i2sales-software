import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, state, error: authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

    try {
      setSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-forest flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 glass-strong">
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
            <Link to="/forgot-password" className="font-medium text-orange-400 hover:text-orange-300">
              Esqueceu a senha?
            </Link>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {localError && <p className="mt-4 text-sm text-red-400 text-center">{localError}</p>}
        <p className="mt-6 text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-medium text-orange-400 hover:text-orange-300">
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
