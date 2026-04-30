const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Limpando tudo...')
    await prisma.evaluation.deleteMany();
    await prisma.nineBox.deleteMany();
    await prisma.competency.deleteMany();
    await prisma.user.deleteMany();

    console.log('Criando usuários testes...');
    console.log('ATENÇÂO: Use RAs reias das pessoas');

    await prisma.user.create({
        data: {
            ra: '1234567',
            nome: 'admin@admin123',
            email: 'admin@eniac.edu.br',
            senha: await bcrypt.hash('admin123', 10),
            tipo: 'admin',
            cargo: 'Administrador',
            departamento: 'TI'
        }
    });

    await prisma.user.create({
        data: {
            ra: '2021001',
            nome: 'João Silva',
            email: 'joao@eniac.edu.br',
            senha: await bcrypt.hash('joao123', 10),
            tipo: 'gestor',
            cargo: 'Gerente de TI',
            departamento: 'TI'
        }
    });

    await prisma.user.create({
        data: {
            ra: '2022001',
            nome: 'Ana Costa',
            email: 'ana@eniac.edu.br',
            senha: await bcrypt.hash('ana123', 10),
            tipo: 'colaborador',
            cargo: 'Desenvolvimento',
            departamento: 'TI'
        }
    });

    console.log('Seed concluido!');
    console.log('Lembre-se: cada pessoa já tem o seu RA');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });