import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import * as clientApi from '../services/clients';
import * as analyticsApi from '../services/analytics';
import type { Client } from '../../types';

const BrokerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [clientRes, kpiRes] = await Promise.all([
          clientApi.listClients(),
          analyticsApi.getBrokerKpis(),
        ]);
        setClients(clientRes);
        setKpis(kpiRes);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl mb-4">Broker Dashboard</h1>
      <p>Olá, {profile?.name}</p>
      <h2 className="mt-4 font-bold">KPIs</h2>
      <pre className="bg-black/20 p-2 rounded">{JSON.stringify(kpis, null, 2)}</pre>
      <h2 className="mt-4 font-bold">Clientes</h2>
      <pre className="bg-black/20 p-2 rounded">{JSON.stringify(clients, null, 2)}</pre>
    </div>
  );
};

export default BrokerDashboard;
