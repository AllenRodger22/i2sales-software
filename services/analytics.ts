import { apiClient } from './apiClient';
import { ProductivityData, FunnelAnalyticsData, Role } from '../types';

export async function getBrokerKpis(_currentUserId: string): Promise<{ // userId is now inferred from token
  leadsEmTratativa: number;
  leadsPrimeiroAtendimento: number;
  totalLeads: number;
  followUpAtrasado: number;
}> {
  return apiClient.get('/analytics/broker-kpis');
}

export async function getProductivityData(params: {
  startDate: string;
  endDate: string;
  role: Role;
  brokerId?: string;
  currentUserId: string;
}): Promise<ProductivityData> {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.brokerId) {
    queryParams.set('brokerId', params.brokerId);
  }

  // Raw backend shape (current): { series: [{ date: 'YYYY-MM-DD', count: number }] }
  const raw = await apiClient.get<any>(`/analytics/productivity?${queryParams.toString()}`);

  const daily = Array.isArray(raw?.series)
    ? raw.series.map((p: any) => ({
        date: String(p.date || ''),
        ligacoes: Number(p.count || 0),
        ce: 0,
        tratativas: 0,
        documentacao: 0,
        vendas: 0,
      }))
    : [];

  const sum = (key: keyof (typeof daily)[number]) => daily.reduce((acc, d) => acc + Number(d[key] || 0), 0);

  const kpis = {
    ligacoes: sum('ligacoes'),
    ce: sum('ce'),
    tratativas: sum('tratativas'),
    documentacao: sum('documentacao'),
    vendas: sum('vendas'),
  };

  const managerKpis = {
    vgv: 0,
    oportunidade: 0,
    ligacoes: kpis.ligacoes,
    vendas: kpis.vendas,
  };

  const data: ProductivityData = {
    kpis,
    managerKpis,
    timeseries: { daily },
    breakdown: {
      porOrigem: [],
      porBroker: [],
    },
    brokers: [],
  };

  return data;
}

export async function getFunnelAnalyticsData(params: {
  startDate: string;
  endDate: string;
  role: Role;
  brokerId?: string;
  currentUserId: string;
}): Promise<FunnelAnalyticsData> {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.brokerId) {
    queryParams.set('brokerId', params.brokerId);
  }
  // Raw backend shape: { stages: { 'Primeiro Atendimento': n, 'Em Tratativa': n, 'Proposta': n, 'Fechado': n } }
  const raw = await apiClient.get<any>(`/analytics/funnel?${queryParams.toString()}`);
  const stages = raw?.stages || {};
  const funnel = Object.keys(stages).map((stage) => ({ stage, count: Number(stages[stage] || 0) }));

  // Simple conversion rates: next/current, and overall to 'Fechado'
  const conversionRates: Record<string, number> = {};
  for (let i = 0; i < funnel.length - 1; i++) {
    const cur = funnel[i];
    const next = funnel[i + 1];
    conversionRates[`${cur.stage}->${next.stage}`] = cur.count > 0 ? Math.round((next.count / cur.count) * 100) : 0;
  }
  const closed = funnel.find((f) => f.stage.toLowerCase().includes('fechado'))?.count ?? 0;
  const first = funnel[0]?.count ?? 0;
  if (first > 0) conversionRates['fechamento'] = Math.round((closed / first) * 100);

  return { funnel, conversionRates };
}
