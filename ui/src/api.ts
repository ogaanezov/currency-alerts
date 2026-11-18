// Типы и запросы к REST API бэкенда.

export type Direction = 'ABOVE' | 'BELOW';

export interface Rule {
  id: number;
  base: string;
  quote: string;
  direction: Direction;
  threshold: number;
  triggered: boolean;
}

export interface NewRule {
  base: string;
  quote: string;
  direction: Direction;
  threshold: number;
}

export interface Rate {
  base: string;
  quote: string;
  rate: number;
  time: string;
}

export interface AppNotification {
  id: number;
  ruleId: number;
  base: string;
  quote: string;
  direction: Direction;
  threshold: number;
  rate: number;
  createdAt: string;
}

const OWNER_TOKEN_KEY = 'currency-alerts-owner-token';

// Ключ владельца хранится только в этом браузере и отправляется в заголовке X-Admin-Token.
export const ownerToken = {
  get(): string | null {
    try {
      return localStorage.getItem(OWNER_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null): void {
    try {
      if (token) localStorage.setItem(OWNER_TOKEN_KEY, token);
      else localStorage.removeItem(OWNER_TOKEN_KEY);
    } catch {
      // хранилище недоступно — ключ не запомнится
    }
  },
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = ownerToken.get();
  if (token) headers.set('X-Admin-Token', token);
  const response = await fetch(url, { ...init, headers });
  if (response.status === 403) {
    throw new Error('Менять правила может только владелец сайта.');
  }
  if (!response.ok) {
    // Бэкенд при ошибке 400 присылает ProblemDetail с текстом в поле detail.
    let message = `Ошибка ${response.status}`;
    try {
      const problem = await response.json();
      if (problem.detail) message = problem.detail;
    } catch {
      // тело не JSON — оставляем код ответа
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  rateTime: string;
}

export const api = {
  access: () => request<{ canEdit: boolean }>('/api/access'),
  rules: () => request<Rule[]>('/api/rules'),
  createRule: (rule: NewRule) =>
    request<Rule>('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    }),
  deleteRule: (id: number) => request<void>(`/api/rules/${id}`, { method: 'DELETE' }),
  rates: (base: string, quote: string, limit = 48) =>
    request<Rate[]>(`/api/rates/${base}/${quote}?limit=${limit}`),
  notifications: () => request<AppNotification[]>('/api/notifications'),
  convert: (from: string, to: string, amount: number) =>
    request<ConversionResult>(`/api/convert?from=${from}&to=${to}&amount=${amount}`),
};
