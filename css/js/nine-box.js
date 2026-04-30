// =============================================
// NINE BOX — LÓGICA COMPLETA REDESENHADA
// =============================================

let nbTipo = 'professor';
let nbFiltro = 'todos';
let nbPerf = null;
let nbPot = null;

const NB_CATEGORIAS = {
  '1-1': { nome: 'Questão',     icon: '❓' },
  '2-1': { nome: 'Trabalhador', icon: '⚙️' },
  '3-1': { nome: 'Âncora',      icon: '⚓' },
  '1-2': { nome: 'Dilema',      icon: '🤔' },
  '2-2': { nome: 'Núcleo',      icon: '💎' },
  '3-2': { nome: 'Especialista',icon: '🎯' },
  '1-3': { nome: 'Enigma',      icon: '🔮' },
  '2-3': { nome: 'Estrela',     icon: '⭐' },
  '3-3': { nome: 'Superstar',   icon: '🚀' },
};

const PERF_LABELS = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };
const POT_LABELS  = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };

// =============================================
// STORAGE
// =============================================
function getNBData() {
  return JSON.parse(localStorage.getItem('nineBoxAvaliacoes') || '[]');
}

function saveNBData(data) {
  localStorage.setItem('nineBoxAvaliacoes', JSON.stringify(data));
}

// =============================================
// TIPO (professor / estagiário)
// =============================================
function setTipoNB(tipo) {
  nbTipo = tipo;

  document.querySelectorAll('.nb-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === tipo);
  });

  const label = document.getElementById('nb-pessoa-label');
  if (label) label.textContent = tipo === 'professor' ? 'Professor' : 'Estagiário';

  popularSelectNB();
}

// =============================================
// POPULAR SELECT
// =============================================
function popularSelectNB() {
  const select = document.getElementById('nb-pessoa');
  if (!select) return;

  const contatos = getContatos().filter(c => c.tipo === nbTipo);

  if (contatos.length === 0) {
    select.innerHTML = `<option value="">Nenhum ${nbTipo === 'professor' ? 'professor' : 'estagiário'} cadastrado</option>`;
    return;
  }

  select.innerHTML = '<option value="">Selecione...</option>' +
    contatos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// =============================================
// SELECIONAR EIXO (performance / potential)
// =============================================
function selectAxis(axis, val) {
  if (axis === 'perf') {
    nbPerf = val;
    document.querySelectorAll('#perf-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });
  } else {
    nbPot = val;
    document.querySelectorAll('#pot-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });
  }

  atualizarPreview();
  destacarBox();
}

// =============================================
// PREVIEW DA CATEGORIA
// =============================================
function atualizarPreview() {
  const preview = document.getElementById('nb-preview');
  const catEl = document.getElementById('nb-preview-cat');
  if (!preview || !catEl) return;

  if (nbPerf && nbPot) {
    const cat = NB_CATEGORIAS[`${nbPerf}-${nbPot}`];
    catEl.textContent = `${cat.icon} ${cat.nome}`;
    preview.style.display = 'flex';
  } else {
    preview.style.display = 'none';
  }
}

// =============================================
// DESTACAR BOX NO GRID
// =============================================
function destacarBox() {
  document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));

  if (nbPerf && nbPot) {
    const box = document.getElementById(`nb-box-${nbPerf}-${nbPot}`);
    if (box) {
      box.classList.add('highlight');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// =============================================
// CLICAR NA BOX DO GRID
// =============================================
function clickBox(perf, pot) {
  // Se já tem pessoa selecionada e eixos, posiciona direto
  const select = document.getElementById('nb-pessoa');
  if (select && select.value) {
    nbPerf = perf;
    nbPot = pot;

    // Atualiza botões de eixo
    document.querySelectorAll('#perf-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === perf);
    });
    document.querySelectorAll('#pot-btns .nb-axis-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === pot);
    });

    atualizarPreview();
    destacarBox();
    showToast(`Posição selecionada: ${NB_CATEGORIAS[`${perf}-${pot}`].nome}. Clique em Salvar.`, 'info');
  }
}

// =============================================
// SALVAR
// =============================================
function salvarNB() {
  const select = document.getElementById('nb-pessoa');
  const comentario = document.getElementById('nb-comentario');

  if (!select?.value) {
    showToast('Selecione uma pessoa para avaliar.', 'error');
    return;
  }
  if (!nbPerf) {
    showToast('Selecione o nível de Performance.', 'error');
    return;
  }
  if (!nbPot) {
    showToast('Selecione o nível de Potential.', 'error');
    return;
  }

  const contatos = getContatos();
  const pessoa = contatos.find(c => c.id == select.value);
  const cat = NB_CATEGORIAS[`${nbPerf}-${nbPot}`];

  const data = getNBData();
  const existeIdx = data.findIndex(a => a.pessoaId == select.value);

  const registro = {
    id: existeIdx >= 0 ? data[existeIdx].id : Date.now(),
    pessoaId: select.value,
    tipo: nbTipo,
    pessoa: pessoa ? pessoa.nome : 'Desconhecido',
    performance: nbPerf,
    potential: nbPot,
    categoria: cat.nome,
    comentario: comentario?.value.trim() || '',
    data: new Date().toLocaleDateString('pt-BR'),
  };

  if (existeIdx >= 0) {
    data[existeIdx] = registro;
    showToast(`${pessoa?.nome} atualizado no Nine Box!`);
  } else {
    data.push(registro);
    showToast(`${pessoa?.nome} posicionado como ${cat.icon} ${cat.nome}!`);
  }

  saveNBData(data);

  // Reset
  select.value = '';
  if (comentario) comentario.value = '';
  nbPerf = null;
  nbPot = null;
  document.querySelectorAll('.nb-axis-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));
  document.getElementById('nb-preview').style.display = 'none';

  renderNBGrid();
}

// =============================================
// RENDERIZAR GRID
// =============================================
function renderNBGrid() {
  // Limpar todas as boxes
  for (let p = 1; p <= 3; p++) {
    for (let pt = 1; pt <= 3; pt++) {
      const el = document.getElementById(`nb-people-${p}-${pt}`);
      if (el) el.innerHTML = '';
    }
  }

  let data = getNBData();
  if (nbFiltro !== 'todos') {
    data = data.filter(a => a.tipo === nbFiltro);
  }

  data.forEach(av => {
    const container = document.getElementById(`nb-people-${av.performance}-${av.potential}`);
    if (!container) return;

    const chip = document.createElement('div');
    chip.className = `nb-chip ${av.tipo}`;
    chip.innerHTML = `
      <span class="nb-chip-dot"></span>
      <span class="nb-chip-name">${av.pessoa}</span>
    `;
    chip.title = `${av.pessoa} — ${av.categoria}`;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModal(av);
    });

    container.appendChild(chip);
  });
}

// =============================================
// FILTRO
// =============================================
function filtrarNB(filtro) {
  nbFiltro = filtro;
  document.querySelectorAll('.nb-filtro').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === filtro);
  });
  renderNBGrid();
}

