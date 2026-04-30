// =============================================
// PAGES.JS — Cadastrar, Consultar, Relatórios
// =============================================

// ---- CADASTRAR ----

let tipoCadAtual = 'estagiario';
let fotoBase64 = null;

function setTipoCad(tipo) {
  tipoCadAtual = tipo;

  document.querySelectorAll('.pg-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === tipo);
  });

  const campoDisciplina = document.getElementById('campo-disciplina');
  if (campoDisciplina) campoDisciplina.style.display = tipo === 'professor' ? 'block' : 'none';
}

function previewFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fotoBase64 = e.target.result;
    const preview = document.getElementById('foto-preview');
    if (!preview) return;

    // remove ícone/texto anteriores e mostra a imagem
    preview.innerHTML = `
      <img src="${fotoBase64}" alt="Foto">
      <div class="pg-foto-overlay">
        <i class="fa-solid fa-camera"></i>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function cadastrarPessoa() {
  const nome = document.getElementById('cad-nome')?.value.trim();
  const email = document.getElementById('cad-email')?.value.trim();
  const senha = document.getElementById('cad-senha')?.value.trim();
  const disciplina = document.getElementById('cad-disciplina')?.value.trim();

  if (!nome) { showToast('Digite o nome completo.', 'error'); return; }
  if (!email) { showToast('Digite o e-mail acadêmico.', 'error'); return; }

  // Validação de e-mail acadêmico
  const emailAcademico = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|edu\.br|ac\.br|ifsp\.edu\.br|usp\.br|unicamp\.br|unesp\.br|ufmg\.br|ufsc\.br|ufrj\.br|unb\.br|ufpr\.br|ufba\.br|ufpe\.br|ufc\.br|ufam\.br|ufpa\.br|ufes\.br|ufg\.br|ufms\.br|ufmt\.br|ufpb\.br|ufrn\.br|ufal\.br|ufpi\.br|ufrr\.br|ufro\.br|ufac\.br|ufap\.br|uft\.br|furg\.br|ufpel\.br|ufsm\.br|ufcspa\.br|utfpr\.br|cefet|fatec|etec|senai|senac|fiap|fei|mackenzie|puc|unifesp|unifei|unifal|unifap|unir|unirio|ufop|ufv|ufjf|ufsj|ufla|uftm|unimontes|uemg|ufob|ufca|ufnt|ufr|ufcat|ufopa|unifesspa|unipampa|uffs|ufcspa)(\.[a-zA-Z]{2,})?$/i;

  if (!emailAcademico.test(email)) {
    showToast('Use um e-mail acadêmico institucional (ex: nome@universidade.edu.br).', 'error');
    return;
  }

  if (!senha) { showToast('Crie uma senha.', 'error'); return; }
  if (senha.length < 6) { showToast('A senha deve ter pelo menos 6 caracteres.', 'error'); return; }

  // Verificar se e-mail já cadastrado
  const contatos = getContatos();
  if (contatos.find(c => c.email.toLowerCase() === email.toLowerCase())) {
    showToast('Este e-mail já está cadastrado.', 'error');
    return;
  }

  // Hash simples da senha com btoa + salt
  const senhaHash = btoa(senha + 'portal_estagio_salt');

  contatos.push({
    id: Date.now(),
    nome,
    email,
    senha: senhaHash,
    tipo: tipoCadAtual,
    disciplina: tipoCadAtual === 'professor' ? disciplina : '',
    foto: fotoBase64 || null,
  });
  saveContatos(contatos);

  // reset
  document.getElementById('cad-nome').value = '';
  document.getElementById('cad-email').value = '';
  if (document.getElementById('cad-senha')) document.getElementById('cad-senha').value = '';
  if (document.getElementById('cad-disciplina')) document.getElementById('cad-disciplina').value = '';

  // reset foto
  fotoBase64 = null;
  const preview = document.getElementById('foto-preview');
  if (preview) {
    preview.innerHTML = `<i class="fa-solid fa-camera"></i><span>Adicionar foto</span>`;
  }
  document.getElementById('cad-foto').value = '';

  showToast('Cadastrado com sucesso!');
}

// ---- CONSULTAR ----

let filtroConsulta = 'todos';

function filtrarPessoas(tipo) {
  if (tipo !== undefined) {
    filtroConsulta = tipo;
    document.querySelectorAll('.pg-filtro').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filtro === tipo);
    });
  }
  renderPessoas();
}

function renderPessoas() {
  const container = document.getElementById('lista-pessoas');
  if (!container) return;

  const busca = (document.getElementById('busca')?.value || '').toLowerCase();
  let contatos = getContatos();

  if (filtroConsulta !== 'todos') {
    contatos = contatos.filter(c => c.tipo === filtroConsulta);
  }

  if (busca) {
    contatos = contatos.filter(c => c.nome.toLowerCase().includes(busca));
  }

  if (contatos.length === 0) {
    container.innerHTML = '<p class="pg-empty">Nenhuma pessoa encontrada.</p>';
    return;
  }

  container.innerHTML = contatos.map(c => {
    const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    const sub = c.tipo === 'professor'
      ? (c.disciplina ? c.disciplina : c.email)
      : c.email;
    const tipoLabel = c.tipo === 'professor' ? 'Professor' : 'Estagiário';

    const avatarContent = c.foto
      ? `<img src="${c.foto}" alt="${c.nome}">`
      : iniciais;

    return `
      <div class="pg-pessoa-item">
        <div class="pg-avatar">${avatarContent}</div>
        <div class="pg-pessoa-info">
          <div class="pg-pessoa-nome">${c.nome}</div>
          <div class="pg-pessoa-sub">${sub}</div>
        </div>
        <span class="pg-badge ${c.tipo}">${tipoLabel}</span>
        <button class="btn-danger" onclick="removerPessoa(${c.id})" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

