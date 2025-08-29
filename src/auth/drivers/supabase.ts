import { supabase } from "../../lib/supabaseClient";
import type { Client as DbClient, DbUser, Interaction as DbInteraction } from "../../types";

// Fetch current public.users row from auth.uid -> users.auth_uid
export async function getMe(): Promise<DbUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_uid", user.id)
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

async function getCurrentDbUserId(): Promise<string | null> {
  const me = await getMe();
  return me?.id ?? null;
}

export async function listClients(): Promise<DbClient[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({ ...c, timeline: [] })) as DbClient[];
}

export async function getClient(id: string): Promise<DbClient> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { ...(data as any), timeline: [] } as DbClient;
}

export async function listInteractions(clientId: string): Promise<DbInteraction[]> {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DbInteraction[];
}

export async function addInteraction(i: Omit<DbInteraction, 'id'|'created_at'|'updated_at'>) {
  const { data, error } = await supabase
    .from("interactions")
    .insert(i as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbInteraction;
}

export async function updateClient(id: string, patch: Partial<DbClient>) {
  const { data, error } = await supabase
    .from("clients")
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbClient;
}

export async function createClient(payload: Partial<DbClient>) {
  const ownerId = await getCurrentDbUserId();
  const toInsert = { ...payload, owner_id: payload.owner_id ?? ownerId };
  const { data, error } = await supabase
    .from("clients")
    .insert(toInsert as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbClient;
}

