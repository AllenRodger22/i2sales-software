import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import KpiCard from '../../components/KpiCard';
import ClientTable from '../../components/ClientTable';
import AddClientModal from '../../components/AddClientModal';
import Funnel from '../../components/Funnel';
import { useAuth } from '../auth/useAuth';
import { Client, ClientStatus, Role, FunnelAnalyticsData } from '../../types';
import { getBrokerKpis, getFunnelAnalyticsData } from '../../services/analytics';
import { getAllClients, createClient, updateClient, deleteClient } from '../../services/clients';

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const todayStr = today.toISOString().slice(0, 10);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [kpis, setKpis] = useState({
    leadsEmTratativa: 0,
    leadsPrimeiroAtendimento: 0,
    totalLeads: 0,
    followUpAtrasado: 0,
  });
  const [funnel, setFunnel] = useState<FunnelAnalyticsData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchClients();
  }, []);

  async function fetchAnalytics() {
    try {
      const k = await getBrokerKpis(user?.id ?? '');
      setKpis(k);
      const f = await getFunnelAnalyticsData({
        startDate: startOfMonth,
        endDate: todayStr,
        role: Role.BROKER,
        currentUserId: user?.id ?? '',
      });
      setFunnel(f);
    } catch (err) {
      console.error('Falha ao carregar analytics', err);
    }
  }

  async function fetchClients() {
    setLoadingClients(true);
    try {
      const list = await getAllClients({});
      setClients(list);
    } catch (err) {
      console.error('Falha ao carregar clientes', err);
    } finally {
      setLoadingClients(false);
    }
  }

  type ClientFormData = Omit<Client, 'id' | 'status' | 'interactions' | 'followUpState'>;

  async function handleAddClient(data: ClientFormData) {
    try {
      const created = await createClient(data, user?.id ?? '');
      setClients((prev) => [created, ...prev]);
      fetchAnalytics();
    } catch (err) {
      alert('Erro ao criar cliente');
      console.error(err);
    }
  }

  async function handleUpdateClient(id: string, data: Partial<Client>) {
    try {
      const updated = await updateClient(id, data);
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      alert('Erro ao atualizar cliente');
      console.error(err);
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      fetchAnalytics();
    } catch (err) {
      alert('Erro ao excluir cliente');
      console.error(err);
    }
  }

  async function handleStatusChange(id: string, _from: ClientStatus, to: ClientStatus) {
    try {
      const updated = await updateClient(id, { status: to });
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      fetchAnalytics();
    } catch (err) {
      alert('Erro ao mudar status');
      console.error(err);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Leads em Tratativa" value={kpis.leadsEmTratativa} color="text-orange-400" />
          <KpiCard title="Primeiro Atendimento" value={kpis.leadsPrimeiroAtendimento} color="text-cyan-400" />
          <KpiCard title="Total de Leads" value={kpis.totalLeads} color="text-green-400" />
          <KpiCard title="Follow-up Atrasado" value={kpis.followUpAtrasado} color="text-red-400" />
        </div>

        {funnel && (
          <div className="glass p-6 rounded-2xl">
            <Funnel data={funnel} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Clientes</h2>
          <button className="btn primary" onClick={() => setModalOpen(true)}>
            Novo Cliente
          </button>
        </div>

        <ClientTable
          clients={clients}
          loading={loadingClients}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onStatusChange={handleStatusChange}
        />
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          await handleAddClient(data);
          setModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;

