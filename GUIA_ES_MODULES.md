# Guia - Adaptação para ES Modules (import/export)

Este guia mostra como adaptar todos os códigos dos guias para usar **ES Modules** ao invés de CommonJS.

## Diferenças Principais

### CommonJS (require)
```javascript
const express = require('express');
const { prisma } = require('./config/database');
module.exports = { UserService };
```

### ES Modules (import)
```javascript
import express from 'express';
import { prisma } from './config/database.js';
export { UserService };
```

---

## Passo 1: Configurar package.json

Adicione `"type": "module"` no seu `package.json`:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.9.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## Passo 2: Adicionar .js nas importações

**IMPORTANTE**: Com ES Modules, você DEVE incluir a extensão `.js` nos imports locais!

❌ **Errado:**
```javascript
import { prisma } from './config/database';
```

✅ **Correto:**
```javascript
import { prisma } from './config/database.js';
```

---

## Passo 3: Adaptar arquivos principais

### 3.1 config/database.js

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
```

### 3.2 utils/errors.js

```javascript
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
```

### 3.3 middlewares/errorHandler.js

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Já existe um registro com esses dados'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro não encontrado'
    });
  }

  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
};

export { errorHandler };
```

### 3.4 middlewares/validate.js

```javascript
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        errors: error.details.map(d => d.message)
      });
    }

    req.body = value;
    next();
  };
};

export { validate };
```

### 3.5 middlewares/auth.js

```javascript
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

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
};

export {
  authMiddleware,
  isAdminMiddleware,
  isGestorOrAdminMiddleware
};
```

---

## Passo 4: Módulo de Usuários (Users)

### 4.1 user.validation.js

```javascript
import Joi from 'joi';

const registerSchema = Joi.object({
  ra: Joi.string()
    .pattern(/^\d{7}$/)
    .required()
    .messages({
      'string.pattern.base': 'RA deve ter exatamente 7 dígitos numéricos',
      'any.required': 'RA é obrigatório'
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
```

### 4.2 user.repository.js

```javascript
import { prisma } from '../../config/database.js';

class UserRepository {
  async create(data) {
    return prisma.user.create({ data });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByRA(ra) {
    return prisma.user.findUnique({ where: { ra } });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findAll({ page = 1, limit = 10, tipo }) {
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
        orderBy: { createdAt: 'desc' }
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
        foto: true
      }
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }

  async emailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return !!user;
  }

  async raExists(ra) {
    const user = await prisma.user.findUnique({
      where: { ra },
      select: { id: true }
    });
    return !!user;
  }
}

export { UserRepository };
```

### 4.3 user.service.js

```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/errors.js';

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(data) {
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email já cadastrado', 400);
    }

    const raExists = await this.userRepository.raExists(data.ra);
    if (raExists) {
      throw new AppError('RA já cadastrado', 400);
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);

    const user = await this.userRepository.create({
      ...data,
      senha: hashedPassword
    });

    delete user.senha;
    return user;
  }

  async login(email, senha) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tipo: user.tipo,
        ra: user.ra
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
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
      throw new AppError('Usuário não encontrado', 404);
    }

    const updated = await this.userRepository.update(userId, data);
    return updated;
  }

  async findAll(filters, userTipo) {
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para listar usuários', 403);
    }

    return this.userRepository.findAll(filters);
  }

  async findById(id, requestUserId, requestUserTipo) {
    const user = await this.userRepository.findById(id);
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
    return { message: 'Usuário deletado com sucesso' };
  }
}

export { UserService };
```

### 4.4 user.controller.js

```javascript
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

class UserController {
  async register(req, res, next) {
    try {
      const user = await userService.register(req.body);
      return res.status(201).json({
        success: true,
        data: user,
        message: 'Usuário cadastrado com sucesso'
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
        message: 'Login realizado com sucesso'
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

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.userId, req.body);
      return res.json({
        success: true,
        data: user,
        message: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const { page, limit, tipo } = req.query;
      const result = await userService.findAll(
        { page: parseInt(page) || 1, limit: parseInt(limit) || 10, tipo },
        req.user.tipo
      );
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const user = await userService.findById(
        req.params.id,
        req.user.userId,
        req.user.tipo
      );
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
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await userService.delete(req.params.id);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

export { UserController };
```

### 4.5 user.routes.js

```javascript
import express from 'express';
import { UserController } from './user.controller.js';
import { authMiddleware, isAdminMiddleware, isGestorOrAdminMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from './user.validation.js';

const router = express.Router();
const userController = new UserController();

// Rotas públicas
router.post('/login', validate(loginSchema), (req, res, next) => userController.login(req, res, next));

// Rotas protegidas
router.use(authMiddleware);

router.get('/profile', (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', validate(updateProfileSchema), (req, res, next) => userController.updateProfile(req, res, next));

router.get('/ra/:ra', (req, res, next) => userController.findByRA(req, res, next));

// Rotas de gestor/admin
router.get('/', isGestorOrAdminMiddleware, (req, res, next) => userController.findAll(req, res, next));
router.get('/:id', isGestorOrAdminMiddleware, (req, res, next) => userController.findById(req, res, next));

// Rotas de admin
router.post('/register', isAdminMiddleware, validate(registerSchema), (req, res, next) => userController.register(req, res, next));
router.delete('/:id', isAdminMiddleware, (req, res, next) => userController.delete(req, res, next));

export default router;
```

---

## Passo 5: app.js e server.js

### 5.1 app.js

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';

// Rotas
import userRoutes from './modules/users/user.routes.js';
import evaluationRoutes from './modules/evaluations/evaluation.routes.js';
import competencyRoutes from './modules/competencies/competency.routes.js';
import nineBoxRoutes from './modules/ninebox/ninebox.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/ninebox', nineBoxRoutes);
app.use('/api/reports', reportsRoutes);

// Error handler (sempre por último)
app.use(errorHandler);

export default app;
```

### 5.2 server.js

```javascript
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
```

---

## Passo 6: Seed com ES Modules

### prisma/seed.js

```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando banco...');
  await prisma.evaluation.deleteMany();
  await prisma.nineBox.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.user.deleteMany();

  console.log('Criando usuários de teste...');

  await prisma.user.create({
    data: {
      ra: '1234567',
      nome: 'Admin Sistema',
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
      senha: await bcrypt.hash('senha123', 10),
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
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'colaborador',
      cargo: 'Desenvolvedora',
      departamento: 'TI'
    }
  });

  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Resumo das Mudanças

### ✅ O que muda:

1. **package.json**: Adicionar `"type": "module"`
2. **Imports**: Trocar `require()` por `import`
3. **Exports**: Trocar `module.exports` por `export`
4. **Extensões**: Adicionar `.js` em todos os imports locais
5. **dotenv**: Usar `import 'dotenv/config'` ao invés de `require('dotenv').config()`
6. **Default exports**: Usar `export default` para rotas

### ⚠️ Atenção:

- **SEMPRE** adicione `.js` nos imports locais
- Use `export default` para exports únicos (como routers)
- Use `export { }` para exports nomeados (como classes e funções)
- `import 'dotenv/config'` deve vir antes de qualquer outro import que use variáveis de ambiente

---

## Aplicar em Todos os Módulos

Siga o mesmo padrão para:
- ✅ Evaluations
- ✅ Competencies
- ✅ NineBox
- ✅ Reports

Sempre lembrando:
1. Adicionar `.js` nos imports
2. Trocar `require` por `import`
3. Trocar `module.exports` por `export`

---

**Pronto! Agora todos os seus arquivos usam ES Modules! 🎉**
