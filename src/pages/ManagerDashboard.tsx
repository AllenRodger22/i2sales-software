import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import * as analyticsApi from '../services/analytics';

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await analyticsApi.getProductivity({ startDate: today, endDate: today });
        setKpis(res);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl mb-4">Manager Dashboard</h1>
      <p>Olá, {profile?.name}</p>
      <pre className="bg-black/20 p-2 rounded">{JSON.stringify(kpis, null, 2)}</pre>
    </div>
  );
};

export default ManagerDashboard;
