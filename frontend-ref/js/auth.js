// =============================================
// AUTH.JS — Autenticação com JWT
// =============================================

import CONFIG from './config.js';

// =============================================
// TOKEN
// =============================================
export function getToken() {
  return localStorage.getItem(CONFIG.TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
}

// =============================================
// USUÁRIO LOGADO
// =============================================
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem(CONFIG.USER_KEY);
}

// =============================================
// SESSÃO
// =============================================
export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  removeToken();
  removeUser();
  window.location.href = '/frontend-ref/pages/login.html';
}

// =============================================
// PERMISSÕES
// =============================================
export function isAdmin() {
  return getUser()?.tipo === 'admin';
}

export function isGestor() {
  return getUser()?.tipo === 'gestor';
}

export function isColaborador() {
  return getUser()?.tipo === 'colaborador';
}

export function isGestorOrAdmin() {
  const tipo = getUser()?.tipo;
  return tipo === 'gestor' || tipo === 'admin';
}

// =============================================
// PROTEÇÃO DE ROTAS
// =============================================

/**
 * Redireciona para login se não estiver autenticado.
 * Chame no início de cada página protegida.
 */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/frontend-ref/pages/login.html';
    return false;
  }
  return true;
}

/**
 * Redireciona para index se não tiver a permissão necessária.
 * @param {'admin'|'gestor'|'colaborador'|'gestorOrAdmin'} role
 */
export function requireRole(role) {
  if (!requireAuth()) return false;

  const tipo = getUser()?.tipo;
  const allowed = {
    admin:         tipo === 'admin',
    gestor:        tipo === 'gestor',
    colaborador:   tipo === 'colaborador',
    gestorOrAdmin: tipo === 'gestor' || tipo === 'admin',
  };

  if (!allowed[role]) {
    window.location.href = '/frontend-ref/index.html';
    return false;
  }
  return true;
}

/**
 * Atualiza o header com os dados do usuário logado.
 * Chame após requireAuth() em cada página.
 */
export function updateHeaderUser() {
  const user = getUser();
  if (!user) return;

  const nomeEl   = document.getElementById('user-dropdown-nome');
  const tipoEl   = document.getElementById('user-dropdown-tipo');
  const avatarEl = document.getElementById('user-dropdown-avatar');
  const sairBtn  = document.getElementById('btn-sair-header');

  if (nomeEl)  nomeEl.textContent  = user.nome || 'Usuário';
  if (tipoEl)  tipoEl.textContent  = tipoLabel(user.tipo);
  if (sairBtn) sairBtn.style.display = 'flex';

  if (avatarEl) {
    if (user.foto) {
      avatarEl.innerHTML = `<img src="${user.foto}" alt="${user.nome}">`;
    } else {
      const iniciais = (user.nome || 'U').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
      avatarEl.innerHTML = `<span>${iniciais}</span>`;
    }
  }
}

export function sairDaConta() {
  logout();
}

export function toggleUserMenu() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('#user-menu')) {
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
});

// =============================================
// HELPERS
// =============================================
export function tipoLabel(tipo) {
  const labels = { admin: 'Administrador', gestor: 'Gestor', colaborador: 'Colaborador' };
  return labels[tipo] || tipo;
}
