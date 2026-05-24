/**
 * src/services/api.js
 * 
 * Centralised API client for the ImageGen frontend.
 * Set VITE_API_URL in your .env:
 *   VITE_API_URL=http://localhost:5000/api/v1
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/* ── Token storage ────────────────────────────────────────────────────────── */
const TOKEN_KEY = 'imagegen_token';

export const tokenStorage = {
  get:    ()      => localStorage.getItem(TOKEN_KEY),
  set:    (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: ()      => localStorage.removeItem(TOKEN_KEY),
};

/* ── Base fetch wrapper ───────────────────────────────────────────────────── */
async function request(endpoint, options = {}) {
  const token = tokenStorage.get();

  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

/* ── Auth ─────────────────────────────────────────────────────────────────── */
const auth = {
  async register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      body:   { name, email, password },
    });
    if (data.token) tokenStorage.set(data.token);
    return data;
  },

  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body:   { email, password },
    });
    if (data.token) tokenStorage.set(data.token);
    return data;
  },

  logout() { tokenStorage.remove(); },
  getMe()           { return request('/auth/me'); },
  updateMe(updates) { return request('/auth/me', { method: 'PUT', body: updates }); },
};

/* ── Generate ─────────────────────────────────────────────────────────────── */
const generate = {
  text({ prompt, negativePrompt, ratio = '1:1', style = 'Photorealistic' }) {
    return request('/generate/text', {
      method: 'POST',
      body:   { prompt, negativePrompt, ratio, style },
    });
  },

  image({ file, prompt, negativePrompt, ratio = '1:1', style = 'Photorealistic' }) {
    const form = new FormData();
    form.append('image', file);
    if (prompt)         form.append('prompt', prompt);
    if (negativePrompt) form.append('negativePrompt', negativePrompt);
    form.append('ratio', ratio);
    form.append('style', style);
    return request('/generate/image', { method: 'POST', body: form });
  },

  getById(id) { return request(`/generate/${id}`); },
};

/* ── Gallery ──────────────────────────────────────────────────────────────── */
const gallery = {
  list({ page = 1, limit = 20, type } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (type) params.set('type', type);
    return request(`/gallery?${params}`);
  },
  getById(id) { return request(`/gallery/${id}`); },
  delete(id)  { return request(`/gallery/${id}`, { method: 'DELETE' }); },
};

/* ── Credits ──────────────────────────────────────────────────────────────── */
const credits = {
  get()          { return request('/credits'); },
  plans()        { return request('/credits/plans'); },
  purchase(plan) { return request('/credits/purchase', { method: 'POST', body: { plan } }); },
};

/* ── Upload ───────────────────────────────────────────────────────────────── */
const upload = {
  image(file) {
    const form = new FormData();
    form.append('image', file);
    return request('/upload/image', { method: 'POST', body: form });
  },
};

/* ── Health ───────────────────────────────────────────────────────────────── */
const health = {
  check() { return request('/health'); },
};

const api = { auth, generate, gallery, credits, upload, health };
export default api;