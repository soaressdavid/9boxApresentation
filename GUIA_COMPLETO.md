# Guia Completo - Como Fazer o Projeto do Zero

Este é um guia prático para você implementar todo o backend. Vou te ensinar exatamente o que fazer, na ordem certa.

## Parte 1: Setup Inicial (30 min)

### 1.1 Criar estrutura do projeto

```bash
mkdir backend
cd backend
npm init -y
```

### 1.2 Instalar dependências

```bash
npm install express prisma @prisma/client bcryptjs jsonwebtoken joi dotenv cors helmet
npm install -D nodemon
```

### 1.3 Configurar package.json

Adiciona os scripts:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js"
  }
}
```

### 1.4 Criar estrutura de pastas

```bash
mkdir -p src/config
mkdir -p src/middlewares
mkdir -p src/modules/users
mkdir -p src/modules/evaluations
mkdir -p src/modules/competencies
mkdir -p src/modules/reports
mkdir -p src/utils
mkdir -p prisma
```

### 1.5 Criar .env

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="seu_secret_aqui"
JWT_EXPIRES_IN=30d
NODE_ENV=development
```

### 1.6 Criar .gitignore

```
node_modules/
.env
dist/
```

## Parte 2: Configurar Prisma (20 min)

### 2.1 Inicializar Prisma

```bash
npx prisma init
```

### 2.2 Criar schema.prisma

Arquivo: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserType {
  admin
  gestor
  colaborador
}

model User {
  id           String   @id @default(uuid())
  ra           String   @unique
  nome         String
  email        String   @unique
  senha        String
  tipo         UserType
  foto         String?
  cargo        String?
  departamento String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  avaliacoesFeitas    Evaluation[] @relation("AvaliadorRelation")
  avaliacoesRecebidas Evaluation[] @relation("AvaliadoRelation")
  nineBoxAvaliacoes   NineBox[]

  @@index([ra])
  @@index([email])
  @@map("users")
}

model Evaluation {
  id          String   @id @default(uuid())
  avaliadorId String
  avaliadoId  String
  tipo        String
  criterios   Json
  media       Float?
  comentario  String?
  data        DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  avaliador User @relation("AvaliadorRelation", fields: [avaliadorId], references: [id], onDelete: Cascade)
  avaliado  User @relation("AvaliadoRelation", fields: [avaliadoId], references: [id], onDelete: Cascade)

  @@index([avaliadorId])
  @@index([avaliadoId])
  @@map("evaluations")
}

model NineBox {
  id          String   @id @default(uuid())
  pessoaId    String
  performance Int
  potential   Int
  categoria   String
  comentario  String?
  data        DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  pessoa User @relation(fields: [pessoaId], references: [id], onDelete: Cascade)

  @@index([pessoaId])
  @@map("nine_box")
}

model Competency {
  id             String   @id @default(uuid())
  nome           String
  descricao      String
  tipo           String
  competenciaDe  String
  criterios      String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("competencies")
}
```

### 2.3 Rodar migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 2.4 Criar seed

Arquivo: `prisma/seed.js`

**IMPORTANTE**: Use RAs reais. Cada pessoa já tem seu RA (como CPF).

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando banco...');
  await prisma.evaluation.deleteMany();
  await prisma.nineBox.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.user.deleteMany();

  console.log('Criando usuários de teste...');
  console.log('ATENÇÃO: Use RAs reais das pessoas!');

  // Admin - use o RA real do admin
  await prisma.user.create({
    data: {
      ra: '1234567', // RA real do admin
      nome: 'Admin Sistema',
      email: 'admin@eniac.edu.br',
      senha: await bcrypt.hash('admin123', 10),
      tipo: 'admin',
      cargo: 'Administrador',
      departamento: 'TI'
    }
  });

  // Gestor - use RA real do gestor
  await prisma.user.create({
    data: {
      ra: '2021001', // RA real do gestor
      nome: 'João Silva',
      email: 'joao@eniac.edu.br',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'gestor',
      cargo: 'Gerente de TI',
      departamento: 'TI'
    }
  });

  // Colaborador - use RA real do colaborador
  await prisma.user.create({
    data: {
      ra: '2022001', // RA real do colaborador
      nome: 'Ana Costa',
      email: 'ana@eniac.edu.br',
      senha: await bcrypt.hash('senha123', 10),
      tipo: 'colaborador',
      cargo: 'Desenvolvedora',
      departamento: 'TI'
    }
  });

  console.log('Seed concluído!');
  console.log('Lembre-se: cada pessoa já tem seu RA');
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

Rodar seed:

```bash
npm run prisma:seed
```

## Parte 3: Configurações Base (15 min)

### 3.1 Criar config/database.js

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = { prisma };
```

### 3.2 Criar utils/errors.js

```javascript
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
```

### 3.3 Criar middlewares/errorHandler.js

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Erro do Prisma
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

  // Erro de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
};

module.exports = { errorHandler };
```

### 3.4 Criar middlewares/validate.js

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

module.exports = { validate };
```

## Parte 4: Módulo de Usuários (1h)

### 4.1 Criar user.validation.js

