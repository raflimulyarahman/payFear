/**
 * PayFear API Client
 * 
 * Central fetch wrapper for all API calls.
 * Handles auth tokens, error parsing, and response normalization.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

class ApiError extends Error {
  constructor(code, message, statusCode, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// In-memory token (also synced to localStorage)
let token = null;

export function setToken(newToken) {
  token = newToken;
  if (typeof window !== 'undefined') {
    if (newToken) {
      localStorage.setItem('payfear_token', newToken);
    } else {
      localStorage.removeItem('payfear_token');
    }
  }
}

export function getToken() {
  if (token) return token;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('payfear_token');
  }
  return token;
}

export function clearToken() {
  token = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('payfear_token');
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body, headers: extraHeaders = {} } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const currentToken = getToken();
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body && { body: JSON.stringify(body) }),
  });

  // No content
  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok || !data.success) {
    const err = data.error || {};
    throw new ApiError(
      err.code || 'UNKNOWN_ERROR',
      err.message || 'An unexpected error occurred',
      err.statusCode || res.status,
      err.details
    );
  }

  return data;
}

// ============================================================
// Auth
// ============================================================
export const auth = {
  async register(input) {
    const data = await request('/auth/register', { method: 'POST', body: input });
    setToken(data.data.token);
    return data.data;
  },

  async login(email, password) {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.data.token);
    return data.data;
  },

  async logout() {
    try { await request('/auth/logout', { method: 'POST' }); } catch {}
    clearToken();
  },

  async me() {
    const data = await request('/auth/me');
    return data.data;
  },
};

// ============================================================
// Users
// ============================================================
export const users = {
  async get(id) {
    const data = await request(`/users/${id}`);
    return data.data;
  },

  async update(id, body) {
    const data = await request(`/users/${id}`, { method: 'PATCH', body });
    return data.data;
  },

  async getReputation(id) {
    const data = await request(`/users/${id}/reputation`);
    return data.data;
  },
};

// ============================================================
// Tasks
// ============================================================
export const tasks = {
  async list(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    const data = await request(`/tasks${qs ? '?' + qs : ''}`);
    return data;
  },

  async get(id) {
    const data = await request(`/tasks/${id}`);
    return data.data;
  },

  async create(body) {
    const data = await request('/tasks', { method: 'POST', body });
    return data.data;
  },

  async update(id, body) {
    const data = await request(`/tasks/${id}`, { method: 'PATCH', body });
    return data.data;
  },

  async delete(id) {
    await request(`/tasks/${id}`, { method: 'DELETE' });
  },

  async publish(id) {
    const data = await request(`/tasks/${id}/publish`, { method: 'POST' });
    return data.data;
  },

  async accept(id) {
    const data = await request(`/tasks/${id}/accept`, { method: 'POST' });
    return data.data;
  },

  async start(id) {
    const data = await request(`/tasks/${id}/start`, { method: 'POST' });
    return data.data;
  },

  async cancel(id) {
    const data = await request(`/tasks/${id}/cancel`, { method: 'POST' });
    return data.data;
  },
};

// ============================================================
// Proofs
// ============================================================
export const proofs = {
  async submit(taskId, body) {
    const data = await request(`/tasks/${taskId}/proofs`, { method: 'POST', body });
    return data.data;
  },

  async list(taskId) {
    const data = await request(`/tasks/${taskId}/proofs`);
    return data.data;
  },
};

// ============================================================
// Reviews
// ============================================================
export const reviews = {
  async approve(taskId) {
    const data = await request(`/tasks/${taskId}/reviews/approve`, { method: 'POST' });
    return data.data;
  },

  async dispute(taskId, body) {
    const data = await request(`/tasks/${taskId}/reviews/dispute`, { method: 'POST', body });
    return data.data;
  },

  async submit(taskId, body) {
    const data = await request(`/tasks/${taskId}/reviews`, { method: 'POST', body });
    return data.data;
  },

  async list(taskId) {
    const data = await request(`/tasks/${taskId}/reviews`);
    return data.data;
  },
};

// ============================================================
// Flags
// ============================================================
export const flags = {
  async create(body) {
    const data = await request('/flags', { method: 'POST', body });
    return data.data;
  },
};

// ============================================================
// Escrow (on-chain status)
// ============================================================
export const escrow = {
  async getStatus(taskId) {
    const data = await request(`/escrow/${taskId}`);
    return data.data;
  },
};

// ============================================================
// Wallet
// ============================================================
export const wallet = {
  async list() {
    const data = await request('/wallet');
    return data.data;
  },

  async link(walletAddress, chainId = 84532) {
    const data = await request('/wallet/link', { method: 'POST', body: { walletAddress, chainId } });
    return data.data;
  },

  async unlink(id) {
    const data = await request(`/wallet/${id}`, { method: 'DELETE' });
    return data.data;
  },
};

// ============================================================
// SIWE (Sign-In With Ethereum)
// ============================================================
export const siwe = {
  async getNonce() {
    const data = await request('/siwe/nonce');
    return data.data.nonce;
  },

  async verify(message, signature) {
    const data = await request('/siwe/verify', { method: 'POST', body: { message, signature } });
    if (data.data.token) setToken(data.data.token);
    return data.data;
  },
};

export default { auth, users, tasks, proofs, reviews, flags, escrow, wallet, siwe };
