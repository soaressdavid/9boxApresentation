// =============================================
// AVALIAÇÃO 180° — LÓGICA
// =============================================

let r180EditandoId = null;
let r180Avaliados = [];
let r180Competencias = [];

function getAvaliacoes180() {
  return JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
}

function saveAvaliacoes180(data) {
  localStorage.setItem('avaliacoes180', JSON.stringify(data));
}

// ---- ABRIR FORMULÁRIO ----
function abrirFormulario(id = null) {
  r180EditandoId = id;
  r180Avaliados = [];
  r180Competencias = [];

  document.getElementById('tela-lista').style.display = 'none';
  document.getElementById('tela-form').style.display = 'block';

  // Limpar campos
  document.getElementById('r180-nome').value = '';
  document.getElementById('r180-tipo').value = '180';
  document.getElementById('r180-empresa').value = '';
  document.getElementById('r180-setor').value = '';
  document.getElementById('r180-descricao').value = '';
  document.getElementById('r180-inicio').value = '';
  document.getElementById('r180-fim').value = '';

  popularSelectGestor();

  if (id) {
    const av = getAvaliacoes180().find(a => a.id === id);
    if (av) {
      document.getElementById('r180-nome').value = av.nome || '';
      document.getElementById('r180-tipo').value = av.tipo || '180';
      document.getElementById('r180-empresa').value = av.empresa || '';
      document.getElementById('r180-setor').value = av.setor || '';
      document.getElementById('r180-descricao').value = av.descricao || '';
      document.getElementById('r180-inicio').value = av.inicio || '';
      document.getElementById('r180-fim').value = av.fim || '';
      document.getElementById('r180-gestor').value = av.gestorId || '';
      r180Avaliados = av.avaliados || [];
      r180Competencias = av.competencias || [];
      document.getElementById('r180-btn-texto').textContent = 'Salvar Alterações';
    }
  } else {
    document.getElementById('r180-btn-texto').textContent = 'Criar Avaliação';
  }

  renderAvaliados();
  renderCompetenciasVinculadas();
}

// ---- FECHAR FORMULÁRIO ----
function fecharFormulario() {
  document.getElementById('tela-form').style.display = 'none';
  document.getElementById('tela-lista').style.display = 'block';
  r180EditandoId = null;
  renderLista180();
}

