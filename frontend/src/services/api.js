// frontend/src/services/api.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'imagegen_token';

// ─── Token Storage ────────────────────────────────────────────────────────────
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
};

// ─── Core Fetch ───────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = tokenStorage.get();
  const headers = { ...(options.headers || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    /** Verify the 6-digit OTP entered by the user */
    verifyOTP: (body) =>
      request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),

    /** Request a fresh OTP (after expiry or too many wrong attempts) */
    resendOTP: (body) =>
      request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),

    /** Send a password-reset OTP to the given email */
    forgotPassword: (email) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

    /** Verify the reset OTP and set a new password */
    resetPassword: ({ email, otp, newPassword }) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      }),

    getMe: () => request('/auth/me'),

    adminLogin: (body) =>
      request('/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  },

  generate: {
    text: (body) =>
      request('/generate/text', { method: 'POST', body: JSON.stringify(body) }),

    image: (formData) =>
      request('/generate/image', { method: 'POST', body: formData }),

    inpaint: ({ image, mask, prompt, negativePrompt = '', ratio = '1:1' }) => {
      const form = new FormData();
      form.append('image',          image);
      form.append('mask',           mask);
      form.append('prompt',         prompt);
      form.append('negativePrompt', negativePrompt);
      form.append('ratio',          ratio);
      return request('/generate/inpaint', { method: 'POST', body: form });
    },

    /** Image Enhancement — always routed through NVIDIA ESRGAN on the backend */
    enhance: (imageFile, scaleFactor = 4) => {
      const form = new FormData();
      form.append('image',       imageFile);
      form.append('scaleFactor', String(scaleFactor));
      return request('/generate/enhance', { method: 'POST', body: form });
    },

    get: (id) => request(`/generate/${id}`),
  },

  gallery: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/gallery${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/gallery/${id}`),
    delete: (id) => request(`/gallery/${id}`, { method: 'DELETE' }),
  },

  credits: {
    get: () => request('/credits'),
    plans: () => request('/credits/plans'),
    purchase: (body) =>
      request('/credits/purchase', { method: 'POST', body: JSON.stringify(body) }),
  },

  upload: {
    image: (formData) =>
      request('/upload/image', { method: 'POST', body: formData }),
  },

  health: {
    get: () => request('/health'),
  },
};

export default api;