// =============================================
// MODAL DE DETALHES
// =============================================
function abrirModal(av) {
  const overlay = document.getElementById('nb-modal');
  const header  = document.getElementById('nb-modal-header');
  const body    = document.getElementById('nb-modal-body');
  const cat     = NB_CATEGORIAS[`${av.performance}-${av.potential}`];

  header.innerHTML = `
    <h4>${av.pessoa}</h4>
    <span class="nb-modal-cat">${cat.icon} ${cat.nome}</span>
  `;

  body.innerHTML = `
    <div class="nb-modal-row">
      <span>Tipo</span>
      <span>${av.tipo === 'professor' ? '👨‍🏫 Professor' : '👨‍💼 Estagiário'}</span>
    </div>
    <div class="nb-modal-row">
      <span>Performance</span>
      <span>${PERF_LABELS[av.performance]}</span>
    </div>
    <div class="nb-modal-row">
      <span>Potential</span>
      <span>${POT_LABELS[av.potential]}</span>
    </div>
    <div class="nb-modal-row">
      <span>Data</span>
      <span>${av.data}</span>
    </div>
    ${av.comentario ? `<div class="nb-modal-comentario">"${av.comentario}"</div>` : ''}
    <div class="nb-modal-actions">
      <button class="nb-modal-btn edit" onclick="editarNB('${av.pessoaId}')">
        <i class="fa-solid fa-pen"></i> Editar
      </button>
      <button class="nb-modal-btn remove" onclick="removerNB('${av.pessoaId}')">
        <i class="fa-solid fa-trash"></i> Remover
      </button>
    </div>
  `;

  overlay.classList.add('open');
}

function fecharModal(e) {
  if (!e || e.target === document.getElementById('nb-modal') || e.type === 'click') {
    document.getElementById('nb-modal').classList.remove('open');
  }
}

// =============================================
// EDITAR / REMOVER
// =============================================
function editarNB(pessoaId) {
  fecharModal();
  const data = getNBData();
  const av = data.find(a => a.pessoaId == pessoaId);
  if (!av) return;

  // Mudar tipo e popular select
  setTipoNB(av.tipo);

  setTimeout(() => {
    const select = document.getElementById('nb-pessoa');
    if (select) select.value = av.pessoaId;

    // Selecionar eixos
    selectAxis('perf', av.performance);
    selectAxis('pot', av.potential);

    const comentario = document.getElementById('nb-comentario');
    if (comentario) comentario.value = av.comentario || '';

    showToast('Edite os valores e clique em Salvar.', 'info');
  }, 100);
}

function removerNB(pessoaId) {
  fecharModal();
  let data = getNBData();
  const av = data.find(a => a.pessoaId == pessoaId);
  data = data.filter(a => a.pessoaId != pessoaId);
  saveNBData(data);
  renderNBGrid();
  showToast(`${av?.pessoa || 'Pessoa'} removido do Nine Box.`);
}

// =============================================
// CARREGAR AO SELECIONAR PESSOA
// =============================================
function onSelectPessoa() {
  const select = document.getElementById('nb-pessoa');
  if (!select?.value) return;

  const data = getNBData();
  const av = data.find(a => a.pessoaId == select.value);

  if (av) {
    selectAxis('perf', av.performance);
    selectAxis('pot', av.potential);
    const comentario = document.getElementById('nb-comentario');
    if (comentario) comentario.value = av.comentario || '';
    showToast('Avaliação existente carregada.', 'info');
  } else {
    // Limpar seleções
    nbPerf = null;
    nbPot = null;
    document.querySelectorAll('.nb-axis-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.nb-box').forEach(b => b.classList.remove('highlight'));
    document.getElementById('nb-preview').style.display = 'none';
  }
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  setTipoNB('professor');
  renderNBGrid();

  const select = document.getElementById('nb-pessoa');
  if (select) select.addEventListener('change', onSelectPessoa);

  // Fechar modal com ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});
