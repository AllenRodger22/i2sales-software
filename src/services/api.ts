import { supabase } from '../lib/supabaseClient';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:5000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    /* ignore */
  }
  if (!res.ok) {
    const message = data?.error || res.statusText;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}
