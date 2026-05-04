import Joi from 'joi';

const registerSchema = Joi.object({
    ra: Joi.string()
        .pattern(/^\d{7,9}$/)
        .required()
        .messages({
            'string.pattern.base': 'RA deve ter exatamente 7 dígitos numéricos',
            'any.required': 'RA é obrigatório (use o RA do banco do ENIAC)'
        }),
    nome: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
    tipo: Joi.string().valid('admin', 'gestor', 'colaborador').required(),
    cargo: Joi.string().optional(),
    departamento: Joi.string().optional(),
    foto: Joi.string().uri().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().required()
});

const updateProfileSchema = Joi.object({
    nome: Joi.string().min(3).optional(),
    cargo: Joi.string().optional(),
    departamento: Joi.string().optional(),
    foto: Joi.string().uri().optional()
});

export {
    registerSchema,
    loginSchema,
    updateProfileSchema
};