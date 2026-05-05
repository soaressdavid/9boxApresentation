// =============================================
// NAVBAR.JS — Navegação, dark mode, usuário logado
// =============================================

import { getUser, sairDaConta, toggleUserMenu, updateHeaderUser, isAdmin, isGestorOrAdmin } from './auth.js';

// ---- SUBMENU TOGGLE ----
window.toggleSubmenu = function(e, link) {
  e.preventDefault();
  const item = link.closest('.navbar-item-dropdown');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });
  item.classList.toggle('open', !isOpen);
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-item-dropdown')) {
    document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => el.classList.remove('open'));
  }
});

// ---- DARK MODE ----
function aplicarDarkMode(ativo) {
  document.body.classList.toggle('dark-mode', ativo);
  const btn = document.getElementById('dark-mode-btn');
  if (btn) {
    btn.innerHTML = ativo ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    btn.title = ativo ? 'Modo claro' : 'Modo escuro';
  }
}

window.toggleDarkMode = function() {
  const ativo = !document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', ativo ? '1' : '0');
  aplicarDarkMode(ativo);
};

// ---- CONTROLE DE VISIBILIDADE POR PERMISSÃO ----
function aplicarPermissoesNav() {
  const user = getUser();
  if (!user) return;

  // Cadastrar: apenas admin
  document.querySelectorAll('[data-role="admin"]').forEach(el => {
    el.style.display = isAdmin() ? '' : 'none';
  });

  // Consultar / Dashboard / Relatórios: gestor ou admin
  document.querySelectorAll('[data-role="gestorOrAdmin"]').forEach(el => {
    el.style.display = isGestorOrAdmin() ? '' : 'none';
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Ativar link correto
  const page = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.navbar-link:not(.navbar-link-dropdown)').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();
    if ((page === 'index.html' || page === '') && (hrefPage === 'index.html' || href.includes('index.html'))) {
      link.classList.add('active');
    } else if (hrefPage && hrefPage !== 'index.html' && page === hrefPage) {
      link.classList.add('active');
    }
  });

  document.querySelectorAll('.navbar-submenu-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();
    if (hrefPage && page === hrefPage) {
      link.classList.add('active');
      const parentItem = link.closest('.navbar-item-dropdown');
      if (parentItem) {
        parentItem.querySelector('.navbar-link-dropdown')?.classList.add('active');
      }
    }
  });

  // Usuário logado no header
  updateHeaderUser();
  aplicarPermissoesNav();

  // Dark mode
  const darkSalvo = localStorage.getItem('darkMode');
  if (darkSalvo === '1') {
    aplicarDarkMode(true);
  } else if (darkSalvo === null) {
    aplicarDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
});

// Expõe funções usadas em HTML inline
window.sairDaConta = sairDaConta;
window.toggleUserMenu = toggleUserMenu;
