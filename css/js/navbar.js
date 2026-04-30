// =============================================
// NAVBAR — ATIVAÇÃO AUTOMÁTICA POR URL + USUÁRIO LOGADO + SUBMENU + DARK MODE
// =============================================

// ---- SUBMENU TOGGLE ----
function toggleSubmenu(e, link) {
  e.preventDefault();
  const item = link.closest('.navbar-item-dropdown');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Fechar todos os outros submenus
  document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

// Fechar submenu ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-item-dropdown')) {
    document.querySelectorAll('.navbar-item-dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});

// ---- DARK MODE ----
function aplicarDarkMode(ativo) {
  document.body.classList.toggle('dark-mode', ativo);
  const btn = document.getElementById('dark-mode-btn');
  if (btn) {
    btn.innerHTML = ativo
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    btn.title = ativo ? 'Modo claro' : 'Modo escuro';
  }
}

function toggleDarkMode() {
  const ativo = !document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', ativo ? '1' : '0');
  aplicarDarkMode(ativo);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  // Ativar link correto (links normais)
  document.querySelectorAll('.navbar-link:not(.navbar-link-dropdown)').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();

    if ((page === 'index.html' || page === '') && (hrefPage === 'index.html' || href === 'index.html' || href === '../index.html')) {
      link.classList.add('active');
      return;
    }
    if (hrefPage && hrefPage !== 'index.html' && page === hrefPage) {
      link.classList.add('active');
    }
  });

  // Ativar submenu links e marcar pai como ativo se filho estiver ativo
  document.querySelectorAll('.navbar-submenu-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('/').pop();
    if (hrefPage && page === hrefPage) {
      link.classList.add('active');
      // Marcar o link pai como ativo também
      const parentItem = link.closest('.navbar-item-dropdown');
      if (parentItem) {
        const parentLink = parentItem.querySelector('.navbar-link-dropdown');
        if (parentLink) parentLink.classList.add('active');
      }
    }
  });

  // Mostrar nome do usuário logado no link do Perfil
  try {
    const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
    if (sessao) {
      const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
      const pessoa = contatos.find(c => c.id === sessao.id);
      if (pessoa) {
        const perfilLink = document.querySelector('.navbar-link[href*="perfil"]');
        if (perfilLink) {
          const span = perfilLink.querySelector('span');
          if (span) {
            const primeiroNome = pessoa.nome.split(' ')[0];
            span.textContent = primeiroNome;
          }
          const icon = perfilLink.querySelector('i');
          if (icon) icon.className = 'fa-solid fa-circle-user';
        }
      }
    }
  } catch (e) {}

  // Aplicar dark mode salvo
  const darkSalvo = localStorage.getItem('darkMode');
  if (darkSalvo === '1') {
    aplicarDarkMode(true);
  } else if (darkSalvo === null) {
    // Respeitar preferência do sistema se não houver preferência salva
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    aplicarDarkMode(prefereEscuro);
  }
});
