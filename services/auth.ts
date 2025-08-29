import { apiClient } from './api';
import { Role, User } from '../types';

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

export const getMe = async (): Promise<User> => {
    const data = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
};

// Opcional: se o backend tiver um endpoint de logout para invalidar o token
// export const logout = () => {
//     return apiClient.post('/auth/logout', {});
// };
