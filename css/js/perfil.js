// =============================================
// PERFIL.JS
// =============================================

const CRITERIOS_LABEL = {
  pontualidade: 'Pontualidade',
  comunicacao:  'Comunicação',
  tecnico:      'Desempenho Técnico',
  proatividade: 'Proatividade',
  equipe:       'Trabalho em Equipe',
};

// ---- STORAGE ----
function getPerfil() {
  return JSON.parse(localStorage.getItem('perfilLogado') || 'null');
}

function savePerfil(dados) {
  localStorage.setItem('perfilLogado', JSON.stringify(dados));
}

function clearPerfil() {
  localStorage.removeItem('perfilLogado');
}

// ---- LOGIN ----
function entrar() {
  const emailInput = document.getElementById('login-email');
  const senhaInput = document.getElementById('login-senha');
  const email = emailInput?.value.trim().toLowerCase();
  const senha = senhaInput?.value.trim();

  if (!email) {
    showToast('Digite seu e-mail acadêmico.', 'error');
    return;
  }

  if (!senha) {
    showToast('Digite sua senha.', 'error');
    return;
  }

  // Validação de e-mail acadêmico
  const emailAcademico = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|edu\.br|ac\.br|ifsp\.edu\.br|usp\.br|unicamp\.br|unesp\.br|ufmg\.br|ufsc\.br|ufrj\.br|unb\.br|ufpr\.br|ufba\.br|ufpe\.br|ufc\.br|ufam\.br|ufpa\.br|ufes\.br|ufg\.br|ufms\.br|ufmt\.br|ufpb\.br|ufrn\.br|ufal\.br|ufpi\.br|ufrr\.br|ufro\.br|ufac\.br|ufap\.br|uft\.br|furg\.br|ufpel\.br|ufsm\.br|ufcspa\.br|utfpr\.br|cefet|fatec|etec|senai|senac|fiap|fei|mackenzie|puc|unifesp|unifei|unifal|unifap|unir|unirio|ufop|ufv|ufjf|ufsj|ufla|uftm|unimontes|uemg|ufob|ufca|ufnt|ufr|ufcat|ufopa|unifesspa|unipampa|uffs|ufcspa)(\.[a-zA-Z]{2,})?$/i;

  if (!emailAcademico.test(email)) {
    showToast('Use um e-mail acadêmico institucional (ex: nome@universidade.edu.br).', 'error');
    return;
  }

  // Busca a pessoa pelo e-mail
  const contatos = getContatos();
  const pessoa = contatos.find(c => c.email.toLowerCase() === email);

  if (!pessoa) {
    showToast('E-mail não encontrado. Verifique ou peça para ser cadastrado.', 'error');
    return;
  }

  // Verifica senha — compatível com senhas antigas (sem hash) e novas (btoa)
  if (pessoa.senha) {
    const senhaHash = btoa(senha + 'portal_estagio_salt');
    // Tenta comparar com hash; se não bater, tenta comparação direta (senhas antigas)
    const senhaValida = (pessoa.senha === senhaHash) || (pessoa.senha === senha);
    if (!senhaValida) {
      showToast('Senha incorreta.', 'error');
      return;
    }
  }

  // Salva sessão
  savePerfil({ id: pessoa.id });
  mostrarPerfil(pessoa);
}

// ---- SAIR ----
function sair() {
  clearPerfil();
  document.getElementById('tela-perfil').style.display = 'none';
  document.getElementById('tela-login').style.display = 'block';
  document.getElementById('login-email').value = '';
  const senhaEl = document.getElementById('login-senha');
  if (senhaEl) senhaEl.value = '';
}

// ---- MOSTRAR PERFIL ----
function mostrarPerfil(pessoa) {
  document.getElementById('tela-login').style.display = 'none';
  document.getElementById('tela-perfil').style.display = 'flex';

  // Foto
  const fotoEl = document.getElementById('pf-foto-preview');
  const iniciaisEl = document.getElementById('pf-foto-iniciais');
  const iniciais = pessoa.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  if (pessoa.foto) {
    iniciaisEl.style.display = 'none';
    // remove img anterior se existir
    fotoEl.querySelectorAll('img').forEach(el => el.remove());
    const img = document.createElement('img');
    img.src = pessoa.foto;
    img.alt = pessoa.nome;
    fotoEl.insertBefore(img, fotoEl.querySelector('.pf-foto-overlay'));
  } else {
    iniciaisEl.textContent = iniciais;
  }

  // Nome e tipo
  document.getElementById('pf-nome-display').textContent = pessoa.nome;
  const badge = document.getElementById('pf-tipo-badge');
  badge.textContent = pessoa.tipo === 'professor' ? 'Professor' : 'Estagiário';
  badge.className = `pg-badge pf-tipo-badge ${pessoa.tipo}`;

  // Campos de edição
  document.getElementById('pf-nome').value = pessoa.nome;
  document.getElementById('pf-email').value = pessoa.email;

  const campoDis = document.getElementById('pf-campo-disciplina');
  if (campoDis) campoDis.style.display = pessoa.tipo === 'professor' ? 'block' : 'none';
  if (pessoa.tipo === 'professor') {
    const disc = document.getElementById('pf-disciplina');
    if (disc) disc.value = pessoa.disciplina || '';
  }

  document.getElementById('pf-bio').value = pessoa.bio || '';

  // Stats
  renderStats(pessoa);

  // Avaliações
  renderAvaliacoesPerfil(pessoa);

  // Seção de dados — apenas para professores
  const dadosSection = document.getElementById('pf-dados-section');
  if (dadosSection) {
    dadosSection.style.display = pessoa.tipo === 'professor' ? 'block' : 'none';
  }
}

