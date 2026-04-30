// =============================================
// COMPETÊNCIAS — LÓGICA
// =============================================

let editandoId = null;

function getCompetencias() {
  return JSON.parse(localStorage.getItem('competencias') || '[]');
}

function saveCompetencias(data) {
  localStorage.setItem('competencias', JSON.stringify(data));
}

// ---- ABRIR FORMULÁRIO ----
function abrirFormulario(id = null) {
  editandoId = id;

  document.getElementById('tela-lista').style.display = 'none';
  document.getElementById('tela-form').style.display = 'block';
  document.getElementById('comp-header-title').textContent =
    id ? 'Editar Competência' : 'Nova Competência';
  document.getElementById('form-titulo').textContent =
    id ? 'Editar Competência' : 'Nova Competência';

  // Limpar campos
  document.getElementById('comp-nome').value = '';
  document.getElementById('comp-de').value = '';
  document.getElementById('comp-tipo').value = '';
  document.getElementById('comp-descricao').value = '';
  document.querySelectorAll('#comp-criterios-grid textarea').forEach(t => t.value = '');

  // Se editando, preencher
  if (id) {
    const comp = getCompetencias().find(c => c.id === id);
    if (comp) {
      document.getElementById('comp-nome').value = comp.nome || '';
      document.getElementById('comp-de').value = comp.de || '';
      document.getElementById('comp-tipo').value = comp.tipo || '';
      document.getElementById('comp-descricao').value = comp.descricao || '';
      const textareas = document.querySelectorAll('#comp-criterios-grid textarea');
      (comp.criterios || []).forEach((c, i) => {
        if (textareas[i]) textareas[i].value = c;
      });
    }
  }
}

// ---- FECHAR FORMULÁRIO ----
function fecharFormulario() {
  document.getElementById('tela-form').style.display = 'none';
  document.getElementById('tela-lista').style.display = 'block';
  document.getElementById('comp-header-title').textContent = 'Competências';
  editandoId = null;
  renderLista();
}

// ---- SALVAR ----
function salvarCompetencia() {
  const nome = document.getElementById('comp-nome').value.trim();
  const de = document.getElementById('comp-de').value;
  const tipo = document.getElementById('comp-tipo').value;
  const descricao = document.getElementById('comp-descricao').value.trim();
  const criterios = Array.from(
    document.querySelectorAll('#comp-criterios-grid textarea')
  ).map(t => t.value.trim());

  if (!nome) { showToast('Digite o nome da competência.', 'error'); return; }
  if (!de)   { showToast('Selecione a competência de quem.', 'error'); return; }
  if (!tipo) { showToast('Selecione o tipo.', 'error'); return; }

  const data = getCompetencias();

  if (editandoId) {
    const idx = data.findIndex(c => c.id === editandoId);
    if (idx !== -1) {
      data[idx] = { ...data[idx], nome, de, tipo, descricao, criterios };
      showToast('Competência atualizada!');
    }
  } else {
    data.push({
      id: Date.now(),
      nome, de, tipo, descricao, criterios,
      data: new Date().toLocaleDateString('pt-BR'),
    });
    showToast('Competência criada com sucesso!');
  }

  saveCompetencias(data);
  fecharFormulario();
}

// ---- REMOVER ----
function removerCompetencia(id) {
  if (!confirm('Remover esta competência?')) return;
  const data = getCompetencias().filter(c => c.id !== id);
  saveCompetencias(data);
  renderLista();
  showToast('Competência removida.');
}

// ---- RENDERIZAR LISTA ----
function renderLista() {
  const container = document.getElementById('comp-lista-container');
  if (!container) return;

  const data = getCompetencias();

  if (data.length === 0) {
    container.innerHTML = `
      <div class="comp-empty">
        <i class="fa-solid fa-clipboard-list"></i>
        <p>Nenhuma competência cadastrada ainda.</p>
        <button class="comp-btn-novo" onclick="abrirFormulario()">
          <i class="fa-solid fa-plus"></i> Criar primeira competência
        </button>
      </div>`;
    return;
  }

  const tipoLabel = { desempenho: 'Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };
  const deLabel   = { gestor: 'Gestor', professor: 'Professor', estagiario: 'Estagiário', todos: 'Todos' };

  container.innerHTML = data.map(c => `
    <div class="comp-card">
      <div class="comp-card-icon">
        <i class="fa-solid fa-clipboard-check"></i>
      </div>
      <div class="comp-card-info">
        <div class="comp-card-nome">${c.nome}</div>
        ${c.descricao ? `<div class="comp-card-desc">${c.descricao}</div>` : ''}
        <div class="comp-card-badges">
          ${c.de ? `<span class="comp-badge comp-badge-de">${deLabel[c.de] || c.de}</span>` : ''}
          ${c.tipo ? `<span class="comp-badge comp-badge-tipo">${tipoLabel[c.tipo] || c.tipo}</span>` : ''}
          <span class="comp-badge" style="background:#f1f5f9;color:var(--text-muted)">${c.data}</span>
        </div>
      </div>
      <div class="comp-card-actions">
        <button class="comp-btn-edit" onclick="abrirFormulario(${c.id})">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="comp-btn-del" onclick="removerCompetencia(${c.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderLista();
});
