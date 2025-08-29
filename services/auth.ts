import { apiClient, ApiError } from './apiClient';
import { Role, User } from '../types';
import { supabase } from '../src/lib/supabaseClient';
import { ensureUser } from './users';

// Allow overriding the registration path via env in case the backend uses a different route
const REGISTER_PATH = ((import.meta as any)?.env?.VITE_REGISTER_PATH as string) || '/auth/register';

interface LoginResponse {
  token: string;
  user: User;
}

export const login = (email: string, password: string) => {
  return apiClient.post<LoginResponse>('/auth/login', { email, password });
};

export const register = (
  { name, email, password, role }: { name: string; email: string; password: string; role: Role }
) => {
  return apiClient.post<{ confirmationSent: boolean }>(REGISTER_PATH, { name, email, password, role });
};

export const sendPasswordResetEmail = (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
};

export const updatePassword = (password: string) => {
    return apiClient.put('/auth/update-password', { password });
};

// Unified me endpoint via JWKS-based auth
export const getMe = async (): Promise<User> => {
  const data = await apiClient.get<{ user: User; profile?: any; routing?: any }>('/api/me');
  return data.user;
};

export const getMeFull = async () => {
  try {
    return await apiClient.get<{ user: User; profile?: any; routing?: any }>('/api/me');
  } catch (err) {
    // On 401, do not attempt ensure; propagate to caller
    if (err instanceof ApiError && err.status === 401) {
      throw err;
    }
    // Try to ensure/create the user in backend if missing, then retry once
    try {
      const { data: { user: sUser } } = await supabase.auth.getUser();
      const meta: any = sUser?.user_metadata || {};
      const roleMeta = (meta.role || meta.requested_role || 'BROKER').toString().toUpperCase();
      const role = (roleMeta === 'ADMIN' || roleMeta === 'MANAGER' || roleMeta === 'BROKER') ? roleMeta : 'BROKER';
      const name = (meta.name || (sUser?.email ? sUser.email.split('@')[0] : '') || '').toString();
      if (sUser && sUser.email) {
        await ensureUser({ authId: sUser.id, email: sUser.email, name, role: role as Role });
        // retry /api/me once after ensuring
        return await apiClient.get<{ user: User; profile?: any; routing?: any }>('/api/me');
      }
    } catch (_) {
      // ignore and rethrow original error
    }
    throw err;
  }
};

// Opcional: se o backend tiver um endpoint de logout para invalidar o token
// export const logout = () => {
//     return apiClient.post('/auth/logout', {});
// };
