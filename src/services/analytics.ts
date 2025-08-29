import { api } from './api';

export const getBrokerKpis = () => api('/analytics/broker-kpis');

export interface ProductivityParams {
  startDate: string;
  endDate: string;
  brokerId?: string;
}

export const getProductivity = (params: ProductivityParams) => {
  const search = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate });
  if (params.brokerId) search.set('brokerId', params.brokerId);
  return api(`/analytics/productivity?${search.toString()}`);
};

export const getFunnel = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) search.set(k, v);
  }
  return api(`/analytics/funnel?${search.toString()}`);
};
