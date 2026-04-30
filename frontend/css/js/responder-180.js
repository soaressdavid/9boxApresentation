// =============================================
// RESPONDER-180.JS — Formulário de resposta
// =============================================

// Notas selecionadas: { compId_criterioIdx: nota }
const notasSelecionadas = {};

function getRespostas180() {
  return JSON.parse(localStorage.getItem('respostas180') || '[]');
}

function saveRespostas180(data) {
  localStorage.setItem('respostas180', JSON.stringify(data));
}

function selecionarNota(compId, criterioIdx, nota, btn) {
  const chave = `${compId}_${criterioIdx}`;
  notasSelecionadas[chave] = nota;

  // Atualizar visual — desmarcar irmãos, marcar este
  const grupo = btn.closest('.resp180-notas');
  if (grupo) {
    grupo.querySelectorAll('.resp180-nota-btn').forEach(b => b.classList.remove('selected'));
  }
  btn.classList.add('selected');
}

function renderFormulario(avaliacao, respondente) {
  const container = document.getElementById('resp180-container');
  if (!container) return;

  if (!avaliacao) {
    container.innerHTML = `
      <div class="resp180-erro">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h3>Avaliação não encontrada</h3>
        <p>O ID informado não corresponde a nenhuma avaliação 180° cadastrada.</p>
        <a href="avaliacao-180.html" style="color:var(--primary-light);font-weight:600">← Voltar para lista</a>
      </div>`;
    return;
  }

  const competencias = avaliacao.competencias || [];

  if (competencias.length === 0) {
    container.innerHTML = `
      <div class="resp180-erro">
        <i class="fa-solid fa-clipboard-list"></i>
        <h3>Sem competências</h3>
        <p>Esta avaliação não possui competências vinculadas.</p>
        <a href="avaliacao-180.html" style="color:var(--primary-light);font-weight:600">← Voltar para lista</a>
      </div>`;
    return;
  }

  const nomeRespondente = respondente ? respondente.nome : 'Visitante';
  const tipoRespondente = respondente ? (respondente.tipo === 'professor' ? 'Professor' : 'Estagiário') : 'Não identificado';

  const notasLabels = [
    { nota: 1, label: 'Não cumpre', cor: 'n1' },
    { nota: 2, label: 'Cumpre moderadamente', cor: 'n2' },
    { nota: 3, label: 'Cumpre sempre', cor: 'n3' },
    { nota: 4, label: 'Supera expectativas', cor: 'n4' },
  ];

  const legendaHTML = `
    <div class="resp180-legenda">
      ${notasLabels.map(n => `
        <div class="resp180-legenda-item">
          <div class="resp180-legenda-dot ${n.cor}"></div>
          <span>Nota ${n.nota}: ${n.label}</span>
        </div>
      `).join('')}
    </div>`;

  const headerHTML = `
    <div class="resp180-header-card">
      <div class="resp180-header-icon">
        <i class="fa-solid fa-rotate"></i>
      </div>
      <div class="resp180-header-info">
        <h2 class="resp180-header-nome">${avaliacao.nome}</h2>
        <div class="resp180-header-meta">
          ${avaliacao.empresa ? `<span><i class="fa-solid fa-building"></i> ${avaliacao.empresa}</span>` : ''}
          ${avaliacao.gestor ? `<span><i class="fa-solid fa-user-tie"></i> ${avaliacao.gestor}</span>` : ''}
          ${avaliacao.setor ? `<span><i class="fa-solid fa-sitemap"></i> ${avaliacao.setor}</span>` : ''}
        </div>
        <div class="resp180-respondente">
          <i class="fa-solid fa-circle-user"></i>
          Respondendo como: <strong>${nomeRespondente}</strong> (${tipoRespondente})
        </div>
      </div>
    </div>`;

  const competenciasHTML = competencias.map(comp => {
    const criterios = comp.criterios || [];

    // Se não há critérios definidos, usar 4 critérios genéricos
    const criteriosList = criterios.length > 0
      ? criterios
      : [
          'Demonstra conhecimento e aplicação prática',
          'Comunica-se de forma clara e objetiva',
          'Cumpre prazos e entregas com qualidade',
          'Colabora com a equipe e busca melhorias',
        ];

    const criteriosHTML = criteriosList.map((criterio, idx) => `
      <div class="resp180-criterio">
        <div class="resp180-criterio-texto">${idx + 1}. ${criterio || `Critério ${idx + 1}`}</div>
        <div class="resp180-notas">
          <button class="resp180-nota-btn" data-nota="1"
            onclick="selecionarNota(${comp.id}, ${idx}, 1, this)">
            <i class="fa-solid fa-circle-xmark"></i> 1 — Não cumpre
          </button>
          <button class="resp180-nota-btn" data-nota="2"
            onclick="selecionarNota(${comp.id}, ${idx}, 2, this)">
            <i class="fa-solid fa-circle-minus"></i> 2 — Moderadamente
          </button>
          <button class="resp180-nota-btn" data-nota="3"
            onclick="selecionarNota(${comp.id}, ${idx}, 3, this)">
            <i class="fa-solid fa-circle-check"></i> 3 — Cumpre sempre
          </button>
          <button class="resp180-nota-btn" data-nota="4"
            onclick="selecionarNota(${comp.id}, ${idx}, 4, this)">
            <i class="fa-solid fa-star"></i> 4 — Supera
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div class="resp180-comp-card" data-comp-id="${comp.id}">
        <h3 class="resp180-comp-titulo">
          <i class="fa-solid fa-chart-line"></i>
          ${comp.nome}
        </h3>
        ${comp.descricao ? `<p class="resp180-comp-desc">${comp.descricao}</p>` : ''}
        ${criteriosHTML}
        <label class="resp180-comentario-label">
          <i class="fa-regular fa-comment"></i> Comentário sobre esta competência (opcional)
        </label>
        <textarea class="resp180-comentario-input"
          id="comentario-comp-${comp.id}"
          placeholder="Adicione um comentário sobre ${comp.nome}..."></textarea>
      </div>`;
  }).join('');

  container.innerHTML = `
    ${headerHTML}
    ${legendaHTML}
    ${competenciasHTML}
    <div class="resp180-actions">
      <a href="avaliacao-180.html" style="
        display:inline-flex;align-items:center;gap:8px;
        padding:12px 20px;border-radius:var(--radius-sm);
        border:1.5px solid var(--border);color:var(--text-muted);
        font-size:14px;font-weight:500;text-decoration:none;
        transition:all 0.2s;
      " onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
        <i class="fa-solid fa-arrow-left"></i> Voltar
      </a>
      <button class="resp180-btn-enviar" onclick="enviarRespostas()">
        <i class="fa-solid fa-paper-plane"></i> Enviar Respostas
      </button>
    </div>`;
}

function enviarRespostas() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const avaliacoes180 = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
  const avaliacao = avaliacoes180.find(a => a.id === id);

  if (!avaliacao) {
    showToast('Avaliação não encontrada.', 'error');
    return;
  }

  const competencias = avaliacao.competencias || [];
  const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
  const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  // Montar respostas por competência
  const respostasComp = competencias.map(comp => {
    const criterios = comp.criterios || [];
    const qtdCriterios = criterios.length > 0 ? criterios.length : 4;

    const notas = [];
    for (let i = 0; i < qtdCriterios; i++) {
      const chave = `${comp.id}_${i}`;
      notas.push(notasSelecionadas[chave] || null);
    }

    const notasValidas = notas.filter(n => n !== null);
    const media = notasValidas.length > 0
      ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2)
      : null;

    const comentario = document.getElementById(`comentario-comp-${comp.id}`)?.value.trim() || '';

    return {
      compId: comp.id,
      compNome: comp.nome,
      notas,
      media,
      comentario,
    };
  });

  // Verificar se pelo menos uma nota foi dada
  const algumaNota = respostasComp.some(r => r.notas.some(n => n !== null));
  if (!algumaNota) {
    showToast('Selecione pelo menos uma nota antes de enviar.', 'error');
    return;
  }

  const registro = {
    id: Date.now(),
    avaliacaoId: id,
    avaliacaoNome: avaliacao.nome,
    empresa: avaliacao.empresa || '',
    respondente: respondente ? respondente.nome : 'Anônimo',
    respondenteId: respondente ? respondente.id : null,
    respostas: respostasComp,
    data: new Date().toLocaleDateString('pt-BR'),
    dataISO: new Date().toISOString(),
  };

  const respostas = getRespostas180();
  respostas.push(registro);
  saveRespostas180(respostas);

  // Mostrar tela de sucesso
  const container = document.getElementById('resp180-container');
  if (container) {
    container.innerHTML = `
      <div class="resp180-sucesso">
        <i class="fa-solid fa-circle-check"></i>
        <h3>Respostas enviadas com sucesso!</h3>
        <p>Suas respostas para a avaliação <strong>${avaliacao.nome}</strong> foram registradas.</p>
        <a href="avaliacao-180.html" style="
          display:inline-flex;align-items:center;gap:8px;
          padding:12px 24px;border-radius:var(--radius-sm);
          background:var(--primary);color:white;
          font-size:14px;font-weight:600;text-decoration:none;
          transition:all 0.2s;
        ">
          <i class="fa-solid fa-arrow-left"></i> Voltar para Avaliações 180°
        </a>
      </div>`;
  }

  showToast('Respostas enviadas!');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  const avaliacoes180 = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
  const avaliacao = avaliacoes180.find(a => a.id === id) || null;

  const sessao = JSON.parse(localStorage.getItem('perfilLogado') || 'null');
  const contatos = JSON.parse(localStorage.getItem('contatos') || '[]');
  const respondente = sessao ? contatos.find(c => c.id === sessao.id) : null;

  renderFormulario(avaliacao, respondente);
});
