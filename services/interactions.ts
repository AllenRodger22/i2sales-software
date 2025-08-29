import { apiClient } from './apiClient';
import { Interaction } from '../types';

const USE_SUPABASE = ((import.meta as any)?.env?.VITE_AUTH_DRIVER || '').toString().toLowerCase() === 'supabase';

export async function createInteraction(
  params: { clientId: string; userId: string; type: string; observation?: string; explicitNext?: string | null; }
): Promise<any> {
  if (USE_SUPABASE) {
    const { getMe, addInteraction, updateClient } = await import('../src/auth/drivers/supabase');
    const me = await getMe();
    if (!me) throw new Error('Não autenticado');
    const payload = {
      client_id: params.clientId,
      user_id: me.id,
      type: params.type,
      observation: params.observation ?? null,
      from_status: null as string | null,
      to_status: params.explicitNext ?? null,
    } as any;
    const inserted = await addInteraction(payload);
    // When a next status is provided, also update the client record
    if (params.explicitNext) {
      await updateClient(params.clientId, { status: params.explicitNext } as any);
    }
    return inserted;
  }
  const { userId, ...payload } = params;
  return apiClient.post('/interactions', payload);
}

export async function listInteractionsByClient(clientId: string): Promise<Interaction[]> {
  console.warn('listInteractionsByClient is deprecated. Interactions are fetched with the client.');
  const client = await apiClient.get<{ interactions: Interaction[] }>(`/clients/${clientId}`);
  return client.interactions || [];
}
