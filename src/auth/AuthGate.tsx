import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Componente de rota protegida simples.
// - Se loading: mostra um fallback.
// - Se não autenticado: redireciona para /login.
// - Se autenticado: renderiza children normalmente.
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="center-wrap">
        <div className="card glass">
          <p>Carregando…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AuthGate;

