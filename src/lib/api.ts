const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api';

type AskResponse = {
  question?: string;
  answer?: string;
  response?: string;
  message?: string;
  [key: string]: unknown;
};

export interface ApiAuth {
  accessToken: string;
  userId: string;
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    if (typeof data.message === 'string') return data.message;
  } catch {
    // Ignore JSON parsing failures and fall back to the status text below.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

function authHeaders(auth: ApiAuth): HeadersInit {
  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export async function uploadDocument(file: File, auth: ApiAuth): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', auth.userId);

  const response = await fetch(`${API_BASE_URL}/documents/upload-document`, {
    method: 'POST',
    headers: authHeaders(auth),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function askDocument(
  question: string,
  auth: ApiAuth,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(auth),
      },
      body: JSON.stringify({ question, user_id: auth.userId }),
      signal,
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = (await response.json()) as AskResponse;
    const answer = data.answer ?? data.response ?? data.message;

    if (typeof answer === 'string' && answer.trim()) {
      return answer;
    }

    return JSON.stringify(data, null, 2);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(messageFromError(error));
  }
}
