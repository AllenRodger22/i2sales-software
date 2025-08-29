// Types aligned to the Supabase-backed DDL

export type Role = 'BROKER' | 'MANAGER' | 'ADMIN';

export type DbUser = {
  id: string;
  auth_uid?: string | null;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  status: string;
  owner_id?: string | null; // FK -> users.id
  observations?: string | null;
  created_at?: string;
  updated_at?: string;
  product?: string | null;
  property_value?: number | null;
  follow_up_state?: 'Ativo'|'Concluido'|'Cancelado'|'Atrasado'|'Sem Follow Up';
  // UI-only helper (not persisted)
  timeline: { ts: string; text: string }[];
};

export type Interaction = {
  id: string;
  client_id: string;
  user_id: string;
  type: string;
  observation?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  created_at?: string;
  updated_at?: string;
};