function removerPessoa(id) {
  if (!confirm('Tem certeza que deseja remover esta pessoa? Esta ação não pode ser desfeita.')) return;
  const contatos = getContatos().filter(c => c.id !== id);
  saveContatos(contatos);
  renderPessoas();
  showToast('Pessoa removida.');
}

// ---- RELATÓRIOS ----

let filtroRel = 'todos';

function filtrarRel(tipo) {
  if (tipo !== undefined) {
    filtroRel = tipo;
    document.querySelectorAll('.pg-filtro').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filtro === tipo);
    });
  }
  renderRelatorio();
}

function renderRelatorio() {
  renderResumo();
  renderTabela();
}

function renderResumo() {
  const container = document.getElementById('rel-resumo');
  if (!container) return;

  const contatos = getContatos();
  const avaliacoes = getAvaliacoes();
  const nineBox = JSON.parse(localStorage.getItem('nineBoxAvaliacoes') || '[]');
  const avaliacoes180 = JSON.parse(localStorage.getItem('avaliacoes180') || '[]');
  const respostas180 = JSON.parse(localStorage.getItem('respostas180') || '[]');

  const totalProf = avaliacoes.filter(a => a.tipo === 'professor').length;
  const totalEst = avaliacoes.filter(a => a.tipo === 'estagiario').length;
  const total = totalProf + totalEst;

  const medias = avaliacoes.map(a => a.media).filter(Boolean);
  const mediaGeral = medias.length
    ? (medias.reduce((a, b) => a + b, 0) / medias.length).toFixed(1)
    : '—';

  const superstars = nineBox.filter(n => n.categoria === 'Superstar').length;

  container.innerHTML = `
    <div class="rel-stat">
      <span class="rel-stat-label">Total de Avaliações</span>
      <span class="rel-stat-valor">${total}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Professores Avaliados</span>
      <span class="rel-stat-valor">${totalProf}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Estagiários Avaliados</span>
      <span class="rel-stat-valor">${totalEst}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Média Geral</span>
      <span class="rel-stat-valor">${mediaGeral}${medias.length ? ' ★' : ''}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">No Nine Box</span>
      <span class="rel-stat-valor">${nineBox.length}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Superstars</span>
      <span class="rel-stat-valor">${superstars}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Avaliações 180°</span>
      <span class="rel-stat-valor">${avaliacoes180.length}</span>
    </div>
    <div class="rel-stat">
      <span class="rel-stat-label">Respostas 180°</span>
      <span class="rel-stat-valor">${respostas180.length}</span>
    </div>
  `;
}

