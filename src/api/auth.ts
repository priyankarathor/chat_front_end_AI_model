const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  userId: string;
  email?: string;
}

export interface RegisterResponse {
  message?: string;
}

type AuthResponse = {
  access_token?: string;
  token?: string;
  token_type?: string;
  user_id?: string | number;
  id?: string | number;
  email?: string;
  user?: {
    id?: string | number;
    user_id?: string | number;
    email?: string;
  };
  message?: string;
  detail?: string | { msg?: string }[];
};

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as AuthResponse;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    if (typeof data.message === 'string') return data.message;
  } catch {
    // Fall back to response status below.
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

function normalizeAuthResponse(data: AuthResponse): AuthSession {
  const accessToken = data.access_token ?? data.token;
  const rawUserId = data.user_id ?? data.user?.user_id ?? data.user?.id ?? data.id;

  if (!accessToken) {
    throw new Error('Login succeeded, but the server did not return an access token.');
  }

  if (rawUserId === undefined || rawUserId === null || rawUserId === '') {
    throw new Error('Login succeeded, but the server did not return a user_id.');
  }

  return {
    accessToken,
    tokenType: data.token_type ?? 'bearer',
    userId: String(rawUserId),
    email: data.email ?? data.user?.email,
  };
}

async function postJson<T>(path: string, body: RegisterData | AuthCredentials): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

export function registerUser(data: RegisterData): Promise<RegisterResponse> {
  return postJson<RegisterResponse>('/auth/register', data);
}

export async function loginUser(data: AuthCredentials): Promise<AuthSession> {
  return normalizeAuthResponse(await postJson<AuthResponse>('/auth/login', data));
}
