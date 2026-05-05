// =============================================
// TOAST.JS — Notificações visuais
// =============================================

let toastTimer = null;

/**
 * Exibe uma notificação toast.
 * @param {string} msg   - Mensagem
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration - Duração em ms (padrão 3000)
 */
export function showToast(msg, type = 'success', duration = 3000) {
  let toast = document.getElementById('toast-global');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  // Ícones por tipo
  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
  };

  toast.innerHTML = `${icons[type] || ''} ${msg}`;
  toast.className = `toast ${type} show`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Expõe globalmente para uso em HTML inline (onclick="...")
window.showToast = showToast;
