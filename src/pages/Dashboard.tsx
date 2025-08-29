import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../lib/supabaseClient';

type Profile = {
  id: string;
  [key: string]: any;
};

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      // Exemplo de leitura do usuário atual
      const { data: userData } = await supabase.auth.getUser();
      const currentId = userData.user?.id;
      // Exemplo de requisição autenticada com RLS
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentId);
      if (!mounted) return;
      if (error) {
        setError(error.message);
      } else {
        setProfiles((data as Profile[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-bg">
      <div className="center-wrap">
        <div className="card glass">
          <div className="header-row">
            <h1 className="title">Dashboard</h1>
            <button className="btn danger" onClick={handleLogout}>Sair</button>
          </div>
          <p className="muted">Você está autenticado como: <strong>{user?.email}</strong></p>

          <div className="section">
            <h2 className="subtitle">Exemplo de requisição autenticada (tabela profiles)</h2>
            {loading && <p>Carregando dados…</p>}
            {error && <div className="alert alert-error">{error}</div>}
            {!loading && !error && (
              <pre className="pre">
{JSON.stringify(profiles, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

