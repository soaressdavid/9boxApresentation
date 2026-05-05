// =============================================
// VALIDATORS.JS — Validações reutilizáveis
// =============================================

/**
 * Valida e-mail institucional .edu.br
 */
export function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.br$/i.test(email.trim());
}

/**
 * Valida RA: 5 a 10 caracteres alfanuméricos
 */
export function isValidRA(ra) {
  const trimmed = ra.trim();
  return trimmed.length >= 5 && trimmed.length <= 10;
}

/**
 * Valida nome: mínimo 3 caracteres
 */
export function isValidNome(nome) {
  return nome.trim().length >= 3;
}

/**
 * Valida senha: mínimo 6 caracteres
 */
export function isValidSenha(senha) {
  return senha.length >= 6;
}

/**
 * Valida comentário de avaliação: mínimo 20 caracteres
 */
export function isValidComentario(texto) {
  return texto.trim().length >= 20;
}

/**
 * Exibe mensagem de erro inline em um campo.
 * @param {string} fieldId - ID do input
 * @param {string} msg     - Mensagem de erro (vazio para limpar)
 */
export function setFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Remove erro anterior
  const prev = field.parentElement.querySelector('.field-error');
  if (prev) prev.remove();
  field.classList.remove('field-invalid');

  if (msg) {
    field.classList.add('field-invalid');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.textContent = msg;
    field.parentElement.appendChild(span);
  }
}

/**
 * Limpa todos os erros de um formulário.
 * @param {string} formId - ID do form
 */
export function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
}

/**
 * Valida o formulário de cadastro de usuário.
 * Retorna true se válido, false se inválido (e exibe erros inline).
 */
export function validateCadastroForm({ ra, nome, email, senha, tipo }) {
  let valid = true;

  if (!isValidRA(ra)) {
    setFieldError('cad-ra', 'RA deve ter entre 5 e 10 caracteres');
    valid = false;
  } else {
    setFieldError('cad-ra', '');
  }

  if (!isValidNome(nome)) {
    setFieldError('cad-nome', 'Nome deve ter pelo menos 3 caracteres');
    valid = false;
  } else {
    setFieldError('cad-nome', '');
  }

  if (!isValidEmail(email)) {
    setFieldError('cad-email', 'Use um e-mail institucional (ex: nome@faculdade.edu.br)');
    valid = false;
  } else {
    setFieldError('cad-email', '');
  }

  if (!isValidSenha(senha)) {
    setFieldError('cad-senha', 'Senha deve ter pelo menos 6 caracteres');
    valid = false;
  } else {
    setFieldError('cad-senha', '');
  }

  if (!tipo) {
    setFieldError('cad-tipo', 'Selecione o tipo de usuário');
    valid = false;
  } else {
    setFieldError('cad-tipo', '');
  }

  return valid;
}

/**
 * Valida o formulário de login.
 */
export function validateLoginForm({ email, senha }) {
  let valid = true;

  if (!isValidEmail(email)) {
    setFieldError('login-email', 'Use um e-mail institucional (ex: nome@faculdade.edu.br)');
    valid = false;
  } else {
    setFieldError('login-email', '');
  }

  if (!senha) {
    setFieldError('login-senha', 'Digite sua senha');
    valid = false;
  } else {
    setFieldError('login-senha', '');
  }

  return valid;
}
