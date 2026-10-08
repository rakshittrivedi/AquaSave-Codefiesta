export const TOKEN_KEY = 'aquasave_token';
export const USER_KEY = 'aquasave_user';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, user?: { username: string; role: string }): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save auth credentials:', err);
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth credentials:', err);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function getStoredUser(): { username: string; role: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}