function renderTabela() {
  const tbody = document.getElementById('rel-tbody');
  if (!tbody) return;

  const busca = (document.getElementById('busca-rel')?.value || '').toLowerCase();
  let avaliacoes = getAvaliacoes().slice().reverse();

  if (filtroRel !== 'todos') {
    avaliacoes = avaliacoes.filter(a => a.tipo === filtroRel);
  }

  if (busca) {
    avaliacoes = avaliacoes.filter(a => a.avaliado.toLowerCase().includes(busca));
  }

  if (avaliacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="pg-empty">Nenhuma avaliação encontrada.</td></tr>';
  } else {
    const estrelas = n => n > 0
      ? `<span class="rel-estrelas">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`
      : '<span style="color:#ccc">—</span>';

    tbody.innerHTML = avaliacoes.map(a => {
      const c = a.criterios || {};
      const tipoLabel = a.tipo === 'professor' ? 'Professor' : 'Estagiário';

      if (a.tipoAvaliacao === 'comentario') {
        return `
          <tr>
            <td><strong>${a.avaliado}</strong></td>
            <td><span class="pg-badge ${a.tipo}">${tipoLabel}</span></td>
            <td colspan="3" style="color:var(--text-muted);font-style:italic;font-size:12px">${a.comentario || '—'}</td>
            <td>${a.data}</td>
          </tr>`;
      }

      return `
        <tr>
          <td><strong>${a.avaliado}</strong></td>
          <td><span class="pg-badge ${a.tipo}">${tipoLabel}</span></td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${estrelas(c.pontualidade || 0)}
              ${estrelas(c.comunicacao || 0)}
              ${estrelas(c.tecnico || 0)}
              ${estrelas(c.proatividade || 0)}
              ${estrelas(c.equipe || 0)}
            </div>
          </td>
          <td class="rel-media">${a.media} ★</td>
          ${a.comentario ? `<td style="font-size:12px;color:var(--text-muted);font-style:italic">"${a.comentario}"</td>` : '<td>—</td>'}
          <td>${a.data}</td>
        </tr>`;
    }).join('');
  }

  // ---- SEÇÃO 180° ----
  renderTabela180(busca);
}

function renderTabela180(busca) {
  // Criar ou localizar a seção de respostas 180°
  let secao180 = document.getElementById('rel-secao-180');
  const tableWrap = document.querySelector('.rel-table-wrap');
  if (!tableWrap) return;

  if (!secao180) {
    secao180 = document.createElement('div');
    secao180.id = 'rel-secao-180';
    tableWrap.after(secao180);
  }

  const respostas180 = JSON.parse(localStorage.getItem('respostas180') || '[]');
  let lista = respostas180.slice().reverse();

  if (busca) {
    lista = lista.filter(r =>
      (r.respondente || '').toLowerCase().includes(busca) ||
      (r.avaliacaoNome || '').toLowerCase().includes(busca)
    );
  }

  if (lista.length === 0) {
    secao180.innerHTML = `
      <h4 style="margin:28px 0 12px;font-size:15px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-rotate"></i> Avaliações 180° — Respostas
      </h4>
      <p class="pg-empty">Nenhuma resposta 180° registrada.</p>`;
    return;
  }

  const linhas = lista.map(r => {
    const respostas = r.respostas || [];
    const todasNotas = respostas.flatMap(rc => (rc.notas || []).filter(n => n !== null));
    const mediaGeral = todasNotas.length
      ? (todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length).toFixed(1)
      : '—';

    const compResumo = respostas.map(rc =>
      `<span style="font-size:11px;background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:100px;margin:2px;display:inline-block">
        ${rc.compNome}: ${rc.media ? rc.media + ' ★' : '—'}
      </span>`
    ).join('');

    return `
      <tr>
        <td><strong>${r.respondente || 'Anônimo'}</strong></td>
        <td style="font-size:12px;color:var(--text-muted)">${r.avaliacaoNome || '—'}</td>
        <td><div style="display:flex;flex-wrap:wrap;gap:2px">${compResumo}</div></td>
        <td class="rel-media">${mediaGeral !== '—' ? mediaGeral + ' ★' : '—'}</td>
        <td>${r.data || '—'}</td>
      </tr>`;
  }).join('');

  secao180.innerHTML = `
    <h4 style="margin:28px 0 12px;font-size:15px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:8px">
      <i class="fa-solid fa-rotate"></i> Avaliações 180° — Respostas
    </h4>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead>
          <tr>
            <th>Respondente</th>
            <th>Avaliação</th>
            <th>Competências</th>
            <th>Média Geral</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function exportarCSV() {
  const avaliacoes = getAvaliacoes();
  if (avaliacoes.length === 0) {
    showToast('Nenhuma avaliação para exportar.', 'error');
    return;
  }

  const linhas = [
    ['Avaliado', 'Tipo', 'Pontualidade', 'Comunicação', 'Técnico', 'Proatividade', 'Equipe', 'Média', 'Comentário', 'Data']
  ];

  avaliacoes.forEach(a => {
    const c = a.criterios || {};
    linhas.push([
      a.avaliado,
      a.tipo === 'professor' ? 'Professor' : 'Estagiário',
      c.pontualidade || '',
      c.comunicacao || '',
      c.tecnico || '',
      c.proatividade || '',
      c.equipe || '',
      a.media || '',
      a.comentario || '',
      a.data
    ]);
  });

  const csv = linhas.map(l => l.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `avaliacoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exportado com sucesso!');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Cadastrar — mostrar campo correto
  setTipoCad('estagiario');

  // Consultar
  renderPessoas();

  // Relatórios
  renderRelatorio();
});