Arquivo: `src/modules/users/user.validation.js`

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  ra: Joi.string()
    .pattern(/^\d{7}$/)
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

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};
```

### 4.2 Criar user.repository.js

Arquivo: `src/modules/users/user.repository.js`

```javascript
const { prisma } = require('../../config/database');

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

module.exports = { UserRepository };
```

### 4.3 Criar user.service.js

Arquivo: `src/modules/users/user.service.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../../utils/errors');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(data) {
    // Verifica email duplicado
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email já cadastrado', 400);
    }

    // Verifica RA duplicado
    const raExists = await this.userRepository.raExists(data.ra);
    if (raExists) {
      throw new AppError('RA já cadastrado', 400);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    // Cria usuário
    const user = await this.userRepository.create({
      ...data,
      senha: hashedPassword
    });

    // Remove senha da resposta
    delete user.senha;

    return user;
  }

  async login(email, senha) {
    // Busca usuário
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Gera token
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

    // Remove senha da resposta
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
    // Colaborador não pode listar usuários
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

    // Colaborador só pode ver próprio perfil
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

module.exports = { UserService };
```

### 4.4 Criar user.controller.js

Arquivo: `src/modules/users/user.controller.js`

```javascript
const { UserRepository } = require('./user.repository');
const { UserService } = require('./user.service');

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

module.exports = { UserController };
```

### 4.5 Criar middlewares de autenticação

Arquivo: `src/middlewares/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

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

module.exports = {
  authMiddleware,
  isAdminMiddleware,
  isGestorOrAdminMiddleware
};
```

### 4.6 Criar user.routes.js

Arquivo: `src/modules/users/user.routes.js`

```javascript
const express = require('express');
const { UserController } = require('./user.controller');
const { authMiddleware, isAdminMiddleware, isGestorOrAdminMiddleware } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const { registerSchema, loginSchema, updateProfileSchema } = require('./user.validation');

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

module.exports = router;
```

## Parte 5: Criar app.js e server.js (10 min)

### 5.1 Criar app.js

Arquivo: `src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middlewares/errorHandler');

// Rotas
const userRoutes = require('./modules/users/user.routes');

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

// Error handler (sempre por último)
app.use(errorHandler);

module.exports = app;
```

### 5.2 Criar server.js

Arquivo: `src/server.js`

```javascript
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
```

## Parte 6: Testar (15 min)

### 6.1 Rodar servidor

```bash
npm run dev
```

### 6.2 Testar no Postman

**1. Login**
```
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "senha": "admin123"
}
```

Copia o token da resposta.

**2. Ver perfil**
```
GET http://localhost:3000/api/users/profile
Authorization: Bearer SEU_TOKEN
```

**3. Cadastrar usuário (como admin)**

**IMPORTANTE**: Use o RA real da pessoa!

```
POST http://localhost:3000/api/users/register
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "ra": "2022004",
  "nome": "Teste Silva",
  "email": "teste@eniac.edu.br",
  "senha": "senha123",
  "tipo": "colaborador",
  "cargo": "Desenvolvedor",
  "departamento": "TI"
}
```

Obs: Cada pessoa já tem seu RA (como CPF). Pergunte o RA dela e use no cadastro.

**4. Listar usuários**
```
GET http://localhost:3000/api/users
Authorization: Bearer SEU_TOKEN
```

**5. Buscar por RA**
```
GET http://localhost:3000/api/users/ra/2021001
Authorization: Bearer SEU_TOKEN
```

## Observações Importantes sobre RA

1. **RA é como CPF**: Cada pessoa já tem seu RA. Não invente números.

2. **No cadastro, pergunte o RA**: Quando cadastrar alguém, pergunte qual é o RA dela.

3. **Admin também tem RA**: Cada admin tem seu próprio RA.

4. **Sistema não gera RA**: O sistema só valida se tem 7 dígitos e se não está duplicado.

5. **Sem integração**: Não há integração com banco do ENIAC. O RA é apenas um dado que a pessoa informa.

## Próximos Passos

Agora você tem o módulo de usuários funcionando! Os próximos módulos seguem o mesmo padrão:

1. **Evaluations** - Copia a estrutura (validation, repository, service, controller, routes)
2. **Competencies** - Mesma coisa
3. **Reports** - Mesma coisa

A lógica é sempre:
- **Validation**: Define regras com Joi
- **Repository**: Faz queries no Prisma
- **Service**: Lógica de negócio e validações
- **Controller**: Recebe HTTP e responde
- **Routes**: Define endpoints e middlewares

## Dicas Importantes

1. **Sempre teste cada endpoint** depois de criar
2. **Use Prisma Studio** para ver os dados: `npm run prisma:studio`
3. **Veja os logs** do Prisma no terminal
4. **Leia os erros** com atenção - eles dizem o que tá errado
5. **Commit frequente** - a cada feature que funcionar

## Estrutura Final

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── modules/
│   │   └── users/
│   │       ├── user.validation.js
│   │       ├── user.repository.js
│   │       ├── user.service.js
│   │       ├── user.controller.js
│   │       └── user.routes.js
│   ├── utils/
│   │   └── errors.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
└── package.json
```

Agora você sabe fazer! Qualquer dúvida, consulta os outros docs ou me chama.
