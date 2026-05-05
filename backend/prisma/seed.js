const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.nineBox.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Dados antigos removidos');

  // ==========================================
  // CRIAR ADMIN
  // ==========================================
  const admin = await prisma.user.create({
    data: {
      ra: '1000000',
      nome: 'Administrador',
      email: 'admin@empresa.com',
      senha: await bcrypt.hash('admin123', 10),
      tipo: 'admin'
    }
  });

  console.log('✅ Admin criado (RA: 1000000)');

  // ==========================================
  // CRIAR GESTORES
  // ==========================================
  const gestor1 = await prisma.user.create({
    data: {
      ra: '2021001',
      nome: 'João Silva',
      email: 'joao@empresa.com',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'gestor',
      departamento: 'Tecnologia',
      cargo: 'Gerente de TI'
    }
  });

  const gestor2 = await prisma.user.create({
    data: {
      ra: '2021002',
      nome: 'Maria Santos',
      email: 'maria@empresa.com',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'gestor',
      departamento: 'Recursos Humanos',
      cargo: 'Gerente de RH'
    }
  });

  console.log('✅ Gestores criados (RA: 2021001, 2021002)');

  // ==========================================
  // CRIAR COLABORADORES
  // ==========================================
  const colaborador1 = await prisma.user.create({
    data: {
      ra: '2022001',
      nome: 'Ana Costa',
      email: 'ana@empresa.com',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'colaborador',
      cargo: 'Desenvolvedora',
      departamento: 'Tecnologia'
    }
  });

  const colaborador2 = await prisma.user.create({
    data: {
      ra: '2022002',
      nome: 'Carlos Oliveira',
      email: 'carlos@empresa.com',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'colaborador',
      cargo: 'Analista',
      departamento: 'Tecnologia'
    }
  });

  const colaborador3 = await prisma.user.create({
    data: {
      ra: '2022003',
      nome: 'Beatriz Lima',
      email: 'beatriz@empresa.com',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'colaborador',
      cargo: 'Designer',
      departamento: 'Marketing'
    }
  });

  console.log('✅ Colaboradores criados (RA: 2022001, 2022002, 2022003)');

  // ==========================================
  // CRIAR AVALIAÇÕES BIDIRECIONAIS ANÔNIMAS
  // ==========================================
  
  // Gestor avalia colaborador (anônimo)
  await prisma.evaluation.create({
    data: {
      tipoAvaliacao: 'gestor_para_colaborador',
      avaliadorId: gestor1.id,
      avaliadoId: colaborador1.id,
      criterios: {
        pontualidade: 5,
        qualidade: 5,
        proatividade: 4,
        comunicacao: 5
      },
      media: 4.75,
      comentario: 'Colaboradora muito dedicada e pontual. Demonstra grande interesse em aprender.',
      anonima: true
    }
  });

  // Colaborador avalia gestor (anônimo)
  await prisma.evaluation.create({
    data: {
      tipoAvaliacao: 'colaborador_para_gestor',
      avaliadorId: colaborador1.id,
      avaliadoId: gestor1.id,
      criterios: {
        lideranca: 5,
        comunicacao: 4,
        suporte: 5,
        organizacao: 4
      },
      media: 4.5,
      comentario: 'Gestor muito acessível e sempre disposto a ajudar a equipe.',
      anonima: true
    }
  });

  // Gestor avalia outro colaborador (anônimo)
  await prisma.evaluation.create({
    data: {
      tipoAvaliacao: 'gestor_para_colaborador',
      avaliadorId: gestor1.id,
      avaliadoId: colaborador2.id,
      criterios: {
        pontualidade: 4,
        qualidade: 4,
        proatividade: 3,
        comunicacao: 4
      },
      media: 3.75,
      comentario: 'Bom desempenho, pode melhorar na proatividade.',
      anonima: true
    }
  });

  // Colaborador avalia gestor (anônimo)
  await prisma.evaluation.create({
    data: {
      tipoAvaliacao: 'colaborador_para_gestor',
      avaliadorId: colaborador2.id,
      avaliadoId: gestor1.id,
      criterios: {
        lideranca: 4,
        comunicacao: 3,
        suporte: 4,
        organizacao: 5
      },
      media: 4.0,
      comentario: 'Gestor organizado, mas poderia melhorar a comunicação.',
      anonima: true
    }
  });

  // Admin faz avaliação 360° (não anônima - para auditoria)
  await prisma.evaluation.create({
    data: {
      tipoAvaliacao: 'avaliacao_360',
      avaliadorId: admin.id,
      avaliadoId: gestor2.id,
      criterios: {
        lideranca: 5,
        estrategia: 4,
        resultados: 5,
        pessoas: 4
      },
      media: 4.5,
      comentario: 'Excelente gestora, muito focada em resultados e pessoas.',
      anonima: false // Admin não precisa ser anônimo
    }
  });

  console.log('✅ Avaliações criadas');

  // ==========================================
  // CRIAR NINE BOX
  // ==========================================
  await prisma.nineBox.create({
    data: {
      pessoaId: gestor1.id,
      performance: 3,
      potential: 2,
      categoria: 'Especialista',
      comentario: 'Alto desempenho, potencial médio'
    }
  });

  await prisma.nineBox.create({
    data: {
      pessoaId: colaborador1.id,
      performance: 2,
      potential: 3,
      categoria: 'Estrela',
      comentario: 'Demonstra muito potencial para crescimento'
    }
  });

  await prisma.nineBox.create({
    data: {
      pessoaId: colaborador2.id,
      performance: 2,
      potential: 2,
      categoria: 'Profissional Sólido',
      comentario: 'Desempenho consistente'
    }
  });

  console.log('✅ Nine Box criados');

  // ==========================================
  // CRIAR COMPETÊNCIAS
  // ==========================================
  await prisma.competency.create({
    data: {
      nome: 'Delegar tarefas',
      descricao: 'Quanto à habilidade de delegar tarefas ao time, avalie:',
      tipo: 'lideranca',
      competenciaDe: 'gestor',
      criterios: [
        'Delega tarefas de forma clara',
        'Acompanha o progresso',
        'Dá feedback construtivo',
        'Confia na equipe'
      ]
    }
  });

  await prisma.competency.create({
    data: {
      nome: 'Trabalho em equipe',
      descricao: 'Avalie a capacidade de trabalhar em equipe:',
      tipo: 'comportamento',
      competenciaDe: 'todos',
      criterios: [
        'Colabora com colegas',
        'Compartilha conhecimento',
        'Respeita opiniões diferentes',
        'Contribui para o ambiente positivo'
      ]
    }
  });

  await prisma.competency.create({
    data: {
      nome: 'Conhecimento técnico',
      descricao: 'Avalie o conhecimento técnico na área de atuação:',
      tipo: 'tecnica',
      competenciaDe: 'colaborador',
      criterios: [
        'Domina ferramentas necessárias',
        'Resolve problemas técnicos',
        'Busca atualização constante',
        'Aplica boas práticas'
      ]
    }
  });

  console.log('✅ Competências criadas');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📧 Credenciais de teste:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  RA: 1000000');
  console.log('  Email: admin@empresa.com');
  console.log('  Senha: admin123');
  console.log('');
  console.log('Gestor 1:');
  console.log('  RA: 2021001');
  console.log('  Email: joao@empresa.com');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Gestor 2:');
  console.log('  RA: 2021002');
  console.log('  Email: maria@empresa.com');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Colaborador 1:');
  console.log('  RA: 2022001');
  console.log('  Email: ana@empresa.com');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Colaborador 2:');
  console.log('  RA: 2022002');
  console.log('  Email: carlos@empresa.com');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Colaborador 3:');
  console.log('  RA: 2022003');
  console.log('  Email: beatriz@empresa.com');
  console.log('  Senha: senha123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
