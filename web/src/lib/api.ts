const API_BASE = '/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('workhub_token');
};

export const setAuthToken = (token: string, refreshToken?: string) => {
  localStorage.setItem('workhub_token', token);
  if (refreshToken) {
    localStorage.setItem('workhub_refresh_token', refreshToken);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('workhub_token');
  localStorage.removeItem('workhub_refresh_token');
  localStorage.removeItem('workhub_user');
};

export const getSavedUser = () => {
  const user = localStorage.getItem('workhub_user');
  return user ? JSON.parse(user) : null;
};

export const setSavedUser = (user: any) => {
  localStorage.setItem('workhub_user', JSON.stringify(user));
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.idempotencyKey) {
    headers.set('Idempotency-Key', options.idempotencyKey);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.error?.message || 'API request failed';
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.code = json.error?.code;
    error.details = json.error?.details;
    throw error;
  }

  return json.data;
}

export const api = {
  auth: {
    login: (body: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  },
  members: {
    getMe: () => apiRequest('/members/me'),
    updateDevice: (token: string) => apiRequest('/members/me/device', { method: 'PATCH', body: JSON.stringify({ token }) }),
  },
  spaces: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/spaces${q ? '?' + q : ''}`);
    },
    getAvailability: (location: string, date: string) =>
      apiRequest(`/spaces/availability?location=${encodeURIComponent(location)}&date=${date}`),
    create: (body: any) => apiRequest('/spaces', { method: 'POST', body: JSON.stringify(body) }),
  },
  bookings: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/bookings${q ? '?' + q : ''}`);
    },
    create: (body: any, idempotencyKey?: string) =>
      apiRequest('/bookings', { method: 'POST', body: JSON.stringify(body), idempotencyKey }),
    cancel: (id: string) => apiRequest(`/bookings/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string, notes?: string) =>
      apiRequest(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  },
  guests: {
    invite: (body: any) => apiRequest('/guests', { method: 'POST', body: JSON.stringify(body) }),
    getPublicPass: (token: string) => apiRequest(`/guests/pass/${token}`),
  },
  qr: {
    checkIn: (bookingId: string, token: string) =>
      apiRequest(`/qr/check-in/${bookingId}?token=${encodeURIComponent(token)}`),
  },
  reports: {
    getHeatmap: (location?: string) =>
      apiRequest(`/reports/heatmap${location ? '?location=' + encodeURIComponent(location) : ''}`),
    getUtilization: (params?: any) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/reports/utilization${q ? '?' + q : ''}`);
    },
    getRevenue: (params?: any) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/reports/revenue${q ? '?' + q : ''}`);
    },
  },
};
