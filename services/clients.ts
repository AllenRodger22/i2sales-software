import { apiClient } from './apiClient';
import { Client, FollowUpState } from '../types';
import { parseCurrency } from '../utils/helpers';

// Front-only mode toggle: when using Supabase directly
const USE_SUPABASE = ((import.meta as any)?.env?.VITE_AUTH_DRIVER || '').toString().toLowerCase() === 'supabase';

type DbClient = import('../src/types').Client;
type DbInteraction = import('../src/types').Interaction;

async function loadSupabase() {
  const mod = await import('../src/auth/drivers/supabase');
  return mod;
}

const isMaster = () => {
  try { return (import.meta as any)?.env?.VITE_ENABLE_MASTER_LOGIN === '1' && window.localStorage.getItem('i2s-master') === '1'; } catch { return false; }
};

function mapDbToUi(c: DbClient): Client {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? undefined,
    source: c.source,
    status: c.status,
    observations: c.observations ?? undefined,
    product: c.product ?? undefined,
    propertyValue: c.property_value != null ? String(c.property_value) : undefined,
    followUpState: (c.follow_up_state as any as FollowUpState) ?? FollowUpState.NO_FOLLOW_UP,
    interactions: [],
  } as Client;
}

function mapUiPatchToDb(fields: Partial<Client>): Partial<DbClient> {
  const out: any = {};
  if (fields.name !== undefined) out.name = fields.name;
  if (fields.phone !== undefined) out.phone = fields.phone;
  if (fields.email !== undefined) out.email = fields.email;
  if (fields.source !== undefined) out.source = fields.source;
  if (fields.status !== undefined) out.status = fields.status as string;
  if (fields.observations !== undefined) out.observations = fields.observations ?? null;
  if (fields.product !== undefined) out.product = fields.product ?? null;
  if (fields.propertyValue !== undefined) out.property_value = parseCurrency(String(fields.propertyValue));
  if ((fields as any).followUpState !== undefined) out.follow_up_state = (fields as any).followUpState as any;
  return out as Partial<DbClient>;
}

export async function getAllClients(params: { q?: string; status?: string; }): Promise<Client[]> {
  if (USE_SUPABASE) {
    if (isMaster()) {
      const { default: MOCK } = await import('./mockApi');
      const mapped = (MOCK as unknown as DbClient[]).map(mapDbToUi);
      return mapped;
    }
    const { listClients } = await loadSupabase();
    const dbList = await listClients();
    const q = (params.q || '').trim().toLowerCase();
    const status = (params.status || '').trim();
    const filtered = dbList.filter((c) => {
      const matchesQ = !q || [c.name, c.phone, c.email, c.source]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      const matchesStatus = !status || c.status === status;
      return matchesQ && matchesStatus;
    });
    return filtered.map(mapDbToUi);
  }
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set('q', params.q);
  if (params.status) queryParams.set('status', params.status);
  const endpoint = `/clients?${queryParams.toString()}`;
  return apiClient.get<Client[]>(endpoint);
}

export const getClient = async (clientId: string): Promise<Client> => {
  if (USE_SUPABASE) {
    if (isMaster()) {
      const { default: MOCK } = await import('./mockApi');
      const found = (MOCK as any[]).find((m) => m.id === clientId) as unknown as DbClient | undefined;
      const mapped = found ? mapDbToUi(found) : (null as any);
      return mapped ?? Promise.reject(new Error('Cliente não encontrado'));
    }
    const { getClient: getDbClient, listInteractions } = await loadSupabase();
    const c = await getDbClient(clientId);
    const rows: DbInteraction[] = await listInteractions(clientId);
    const interactions = rows.map((i) => ({
      id: i.id,
      type: i.type as any,
      date: i.created_at || new Date().toISOString(),
      observation: i.observation || '',
      fromStatus: i.from_status as any,
      toStatus: i.to_status as any,
    }));
    const mapped = mapDbToUi(c);
    mapped.interactions = interactions;
    return mapped;
  }
  return apiClient.get<Client>(`/clients/${clientId}`);
};

export async function createClient(
  payload: Partial<Omit<Client, 'id' | 'interactions'>>,
  _currentUserId: string
): Promise<Client> {
  if (USE_SUPABASE) {
    const { createClient: createDbClient } = await loadSupabase();
    const property_value = parseCurrency(payload.propertyValue);
    const dbPayload: Partial<DbClient> = {
      name: payload.name!,
      phone: payload.phone!,
      email: payload.email ?? null,
      source: payload.source!,
      status: payload.status!,
      observations: payload.observations ?? null,
      product: payload.product ?? null,
      property_value,
      follow_up_state: (payload as any).followUpState ?? 'Sem Follow Up',
    };
    const created = await createDbClient(dbPayload);
    return mapDbToUi(created as DbClient);
  }
  const propertyValue = parseCurrency(payload.propertyValue);
  const clientData = { ...payload, propertyValue };
  return apiClient.post<Client>('/clients', clientData);
}

export async function updateClient(clientId: string, fields: Partial<Client>): Promise<Client> {
  if (USE_SUPABASE) {
    const { updateClient: updateDbClient } = await loadSupabase();
    const dbPatch = mapUiPatchToDb(fields);
    const updated = await updateDbClient(clientId, dbPatch);
    return mapDbToUi(updated as DbClient);
  }
  const payload = { ...fields } as any;
  if ('propertyValue' in payload) {
    const numericValue = parseCurrency(String(payload.propertyValue));
    const apiPayload = { ...payload, propertyValue: numericValue };
    return apiClient.put<Client>(`/clients/${clientId}`, apiPayload);
  }
  return apiClient.put<Client>(`/clients/${clientId}`, payload);
}

export async function deleteClient(clientId: string): Promise<void> {
  if (USE_SUPABASE) {
    // Implement if you decide to support deletions via Supabase (e.g., admin-only)
    // For now, throw to keep behavior explicit when front-only mode is active
    throw new Error('Delete via Supabase driver não implementado.');
  }
  return apiClient.delete<void>(`/clients/${clientId}`);
}

// ====== IMPORT / EXPORT ======

export const importClients = async (
  file: File,
  mapping: Record<string, string>,
  _currentUserId: string
) => {
  if (USE_SUPABASE) {
    throw new Error('Importação/exportação indisponível no modo Supabase-only.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  return apiClient.post<{ imported: number; skipped: number; }>('/clients/import', formData);
};

export const exportClients = async (): Promise<Blob> => {
  if (USE_SUPABASE) {
    throw new Error('Exportação indisponível no modo Supabase-only.');
  }
  return apiClient.get<Blob>('/clients/export');
};
