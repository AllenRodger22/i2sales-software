import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// Página de Login/Registro combinada com UI minimalista (glassmorphism)
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, error, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'BROKER') {
      navigate('/broker/dashboard', { replace: true });
    } else if (profile.role === 'MANAGER' || profile.role === 'ADMIN') {
      navigate('/manager/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const res = await signUp(email, password);
    setLoading(false);
    if (res.ok) {
      if (res.needsConfirmation) {
        setMessage('Enviamos um link de confirmação para seu email. Verifique sua caixa de entrada.');
      } else {
        setMessage('Conta criada com sucesso! Redirecionando…');
        setTimeout(() => navigate('/', { replace: true }), 800);
      }
    }
  }

  return (
    <div className="app-bg">
      <div className="center-wrap">
        <div className="card glass" role="region" aria-label="Acesso">
          <h1 className="title">Acessar i2Sales</h1>

          {(error || message) && (
            <div className={`alert ${error ? 'alert-error' : 'alert-info'}`} role="status">
              {error || message}
            </div>
          )}

          <form className="form" onSubmit={handleLogin}>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="label" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <div className="actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
              <button className="btn ghost" type="button" onClick={handleSignUp} disabled={loading}>
                {loading ? 'Criando…' : 'Criar conta'}
              </button>
            </div>
          </form>

          <p className="muted">
            Ao continuar, você concorda com as políticas da plataforma.
          </p>

          <div className="links">
            <Link to="/">Ir para Dashboard (protegida)</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

