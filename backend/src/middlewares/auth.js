import jwt from 'jsonwebtoken';
import AppError from '../utils/errors.js';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('Token não fornecido', 401);
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2) {
            throw new AppError('Token inválido', 401);
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            throw new AppError('Token mal formatado', 401);
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                throw new AppError('Token inválido', 401);
            }

            req.user = decoded;
            return next();
        });
    } catch (error) {
        next(error);
    }
};

const isAdminMiddleware = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return next(new AppError('Acesso negado. Apenas administradores', 403));
    }

    next();
};

const isGestorOrAdminMiddleware = (req, res, next) => {
    if (req.user.tipo !== 'admin' && req.user.tipo !== 'gestor') {
        return next(new AppError('Acesso negado. Apenas gestores ou administradores', 403));
    }
    next();
}

export {
    authMiddleware,
    isAdminMiddleware,
    isGestorOrAdminMiddleware
};