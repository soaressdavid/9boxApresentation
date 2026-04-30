// =============================================
// DADOS.JS — Exportar / Importar backup JSON
// =============================================

function exportarDados() {
  const chaves = ['contatos', 'avaliacoes', 'nineBoxAvaliacoes', 'competencias', 'avaliacoes180', 'respostas180'];
  const backup = {};

  chaves.forEach(chave => {
    const valor = localStorage.getItem(chave);
    if (valor) {
      try { backup[chave] = JSON.parse(valor); }
      catch (e) { backup[chave] = valor; }
    } else {
      backup[chave] = [];
    }
  });

  backup._exportadoEm = new Date().toISOString();
  backup._versao = '2.0';

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portal-estagio-backup-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso!');
}

function importarDados() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dados = JSON.parse(ev.target.result);

        if (!dados || typeof dados !== 'object') {
          showToast('Arquivo inválido.', 'error');
          return;
        }

        const chaves = ['contatos', 'avaliacoes', 'nineBoxAvaliacoes', 'competencias', 'avaliacoes180', 'respostas180'];
        let importados = 0;

        chaves.forEach(chave => {
          if (dados[chave] !== undefined) {
            localStorage.setItem(chave, JSON.stringify(dados[chave]));
            importados++;
          }
        });

        if (importados === 0) {
          showToast('Nenhum dado reconhecido no arquivo.', 'error');
          return;
        }

        showToast(`Dados importados com sucesso! (${importados} categorias)`);

        // Recarregar a página após 1.5s para refletir os dados
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
