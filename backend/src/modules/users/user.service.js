import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import AppError from '../../utils/errors.js';

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async register(data) {
        const emailExists = await this.userRepository.emailExists(data.email)
        if (emailExists) {
            throw new AppError('Email já cadastrado', 400);
        }

        const raExists = await this.userRepository.raExists(data.ra);
        if(raExists) {
            throw new AppError('RA já cadastrado', 400)
        }

        const hashedPassword = await bcrypt.hash(data.senha, 10);

        const user = await this.userRepository.create({
            ...data,
            senha: hashedPassword
        });

        delete user.senha;
        return user;
    }

    async login (email, senha) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        const isPasswordValid = await bcrypt.compare(senha, user.senha);
        if (!isPasswordValid) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            tipo: user.tipo,
            ra: user.ra
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
        );

        delete user.senha;
        return { user, token };
    }

    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        delete user.senha;
        return user;
    }

    async updateProfile(userId, data) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        const userUpdated = await this.userRepository.update(userId, data);
        return userUpdated;
    }

    async findAll(filters, userTipo) {
        if (userTipo === 'colaborador') {
            throw new AppError('Sem permissão para listar usuários', 403);
        }

        return this.userRepository.findAll(filters);
    }

    async findById(id, requestUserId, requestUserTipo) {
        const user = await this.userRepository.findById(Number(id));
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        if (requestUserTipo === 'colaborador' && id !== requestUserId) {
            throw new AppError('Sem permissão para ver este usuário', 403);
        }

        delete user.senha;
        return user;
    }

    async findByRA(ra) {
        const user = await this.userRepository.findByRA(ra);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        delete user.senha;
        return user;
    }

    async delete(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        if (user.tipo === 'admin') {
            throw new AppError('Não é possível deletar admin', 400);
        }
        

        await this.userRepository.delete(id);
        return { message: 'Usuário deletado com sucesso'};
    }
}

export default UserService;