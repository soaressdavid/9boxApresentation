lo
const contatosExemplo = [
  {
    id: 1001,
    nome: "João Silva",
    email: "joao.silva@empresa.com",
    tipo: "gestor",
    departamento: "Tecnologia",
    foto: null
  },
  {
    id: 1002,
    nome: "Maria Santos",
    email: "maria.santos@empresa.com",
    tipo: "gestor",
    departamento: "Recursos Humanos",
    foto: null
  },
  {
    id: 1003,
    nome: "Ana Costa",
    email: "ana.costa@empresa.com",
    tipo: "colaborador",
    cargo: "Desenvolvedora",
    foto: null
  },
  {
    id: 1004,
    nome: "Carlos Oliveira",
    email: "carlos.oliveira@empresa.com",
    tipo: "colaborador",
    cargo: "Analista",
    foto: null
  },
  {
    id: 1005,
    nome: "Pedro Lima",
    email: "pedro.lima@empresa.com",
    tipo: "gestor",
    departamento: "Operações",
    foto: null
  },
  {
    id: 1006,
    nome: "Beatriz Ferreira",
    email: "beatriz.ferreira@empresa.com",
    tipo: "colaborador",
    cargo: "Designer",
    foto: null
  }
];

// Salvar contatos
localStorage.setItem('contatos', JSON.stringify(contatosExemplo));

// Adicionar algumas avaliações tradicionais de exemplo
const avaliacoesExemplo = [
  {
    id: 3001,
    tipo: "gestor",
    avaliado: "João Silva",
    criterios: {
      pontualidade: 5,
      comunicacao: 4,
      tecnico: 5,
      proatividade: 4,
      equipe: 5
    },
    media: 4.6,
    comentario: "Excelente gestor, muito dedicado.",
    data: "26/04/2026"
  },
  {
    id: 3002,
    tipo: "colaborador",
    avaliado: "Ana Costa",
    criterios: {},
    media: null,
    comentario: "Colaboradora muito dedicada e pontual. Demonstra grande interesse em aprender e sempre busca feedback para melhorar. Sua comunicação é clara e ela se integra bem com a equipe.",
    data: "26/04/2026",
    tipoAvaliacao: "comentario"
  }
];

// Salvar avaliações tradicionais
localStorage.setItem('avaliacoes', JSON.stringify(avaliacoesExemplo));

// Adicionar algumas avaliações Nine Box de exemplo
const nineBoxExemplo = [
  {
    id: 2001,
    pessoaId: 1001,
    tipo: "gestor",
    pessoa: "João Silva",
    performance: 3,
    potential: 2,
    comentario: "Excelente gestor, muito dedicado à equipe.",
    data: "27/04/2026",
    categoria: "Especialista"
  },
  {
    id: 2002,
    pessoaId: 1003,
    tipo: "colaborador",
    pessoa: "Ana Costa",
    performance: 2,
    potential: 3,
    comentario: "Demonstra muito potencial, está sempre buscando aprender mais.",
    data: "27/04/2026",
    categoria: "Estrela"
  },
  {
    id: 2003,
    pessoaId: 1002,
    tipo: "gestor",
    pessoa: "Maria Santos",
    performance: 3,
    potential: 3,
    comentario: "Gestora excepcional com grande potencial de liderança.",
    data: "27/04/2026",
    categoria: "Superstar"
  }
];

// Salvar avaliações Nine Box
localStorage.setItem('nineBoxAvaliacoes', JSON.stringify(nineBoxExemplo));

console.log("Dados de exemplo adicionados com sucesso!");
console.log("Contatos:", contatosExemplo.length);
console.log("Avaliações tradicionais:", avaliacoesExemplo.length);
console.log("Avaliações Nine Box:", nineBoxExemplo.length);