// ---- STATS ----
function renderStats(pessoa) {
  const container = document.getElementById('pf-stats');
  if (!container) return;

  const avaliacoes = getAvaliacoes().filter(a =>
    a.avaliado.toLowerCase() === pessoa.nome.toLowerCase()
  );

  const total = avaliacoes.length;
  const media = total > 0
    ? (avaliacoes.reduce((s, a) => s + a.media, 0) / total).toFixed(1)
    : null;

  container.innerHTML = `
    <div class="pf-stat">
      <span class="pf-stat-label">Avaliações recebidas</span>
      <span class="pf-stat-valor">${total}</span>
    </div>
    <div class="pf-stat">
      <span class="pf-stat-label">Média geral</span>
      <span class="pf-stat-valor ${media ? 'stars' : ''}">${media ? media + ' ★' : '—'}</span>
    </div>
    <div class="pf-stat">
      <span class="pf-stat-label">Tipo</span>
      <span class="pf-stat-valor">${pessoa.tipo === 'professor' ? 'Professor' : 'Estagiário'}</span>
    </div>
  `;
}

// ---- AVALIAÇÕES DO PERFIL ----
function renderAvaliacoesPerfil(pessoa) {
  const container = document.getElementById('pf-avaliacoes-lista');
  if (!container) return;

  // Filtra apenas avaliações recebidas por esta pessoa
  const avaliacoes = getAvaliacoes()
    .filter(a => a.avaliado.toLowerCase() === pessoa.nome.toLowerCase())
    .reverse();

  if (avaliacoes.length === 0) {
    container.innerHTML = '<p class="pg-empty">Nenhuma avaliação recebida ainda.</p>';
    return;
  }

  container.innerHTML = avaliacoes.map(a => {
    const badges = Object.entries(a.criterios || {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `
        <span class="pf-av-badge">
          ${CRITERIOS_LABEL[k] || k}
          <span class="mini-stars">${'★'.repeat(v)}</span>
        </span>
      `).join('');

    return `
      <div class="pf-av-item">
        <div class="pf-av-header">
          <span class="pf-av-media">Média: ${a.media} ★</span>
          <span class="pf-av-data">${a.data}</span>
        </div>
        <div class="pf-av-criterios">${badges}</div>
        ${a.comentario ? `<p class="pf-av-comentario">"${a.comentario}"</p>` : ''}
      </div>
    `;
  }).join('');
}

// ---- TROCAR FOTO ----
function trocarFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const novaFoto = e.target.result;

    // Atualiza visual
    const fotoEl = document.getElementById('pf-foto-preview');
    document.getElementById('pf-foto-iniciais').style.display = 'none';
    fotoEl.querySelectorAll('img').forEach(el => el.remove());
    const img = document.createElement('img');
    img.src = novaFoto;
    img.alt = 'Foto';
    fotoEl.insertBefore(img, fotoEl.querySelector('.pf-foto-overlay'));

    // Salva no contato
    const sessao = getPerfil();
    if (!sessao) return;
    const contatos = getContatos();
    const idx = contatos.findIndex(c => c.id === sessao.id);
    if (idx !== -1) {
      contatos[idx].foto = novaFoto;
      saveContatos(contatos);
      showToast('Foto atualizada!');
    }
  };
  reader.readAsDataURL(file);
}

// ---- SALVAR PERFIL ----
function salvarPerfil() {
  const sessao = getPerfil();
  if (!sessao) return;

  const nome = document.getElementById('pf-nome')?.value.trim();
  if (!nome) { showToast('O nome não pode ficar vazio.', 'error'); return; }

  const contatos = getContatos();
  const idx = contatos.findIndex(c => c.id === sessao.id);
  if (idx === -1) return;

  const pessoa = contatos[idx];

  const novaSenha = document.getElementById('pf-senha')?.value.trim();
  if (novaSenha && novaSenha.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }

  // Hash da nova senha se fornecida
  const senhaFinal = novaSenha ? btoa(novaSenha + 'portal_estagio_salt') : pessoa.senha;

  contatos[idx] = {
    ...pessoa,
    nome,
    senha: senhaFinal,
    disciplina: pessoa.tipo === 'professor'
      ? (document.getElementById('pf-disciplina')?.value.trim() || '')
      : pessoa.disciplina,
    bio: document.getElementById('pf-bio')?.value.trim() || '',
  };

  saveContatos(contatos);

  // Atualiza display
  document.getElementById('pf-nome-display').textContent = nome;
  showToast('Perfil salvo com sucesso!');
}

// ---- TABS ----
function setTab(tab) {
  document.querySelectorAll('.pf-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('tab-dados').style.display = tab === 'dados' ? 'block' : 'none';
  document.getElementById('tab-avaliacoes').style.display = tab === 'avaliacoes' ? 'block' : 'none';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const sessao = getPerfil();
  if (sessao) {
    const contatos = getContatos();
    const pessoa = contatos.find(c => c.id === sessao.id);
    if (pessoa) {
      mostrarPerfil(pessoa);
      return;
    }
    clearPerfil();
  }
  // Mostra login
  document.getElementById('tela-login').style.display = 'block';
});
