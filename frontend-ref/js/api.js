// =============================================
// API.JS — Client HTTP centralizado
// =============================================

import CONFIG from './config.js';
import { getToken, logout } from './auth.js';
import { showToast } from './components/toast.js';
import { showLoading, hideLoading } from './components/loading.js';

/**
 * Faz uma requisição HTTP para a API.
 * @param {string} endpoint - Caminho relativo (ex: '/users/login')
 * @param {object} options  - Opções do fetch (method, body, etc.)
 * @param {boolean} silent  - Se true, não exibe loading/toast de erro
 */
async function request(endpoint, options = {}, silent = false) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (!silent) showLoading();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      // Token expirado ou inválido → logout automático
      if (response.status === 401) {
        logout();
        return;
      }

      const msg = data.message || 'Erro na requisição';
      if (!silent) showToast(msg, 'error');
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (!silent && !(err instanceof TypeError)) {
      // TypeError = falha de rede (servidor offline)
    }
    if (err instanceof TypeError) {
      if (!silent) showToast('Servidor indisponível. Verifique se o backend está rodando.', 'error');
    }
    throw err;
  } finally {
    if (!silent) hideLoading();
  }
}

// =============================================
// HELPERS DE MÉTODO
// =============================================
const api = {
  get:    (endpoint, silent)       => request(endpoint, { method: 'GET' }, silent),
  post:   (endpoint, body, silent) => request(endpoint, { method: 'POST', body }, silent),
  put:    (endpoint, body, silent) => request(endpoint, { method: 'PUT', body }, silent),
  delete: (endpoint, silent)       => request(endpoint, { method: 'DELETE' }, silent),
};

// =============================================
// ENDPOINTS — USUÁRIOS
// =============================================
export const usersApi = {
  login:         (body)   => api.post('/users/login', body),
  register:      (body)   => api.post('/users/register', body),
  getProfile:    ()       => api.get('/users/profile'),
  updateProfile: (body)   => api.put('/users/profile', body),
  list:          (params) => api.get(`/users${buildQuery(params)}`),
  getById:       (id)     => api.get(`/users/${id}`),
  getByRA:       (ra)     => api.get(`/users/ra/${ra}`),
  delete:        (id)     => api.delete(`/users/${id}`),
};

// =============================================
// ENDPOINTS — AVALIAÇÕES
// =============================================
export const evaluationsApi = {
  create:          (body)   => api.post('/evaluations', body),
  list:            (params) => api.get(`/evaluations${buildQuery(params)}`),
  getById:         (id)     => api.get(`/evaluations/${id}`),
  getByAvaliado:   (id, p)  => api.get(`/evaluations/avaliado/${id}${buildQuery(p)}`),
  getStats:        (id)     => api.get(`/evaluations/stats/avaliado/${id}`),
  update:          (id, b)  => api.put(`/evaluations/${id}`, b),
  delete:          (id)     => api.delete(`/evaluations/${id}`),
};

// =============================================
// ENDPOINTS — NINE BOX
// =============================================
export const nineBoxApi = {
  create:          (body)   => api.post('/evaluations/nine-box', body),
  list:            (params) => api.get(`/evaluations/nine-box${buildQuery(params)}`),
  getById:         (id)     => api.get(`/evaluations/nine-box/${id}`),
  getByPessoa:     (id)     => api.get(`/evaluations/nine-box/pessoa/${id}`),
  getLatest:       (id)     => api.get(`/evaluations/nine-box/pessoa/${id}/latest`),
  getDistribution: ()       => api.get('/evaluations/nine-box/stats/distribution'),
  update:          (id, b)  => api.put(`/evaluations/nine-box/${id}`, b),
  delete:          (id)     => api.delete(`/evaluations/nine-box/${id}`),
};

// =============================================
// ENDPOINTS — COMPETÊNCIAS
// =============================================
export const competenciesApi = {
  create:   (body)   => api.post('/competencies', body),
  list:     (params) => api.get(`/competencies${buildQuery(params)}`),
  getById:  (id)     => api.get(`/competencies/${id}`),
  update:   (id, b)  => api.put(`/competencies/${id}`, b),
  delete:   (id)     => api.delete(`/competencies/${id}`),
};

// =============================================
// ENDPOINTS — RELATÓRIOS
// =============================================
export const reportsApi = {
  dashboard:  ()   => api.get('/reports/dashboard'),
  user:       (id) => api.get(`/reports/user/${id}`),
  team:       (id) => api.get(`/reports/team/${id}`),
  export:     (id) => api.get(`/reports/export/${id}`),
};

// =============================================
// HELPER — monta query string
// =============================================
function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}

export default api;
