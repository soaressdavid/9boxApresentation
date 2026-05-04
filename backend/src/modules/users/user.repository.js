import prisma from '../../config/database.js';

class UserRepository {
    async create(data) {
        return prisma.user.create({
            data
        });
    }

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    async findByRA(ra) {
        return prisma.user.findUnique({
            where: { ra }
        });
    }


    async findById(id) {
    return prisma.user.findUnique({
        where: { id: id }
    });
}

    async findAll({ page = 1, limit = 10, tipo}) {
        const skip = (page - 1) * limit;
        const where = tipo ? { tipo } : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    ra: true,
                    nome: true,
                    email: true,
                    tipo: true,
                    cargo: true,
                    departamento: true,
                    foto: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.user.count({ where })
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                ra: true,
                nome: true,
                email: true,
                tipo: true,
                cargo: true,
                departamento: true,
                foto: true,
                createdAt: true
            }
        });
    }

    async delete(id)  {
        return prisma.user.delete({ where: { id }});
    }

    async emailExists(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true
            }
        });

        return !!user;
    }

    async raExists(ra) {
        const user = await prisma.user.findUnique({
            where: { ra },
            select: {
                id: true
            }
        });

        return !!user;
    }
}

export default UserRepository;