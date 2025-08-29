import { api } from './api';
import type { Client } from '../../types';
import { parseCurrency } from '../../utils/helpers';

export async function listClients(q?: string): Promise<Client[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  return api<Client[]>(`/clients${params}`);
}

export const getClient = (id: string): Promise<Client> => {
  return api<Client>(`/clients/${id}`);
};

export interface ClientPayload {
  name: string;
  phone: string;
  source: string;
  status?: string;
  followUpState?: string;
  email?: string;
  observations?: string;
  product?: string;
  propertyValue?: string | number | null;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const propertyValue = parseCurrency(payload.propertyValue ?? undefined);
  return api<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify({ ...payload, propertyValue }),
  });
}

export async function updateClient(id: string, payload: Partial<ClientPayload>): Promise<Client> {
  const body: any = { ...payload };
  if (payload.propertyValue !== undefined) {
    body.propertyValue = parseCurrency(payload.propertyValue);
  }
  return api<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export const deleteClient = (id: string): Promise<void> => {
  return api<void>(`/clients/${id}`, { method: 'DELETE' });
};
