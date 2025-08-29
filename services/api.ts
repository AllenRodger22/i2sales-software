// Base URL da API
// Preferir VITE_API_URL; fallback para VITE_API_BASE_URL; por fim Render
const BASE_URL: string =
  ((import.meta as any)?.env?.VITE_API_URL as string) ||
  ((import.meta as any)?.env?.VITE_API_BASE_URL as string) ||
  'https://i2sales-be-test.onrender.com/api/v1';

// Obter token do Supabase a cada requisição (sempre fresco)
// Não usamos mais token manual em localStorage.
import { supabase } from '../src/lib/supabaseClient';
const getToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public data: any) {
    super(message);
    this.name = 'ApiError';
  }
}

function resolveUrl(endpoint: string): string {
  // If caller passes absolute URL, respect it
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  // If caller targets unified API root (/api/*), do not prefix BASE_URL
  if (endpoint.startsWith('/api/')) return endpoint;
  // Default: prefix with BASE_URL (/api/v1)
  return `${BASE_URL}${endpoint}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const config: RequestInit = {
    ...options,
    headers,
  };

  const url = resolveUrl(endpoint);
  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Ocorreu um erro inesperado na comunicação com o servidor.' };
    }
    throw new ApiError(errorData.error || response.statusText, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/pdf') || contentType.includes('blob'))) {
    return response.blob() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, { ...options, method: 'POST', body: isFormData ? body : JSON.stringify(body) });
  },
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
