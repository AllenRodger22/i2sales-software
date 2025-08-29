import { apiClient, ApiError } from './api';
import { Role, User } from '../types';

type EnsureUserPayload = {
  authId: string; // Supabase auth user id (sub)
  ownerId?: string; // mirror do sub para backends que esperam ownerId
  email: string;
  name?: string;
  role?: Role;
};

// Endpoints can vary between deployments; allow overrides via env.
const ENSURE_USER_PATH: string = ((import.meta as any)?.env?.VITE_ENSURE_USER_PATH as string) || '/users/ensure';
const CREATE_USER_PATH: string = ((import.meta as any)?.env?.VITE_USERS_CREATE_PATH as string) || '/users';

/**
 * Ensure a backend User exists for the authenticated Supabase user.
 * Tries ENSURE endpoint first; falls back to CREATE when ENSURE is unavailable.
 */
export async function ensureUser(payload: EnsureUserPayload): Promise<User> {
  const body = {
    ...payload,
    auth_id: payload.authId, // for backends expecting snake_case
    owner_id: payload.ownerId || payload.authId,
  } as any;
  // Prefer an idempotent ensure endpoint when available
  try {
    const data = await apiClient.post<{ user: User }>(ENSURE_USER_PATH, body);
    if (data && (data as any).user) return (data as any).user as User;
    // Some backends may return the user directly
    return (data as any) as User;
  } catch (err) {
    // If ensure endpoint is not found or not implemented, try plain create
    if (err instanceof ApiError && (err.status === 404 || err.status === 405 || err.status === 501)) {
      const created = await apiClient.post<User>(CREATE_USER_PATH, body);
      return created as unknown as User;
    }
    throw err;
  }
}
