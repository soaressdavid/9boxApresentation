// =============================================
// LOADING.JS — Spinner global de carregamento
// =============================================

let loadingCount = 0;

export function showLoading() {
  loadingCount++;
  let overlay = document.getElementById('loading-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  overlay.classList.add('active');
}

export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    document.getElementById('loading-overlay')?.classList.remove('active');
  }
}
