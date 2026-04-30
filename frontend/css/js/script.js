// =============================================
// STORAGE HELPERS
// =============================================
function getContatos() {
  return JSON.parse(localStorage.getItem('contatos') || '[]');
}

function saveContatos(contatos) {
  localStorage.setItem('contatos', JSON.stringify(contatos));
}

function getAvaliacoes() {
  return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
}

function saveAvaliacoes(avaliacoes) {
  localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
}

// =============================================
// CADASTRAR
// =============================================
function cadastrar() {
  const nomeInput = document.getElementById('nome');
  if (!nomeInput) return;

  const nome = nomeInput.value.trim();
  if (!nome) {
    showToast('Digite um nome válido.', 'error');
    return;
  }

  const contatos = getContatos();
  contatos.push({ id: Date.now(), nome });
  saveContatos(contatos);

  nomeInput.value = '';
  showToast('Cadastrado com sucesso!');
}

// =============================================
// CONSULTAR
// =============================================
function renderLista() {
  const lista = document.getElementById('lista');
  if (!lista) return;

  const contatos = getContatos();

  if (contatos.length === 0) {
    lista.innerHTML = '<p style="color:#888;text-align:center;">Nenhum contato cadastrado.</p>';
    return;
  }

  lista.innerHTML = contatos.map(c => `
    <div class="list-item">
      <span>${c.nome}</span>
      <button class="btn-danger" onclick="remover(${c.id})">Remover</button>
    </div>
  `).join('');
}

function remover(id) {
  const contatos = getContatos().filter(c => c.id !== id);
  saveContatos(contatos);
  renderLista();
  showToast('Contato removido.');
}

// =============================================
// AVALIAÇÕES - STARS
// =============================================
let notaSelecionada = 0;

function initStars() {
  const stars = document.querySelectorAll('.stars span');
  if (!stars.length) return;

  stars.forEach((star, i) => {
    star.addEventListener('mouseover', () => highlightStars(stars, i));
    star.addEventListener('mouseout', () => highlightStars(stars, notaSelecionada - 1));
    star.addEventListener('click', () => {
      notaSelecionada = i + 1;
      highlightStars(stars, i);
    });
  });
}

function highlightStars(stars, upTo) {
  stars.forEach((s, i) => s.classList.toggle('active', i <= upTo));
}

// =============================================
// AVALIAR PROFESSOR
// =============================================
function populateProfessores() {
  const select = document.getElementById('professor');
  if (!select) return;

  const contatos = getContatos();
  if (contatos.length === 0) {
    select.innerHTML = '<option value="">Nenhum contato cadastrado</option>';
    return;
  }

  select.innerHTML = '<option value="">Selecione...</option>' +
    contatos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function salvar() {
  const professorSelect = document.getElementById('professor');
  const comentario = document.getElementById('comentario');
  if (!professorSelect || !comentario) return;

  const professorId = professorSelect.value;
  const texto = comentario.value.trim();

  if (!professorId) {
    showToast('Selecione um professor.', 'error');
    return;
  }
  if (notaSelecionada === 0) {
    showToast('Selecione uma nota.', 'error');
    return;
  }

  const contatos = getContatos();
  const professor = contatos.find(c => c.id == professorId);

  const avaliacoes = getAvaliacoes();
  avaliacoes.push({
    id: Date.now(),
    professor: professor ? professor.nome : 'Desconhecido',
    nota: notaSelecionada,
    comentario: texto,
    data: new Date().toLocaleDateString('pt-BR')
  });
  saveAvaliacoes(avaliacoes);

  comentario.value = '';
  notaSelecionada = 0;
  highlightStars(document.querySelectorAll('.stars span'), -1);
  professorSelect.value = '';

  showToast('Avaliação salva com sucesso!');
}

// =============================================
// LISTAR AVALIAÇÕES
// =============================================
function renderAvaliacoes() {
  const container = document.getElementById('avaliacoes');
  if (!container) return;

  const avaliacoes = getAvaliacoes();

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p style="color:#888;text-align:center;">Nenhuma avaliação registrada.</p>';
    return;
  }

  container.innerHTML = avaliacoes.map(a => `
    <div class="avaliacao-item">
      <div class="avaliacao-header">
        <strong>${a.professor}</strong>
        <span class="avaliacao-data">${a.data}</span>
      </div>
      <div class="avaliacao-nota">${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}</div>
      ${a.comentario ? `<p class="avaliacao-comentario">${a.comentario}</p>` : ''}
    </div>
  `).join('');
}

// =============================================
// TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  renderLista();
  renderAvaliacoes();
  populateProfessores();
  initStars();
});