// ---- POPULAR SELECT GESTOR ----
function popularSelectGestor() {
  const select = document.getElementById('r180-gestor');
  if (!select) return;
  const professores = getContatos().filter(c => c.tipo === 'professor');
  select.innerHTML = '<option value="">Selecione o gestor...</option>' +
    professores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

// ---- SALVAR AVALIAÇÃO ----
function salvarAvaliacao180() {
  const nome = document.getElementById('r180-nome').value.trim();
  const tipo = document.getElementById('r180-tipo').value;
  const empresa = document.getElementById('r180-empresa').value.trim();
  const gestorId = document.getElementById('r180-gestor').value;
  const setor = document.getElementById('r180-setor').value.trim();
  const inicio = document.getElementById('r180-inicio').value;
  const fim = document.getElementById('r180-fim').value;
  const descricao = document.getElementById('r180-descricao').value.trim();

  if (!nome) { showToast('Digite o nome da avaliação.', 'error'); return; }
  if (!empresa) { showToast('Digite o nome da empresa.', 'error'); return; }

  const contatos = getContatos();
  const gestor = contatos.find(c => c.id == gestorId);

  const data = getAvaliacoes180();
  const tipoLabels = { '180': '180° (Gestor × Colaborador)', '90': '90° (Autoavaliação)', 'equipe': 'Equipe (para gestores)' };

  const registro = {
    id: r180EditandoId || Date.now(),
    nome, tipo,
    tipoLabel: tipoLabels[tipo] || tipo,
    empresa, gestorId,
    gestor: gestor ? gestor.nome : '',
    setor, inicio, fim, descricao,
    avaliados: r180Avaliados,
    competencias: r180Competencias,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    status: 'ativo',
  };

  if (r180EditandoId) {
    const idx = data.findIndex(a => a.id === r180EditandoId);
    if (idx !== -1) data[idx] = registro;
    showToast('Avaliação atualizada!');
  } else {
    data.push(registro);
    showToast('Avaliação 180° criada com sucesso!');
  }

  saveAvaliacoes180(data);
  fecharFormulario();
}

// ---- REMOVER AVALIAÇÃO ----
function removerAvaliacao180(id) {
  if (!confirm('Remover esta avaliação 180°?')) return;
  const data = getAvaliacoes180().filter(a => a.id !== id);
  saveAvaliacoes180(data);
  renderLista180();
  showToast('Avaliação removida.');
}

// ---- RENDERIZAR LISTA ----
function renderLista180() {
  const container = document.getElementById('r180-lista-container');
  if (!container) return;

  const data = getAvaliacoes180();

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <i class="fa-solid fa-clipboard-list" style="font-size:48px;color:var(--border);display:block;margin-bottom:16px"></i>
        <p style="font-size:15px;margin:0 0 16px">Nenhuma avaliação 180° criada ainda.</p>
        <button class="r180-btn-novo" onclick="abrirFormulario()" style="margin:0 auto">
          <i class="fa-solid fa-plus"></i> Criar primeira avaliação
        </button>
      </div>`;
    return;
  }

  container.innerHTML = data.map(a => `
    <div class="r180-item-card">
      <div class="r180-item-icon"><i class="fa-solid fa-rotate"></i></div>
      <div class="r180-item-info">
        <div class="r180-item-nome">${a.nome}</div>
        <div class="r180-item-meta">
          <span><i class="fa-solid fa-building"></i> ${a.empresa || '—'}</span>
          <span><i class="fa-solid fa-user-tie"></i> ${a.gestor || '—'}</span>
          <span><i class="fa-solid fa-sitemap"></i> ${a.setor || '—'}</span>
          ${a.inicio ? `<span><i class="fa-solid fa-calendar"></i> ${a.inicio} → ${a.fim || '?'}</span>` : ''}
        </div>
        <div class="r180-item-badges">
          <span class="r180-badge r180-badge-tipo">${a.tipoLabel || a.tipo}</span>
          <span class="r180-badge r180-badge-ativo">${a.avaliados?.length || 0} avaliados</span>
          <span class="r180-badge" style="background:#f5f3ff;color:#5b21b6">${a.competencias?.length || 0} competências</span>
        </div>
      </div>
      <div class="r180-item-actions">
        <a href="responder-180.html?id=${a.id}" class="r180-btn-responder" title="Responder avaliação">
          <i class="fa-solid fa-pen-to-square"></i> Responder
        </a>
        <button class="r180-btn-icon edit" onclick="abrirFormulario(${a.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="r180-btn-icon del" onclick="removerAvaliacao180(${a.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

// =============================================
// AVALIADOS — MODAL COM CHECKBOXES
// =============================================
function abrirModalAvaliado() {
  // Atualizar título com nome do gestor
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const titulo = document.getElementById('modal-avaliado-titulo');
  if (titulo) titulo.textContent = gestorNome
    ? `Avaliados — Gestor(a) ${gestorNome}`
    : 'Avaliados';

  // Resetar checkbox "Selecionar Todos"
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = false;

  // Sempre começa na etapa 1
  const etapa1 = document.getElementById('modal-etapa-selecao');
  const etapa2 = document.getElementById('modal-etapa-lista');
  if (etapa1) etapa1.style.display = 'block';
  if (etapa2) etapa2.style.display = 'none';

  renderCheckLista();
  document.getElementById('modal-avaliado').classList.add('open');
}

function fecharModalAvaliado(e) {
  if (!e || e.target === document.getElementById('modal-avaliado')) {
    document.getElementById('modal-avaliado').classList.remove('open');
  }
}

function renderCheckLista() {
  const container = document.getElementById('modal-check-lista');
  if (!container) return;

  const empresa = document.getElementById('r180-empresa').value.trim();
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const setor = document.getElementById('r180-setor').value.trim();

  const estagiarios = getContatos().filter(c => c.tipo === 'estagiario');

  if (estagiarios.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum estagiário cadastrado.</p>';
    return;
  }

  container.innerHTML = estagiarios.map(e => {
    const jaSelecionado = r180Avaliados.find(a => a.id == e.id);
    return `
      <label class="r180-check-item ${jaSelecionado ? 'selecionado' : ''}"
             onclick="toggleCheckItem(this)">
        <div class="r180-check-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        <div class="r180-check-info">
          <div class="r180-check-nome">${e.nome}</div>
          <div class="r180-check-tags">
            ${empresa ? `<span class="r180-tag r180-tag-empresa">Empresa: <strong>${empresa}</strong></span>` : ''}
            ${gestorNome ? `<span class="r180-tag r180-tag-gestor">Gestor: <strong>${gestorNome}</strong></span>` : ''}
            ${setor ? `<span class="r180-tag r180-tag-setor">Dpto: <strong>${setor}</strong></span>` : ''}
          </div>
        </div>
        <input type="checkbox" value="${e.id}" ${jaSelecionado ? 'checked' : ''}
               onclick="event.stopPropagation()">
      </label>`;
  }).join('');
}

function toggleCheckItem(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('selecionado', cb.checked);

  // Atualizar "Selecionar Todos"
  const todos = document.querySelectorAll('#modal-check-lista input[type="checkbox"]');
  const marcados = document.querySelectorAll('#modal-check-lista input[type="checkbox"]:checked');
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = todos.length > 0 && todos.length === marcados.length;
}

function toggleSelecionarTodos(cb) {
  document.querySelectorAll('#modal-check-lista .r180-check-item').forEach(item => {
    const input = item.querySelector('input[type="checkbox"]');
    input.checked = cb.checked;
    item.classList.toggle('selecionado', cb.checked);
  });
}

function confirmarAvaliados() {
  const empresa = document.getElementById('r180-empresa').value.trim();
  const gestorSelect = document.getElementById('r180-gestor');
  const gestorNome = gestorSelect.options[gestorSelect.selectedIndex]?.text || '';
  const setor = document.getElementById('r180-setor').value.trim();

  const selecionados = document.querySelectorAll('#modal-check-lista input[type="checkbox"]:checked');

  selecionados.forEach(cb => {
    const id = parseInt(cb.value);
    if (r180Avaliados.find(a => a.id == id)) return;

    const pessoa = getContatos().find(c => c.id == id);
    if (!pessoa) return;

    r180Avaliados.push({
      id: pessoa.id,
      nome: pessoa.nome,
      empresa,
      gestor: gestorNome,
      setor,
      cargo: '',
    });
  });

  renderAvaliados();

  // Ir para etapa 2 (lista de confirmados)
  document.getElementById('modal-etapa-selecao').style.display = 'none';
  document.getElementById('modal-etapa-lista').style.display = 'block';
  renderListaConfirmados();

  const qtd = selecionados.length;
  if (qtd > 0) showToast(`${qtd} avaliado${qtd > 1 ? 's' : ''} adicionado${qtd > 1 ? 's' : ''}!`);
}

function voltarParaSelecao() {
  document.getElementById('modal-etapa-lista').style.display = 'none';
  document.getElementById('modal-etapa-selecao').style.display = 'block';
  renderCheckLista();
}

function renderListaConfirmados() {
  const container = document.getElementById('modal-lista-confirmados');
  if (!container) return;

  if (r180Avaliados.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum avaliado adicionado.</p>';
    return;
  }

  container.innerHTML = r180Avaliados.map(a => `
    <div class="r180-check-item-confirmed">
      <div class="r180-check-avatar">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="r180-check-info">
        <div class="r180-check-nome">${a.nome}</div>
        <div class="r180-check-tags">
          ${a.empresa ? `<span class="r180-tag">Empresa: <strong>${a.empresa}</strong></span>` : ''}
          ${a.gestor ? `<span class="r180-tag">Gestor: <strong>${a.gestor}</strong></span>` : ''}
          ${a.setor ? `<span class="r180-tag">Dpto: <strong>${a.setor}</strong></span>` : ''}
          ${a.cargo ? `<span class="r180-tag">Cargo: <strong>${a.cargo}</strong></span>` : ''}
        </div>
      </div>
      <div class="r180-confirmed-actions">
        <button class="r180-btn-icon edit" onclick="editarAvaliado(${a.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="r180-btn-icon del" onclick="removerAvaliadoModal(${a.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

function removerAvaliadoModal(id) {
  r180Avaliados = r180Avaliados.filter(a => a.id != id);
  renderListaConfirmados();
  renderAvaliados();
  showToast('Avaliado removido.');
}

function pedirConfirmacaoEdicao() {
  document.getElementById('modal-confirmar-edicao').classList.add('open');
}

function fecharConfirmacaoEdicao(e) {
  if (!e || e.target === document.getElementById('modal-confirmar-edicao')) {
    document.getElementById('modal-confirmar-edicao').classList.remove('open');
  }
}

function salvarEdicaoAvaliado() {
  const id = parseInt(document.getElementById('edit-av-id').value);
  const av = r180Avaliados.find(a => a.id == id);
  if (!av) return;

  av.nome       = document.getElementById('edit-av-nome').value.trim();
  av.ra         = document.getElementById('edit-av-ra').value.trim();
  av.cpf        = document.getElementById('edit-av-cpf').value.trim();
  av.email      = document.getElementById('edit-av-email').value.trim();
  av.nascimento = document.getElementById('edit-av-nascimento').value;
  av.genero     = document.getElementById('edit-av-genero').value;
  av.cargo      = document.getElementById('edit-av-cargo').value.trim();
  av.setor      = document.getElementById('edit-av-departamento').value.trim();
  av.empresa    = document.getElementById('edit-av-empresa').value.trim();
  av.gestor     = document.getElementById('edit-av-gestor').value;

  // Fechar ambos os modais
  document.getElementById('modal-confirmar-edicao').classList.remove('open');
  document.getElementById('modal-editar-avaliado').classList.remove('open');

  renderListaConfirmados();
  renderAvaliados();
  showToast('Avaliado atualizado com sucesso!');
}

function fecharModalEditarAvaliado(e) {
  if (!e || e.target === document.getElementById('modal-editar-avaliado')) {
    document.getElementById('modal-editar-avaliado').classList.remove('open');
  }
}

function editarAvaliado(id) {
  const av = r180Avaliados.find(a => a.id == id);
  if (!av) return;

  // Preencher o modal de edição
  document.getElementById('edit-av-id').value = id;
  document.getElementById('edit-av-nome').value = av.nome || '';
  document.getElementById('edit-av-ra').value = av.ra || '';
  document.getElementById('edit-av-cpf').value = av.cpf || '';
  document.getElementById('edit-av-email').value = av.email || '';
  document.getElementById('edit-av-nascimento').value = av.nascimento || '';
  document.getElementById('edit-av-genero').value = av.genero || '';
  document.getElementById('edit-av-cargo').value = av.cargo || '';
  document.getElementById('edit-av-departamento').value = av.setor || '';
  document.getElementById('edit-av-empresa').value = av.empresa || '';

  // Popular select de gestor
  const gestorSelect = document.getElementById('edit-av-gestor');
  const professores = getContatos().filter(c => c.tipo === 'professor');
  gestorSelect.innerHTML = '<option value="">Selecione...</option>' +
    professores.map(p => `<option value="${p.nome}" ${p.nome === av.gestor ? 'selected' : ''}>${p.nome}</option>`).join('');

  document.getElementById('modal-editar-avaliado').classList.add('open');
}

function abrirCriarAvaliado() {
  fecharModalAvaliado();
  window.open('cadastrar.html', '_blank');
}

function removerAvaliado(id) {
  r180Avaliados = r180Avaliados.filter(a => a.id != id);
  renderAvaliados();
}

function renderAvaliados() {
  const container = document.getElementById('r180-avaliados-lista');
  if (!container) return;

  if (r180Avaliados.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhum avaliado adicionado.</p>';
    return;
  }

  container.innerHTML = r180Avaliados.map(a => `
    <div class="r180-avaliado-item">
      <div class="r180-avaliado-avatar">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="r180-avaliado-info">
        <div class="r180-avaliado-nome">${a.nome}</div>
        <div class="r180-avaliado-tags">
          ${a.empresa ? `<span class="r180-tag">Empresa: <strong>${a.empresa}</strong></span>` : ''}
          ${a.gestor ? `<span class="r180-tag">Gestor: <strong>${a.gestor}</strong></span>` : ''}
          ${a.setor ? `<span class="r180-tag">Dpto: <strong>${a.setor}</strong></span>` : ''}
          ${a.cargo ? `<span class="r180-tag">Cargo: <strong>${a.cargo}</strong></span>` : ''}
        </div>
      </div>
      <button class="r180-btn-icon del" onclick="removerAvaliado(${a.id})" title="Remover">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`).join('');
}

// =============================================
// COMPETÊNCIAS VINCULADAS
// =============================================
function abrirModalCompetencia() {
  document.getElementById('modal-comp-busca').value = '';
  renderCompetenciasModal('');
  document.getElementById('modal-competencia').classList.add('open');
}

function fecharModalCompetencia(e) {
  if (!e || e.target === document.getElementById('modal-competencia')) {
    document.getElementById('modal-competencia').classList.remove('open');
  }
}

function filtrarCompetenciasModal(busca) {
  renderCompetenciasModal(busca.toLowerCase());
}

function renderCompetenciasModal(busca) {
  const container = document.getElementById('modal-comp-lista');
  if (!container) return;

  let comps = getCompetencias();
  if (busca) {
    comps = comps.filter(c =>
      c.nome.toLowerCase().includes(busca) ||
      (c.descricao || '').toLowerCase().includes(busca)
    );
  }

  if (comps.length === 0) {
    container.innerHTML = `
      <div class="r180-comp-empty">
        <div class="r180-comp-empty-icon">
          <i class="fa-solid fa-circle-question"></i>
        </div>
        <div class="r180-comp-empty-text">
          <strong>Nenhuma competência selecionada</strong>
          <span>Selecione uma ou mais competências na barra de pesquisa para criar uma nova avaliação.</span>
        </div>
      </div>`;
    return;
  }

  const tipoLabel = { desempenho: 'Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };

  container.innerHTML = comps.map(c => {
    const jaSelecionada = r180Competencias.find(x => x.id == c.id);
    return `
      <label class="r180-comp-check-item ${jaSelecionada ? 'selecionado' : ''}"
             onclick="toggleCompCheck(this)">
        <div class="r180-comp-check-icon">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div class="r180-comp-check-info">
          <div class="r180-comp-check-nome">${c.nome}</div>
          ${c.tipo ? `<div class="r180-comp-check-desc">${tipoLabel[c.tipo] || c.tipo}${c.descricao ? ' — ' + c.descricao : ''}</div>` : ''}
        </div>
        <input type="checkbox" value="${c.id}" ${jaSelecionada ? 'checked' : ''}
               onclick="event.stopPropagation()">
      </label>`;
  }).join('');
}

function toggleCompCheck(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('selecionado', cb.checked);
}

function confirmarCompetencias() {
  const selecionados = document.querySelectorAll('#modal-comp-lista input[type="checkbox"]:checked');

  selecionados.forEach(cb => {
    const id = parseInt(cb.value);
    if (r180Competencias.find(c => c.id == id)) return;

    const comp = getCompetencias().find(c => c.id == id);
    if (!comp) return;

    r180Competencias.push({ id: comp.id, nome: comp.nome, tipo: comp.tipo, descricao: comp.descricao });
  });

  renderCompetenciasVinculadas();
  fecharModalCompetencia();

  const qtd = selecionados.length;
  if (qtd > 0) showToast(`${qtd} competência${qtd > 1 ? 's' : ''} adicionada${qtd > 1 ? 's' : ''}!`);
}

function irParaCriarCompetencia() {
  fecharModalCompetencia();
  window.open('competencias.html', '_blank');
}

function removerCompetenciaVinculada(id) {
  r180Competencias = r180Competencias.filter(c => c.id != id);
  renderCompetenciasVinculadas();
}

function renderCompetenciasVinculadas() {
  const container = document.getElementById('r180-competencias-lista');
  if (!container) return;

  if (r180Competencias.length === 0) {
    container.innerHTML = '<p class="r180-empty-small">Nenhuma competência adicionada.</p>';
    return;
  }

  const tipoLabel = { desempenho: 'Competência de Desempenho', comportamento: 'Comportamento', tecnica: 'Técnica', lideranca: 'Liderança' };

  container.innerHTML = r180Competencias.map(c => `
    <div class="r180-comp-item">
      <div class="r180-comp-icon"><i class="fa-solid fa-chart-line"></i></div>
      <div class="r180-comp-info">
        <div class="r180-comp-nome">${c.nome}</div>
        ${c.tipo ? `<span class="r180-comp-badge">${tipoLabel[c.tipo] || c.tipo}</span>` : ''}
        ${c.descricao ? `<div class="r180-comp-desc">${c.descricao}</div>` : ''}
      </div>
      <div class="r180-comp-actions">
        <button class="r180-btn-icon del" onclick="removerCompetenciaVinculada(${c.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

// ---- FECHAR MODAIS COM ESC ----
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModalAvaliado();
    fecharModalCompetencia();
  }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderLista180();
});
