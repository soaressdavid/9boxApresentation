import UserRepository from './user.repository.js';
import UserService from './user.service.js';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

class UserController {
    async register(req, res, next) {
        try {
            const user = await userService.register(req.body);
            return res.status(201).json({
                success: true,
                data: user,
                message: 'Usuário cadastrado com sucesso.'
            }); 
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const result = await userService.login(email, senha);
            return res.json({
                success: true,
                data: result,
                message: 'Login realizado com sucesso.'
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.userId);
            return res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async findAll(req, res, next) {
        try {
            const { page, limit, tipo } = req.query;
            const results = await userService.findAll({page: parseInt(page) || 1, limit: parseInt(limit) || 10, tipo}, 
                req.user.tipo
            );

            return res.json({
                success: true,
                data: results
            })
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {

            const { id } = req.params;

            if (!id) {
                throw new AppError('ID do usuário é obrigatório', 400);
            }

            const user = await userService.findById(id, req.user.userId, req.user.tipo);

            return res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async findByRA(req, res, next) {
        try {
            const user = await userService.findByRA(req.params.ra);
            
            return res.json({
                success: true,
                data: user
            });
        }  catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
    try {
        // Converta para número aqui se o seu banco usar ID Inteiro
        const result = await userService.delete(Number(req.params.id)); 
        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
}
}

export default UserController;