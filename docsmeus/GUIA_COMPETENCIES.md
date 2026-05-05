# Guia Completo - Módulo de Competências (Competencies)

Este guia ensina como implementar o módulo de competências do zero.

## Parte 8: Módulo de Competências (1h)

### 8.1 Criar competency.validation.js

Arquivo: `src/modules/competencies/competency.validation.js`

```javascript
import Joi from 'joi';

const createCompetencySchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  descricao: Joi.string().min(10).max(500).required(),
  tipo: Joi.string().valid('desempenho', 'comportamento', 'tecnica', 'lideranca').required(),
  competenciaDe: Joi.string().valid('gestor', 'colaborador', 'todos').required(),
  criterios: Joi.array().items(Joi.string().min(5).max(300)).min(1).max(10).required()
});

const updateCompetencySchema = Joi.object({
  nome: Joi.string().min(3).max(100).optional(),
  descricao: Joi.string().min(10).max(500).optional(),
  tipo: Joi.string().valid('desempenho', 'comportamento', 'tecnica', 'lideranca').optional(),
  competenciaDe: Joi.string().valid('gestor', 'colaborador', 'todos').optional(),
  criterios: Joi.array().items(Joi.string().min(5).max(300)).min(1).max(10).optional()
});

export {
  createCompetencySchema,
  updateCompetencySchema
};
```

### 8.2 Criar competency.repository.js

Arquivo: `src/modules/competencies/competency.repository.js`

```javascript
import { prisma } from '../../config/database.js';

class CompetencyRepository {
  async create(data) {
    return prisma.competency.create({ data });
  }

  async findById(id) {
    return prisma.competency.findUnique({ where: { id } });
  }

  async findAll({ page = 1, limit = 10, tipo, competenciaDe, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (competenciaDe) where.competenciaDe = competenciaDe;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [competencies, total] = await Promise.all([
      prisma.competency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.competency.count({ where })
    ]);

    return {
      competencies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByTipo(tipo) {
    return prisma.competency.findMany({
      where: { tipo },
      orderBy: { nome: 'asc' }
    });
  }

  async findByCompetenciaDe(competenciaDe) {
    return prisma.competency.findMany({
      where: { competenciaDe },
      orderBy: { nome: 'asc' }
    });
  }

  async update(id, data) {
    return prisma.competency.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.competency.delete({ where: { id } });
  }

  async exists(nome) {
    const competency = await prisma.competency.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: 'insensitive'
        }
      }
    });
    return !!competency;
  }

  async count() {
    return prisma.competency.count();
  }

  async getStatsByTipo() {
    const competencies = await prisma.competency.findMany({
      select: {
        tipo: true,
        competenciaDe: true
      }
    });

    const porTipo = competencies.reduce((acc, comp) => {
      if (!acc[comp.tipo]) {
        acc[comp.tipo] = 0;
      }
      acc[comp.tipo]++;
      return acc;
    }, {});

    const porCompetenciaDe = competencies.reduce((acc, comp) => {
      if (!acc[comp.competenciaDe]) {
        acc[comp.competenciaDe] = 0;
      }
      acc[comp.competenciaDe]++;
      return acc;
    }, {});

    return {
      total: competencies.length,
      porTipo,
      porCompetenciaDe
    };
  }
}

export { CompetencyRepository };
```

### 8.3 Criar competency.service.js

Arquivo: `src/modules/competencies/competency.service.js`

```javascript
import { AppError } from '../../utils/errors.js';

class CompetencyService {
  constructor(competencyRepository) {
    this.competencyRepository = competencyRepository;
  }

  async create(data, userTipo) {
    // Apenas admin pode criar competências
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para criar competências', 403);
    }

    // Verifica se já existe competência com esse nome
    const exists = await this.competencyRepository.exists(data.nome);
    if (exists) {
      throw new AppError('Já existe uma competência com este nome', 400);
    }

    // Valida número de critérios
    if (data.criterios.length < 1 || data.criterios.length > 10) {
      throw new AppError('A competência deve ter entre 1 e 10 critérios', 400);
    }

    const competency = await this.competencyRepository.create(data);
    return competency;
  }

  async findById(id) {
    const competency = await this.competencyRepository.findById(id);
    if (!competency) {
      throw new AppError('Competência não encontrada', 404);
    }
    return competency;
  }

  async findAll(filters) {
    return this.competencyRepository.findAll(filters);
  }

  async findByTipo(tipo) {
    const validTipos = ['desempenho', 'comportamento', 'tecnica', 'lideranca'];
    if (!validTipos.includes(tipo)) {
      throw new AppError('Tipo de competência inválido', 400);
    }
    return this.competencyRepository.findByTipo(tipo);
  }

  async findByCompetenciaDe(competenciaDe) {
    const validCompetenciaDe = ['gestor', 'colaborador', 'todos'];
    if (!validCompetenciaDe.includes(competenciaDe)) {
      throw new AppError('CompetenciaDe inválido', 400);
    }
    return this.competencyRepository.findByCompetenciaDe(competenciaDe);
  }

  async update(id, data, userTipo) {
    // Apenas admin pode atualizar competências
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para atualizar competências', 403);
    }

    const competency = await this.competencyRepository.findById(id);
    if (!competency) {
      throw new AppError('Competência não encontrada', 404);
    }

    // Se está mudando o nome, verifica se não existe outro com esse nome
    if (data.nome && data.nome !== competency.nome) {
      const exists = await this.competencyRepository.exists(data.nome);
      if (exists) {
        throw new AppError('Já existe uma competência com este nome', 400);
      }
    }

    // Valida número de critérios se estiver atualizando
    if (data.criterios && (data.criterios.length < 1 || data.criterios.length > 10)) {
      throw new AppError('A competência deve ter entre 1 e 10 critérios', 400);
    }

    return this.competencyRepository.update(id, data);
  }

  async delete(id, userTipo) {
    // Apenas admin pode deletar competências
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para deletar competências', 403);
    }

    const competency = await this.competencyRepository.findById(id);
    if (!competency) {
      throw new AppError('Competência não encontrada', 404);
    }

    await this.competencyRepository.delete(id);
    return { message: 'Competência deletada com sucesso' };
  }

  async getStats() {
    return this.competencyRepository.getStatsByTipo();
  }
}

export { CompetencyService };
```

### 8.4 Criar competency.controller.js

Arquivo: `src/modules/competencies/competency.controller.js`

```javascript
import { CompetencyRepository } from './competency.repository.js';
import { CompetencyService } from './competency.service.js';

const competencyRepository = new CompetencyRepository();
const competencyService = new CompetencyService(competencyRepository);

class CompetencyController {
  async create(req, res, next) {
    try {
      const competency = await competencyService.create(req.body, req.user.tipo);
      return res.status(201).json({
        success: true,
        data: competency,
        message: 'Competência criada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const competency = await competencyService.findById(req.params.id);
      return res.json({
        success: true,
        data: competency
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const { page, limit, tipo, competenciaDe, search } = req.query;
      const result = await competencyService.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        tipo,
        competenciaDe,
        search
      });
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async findByTipo(req, res, next) {
    try {
      const competencies = await competencyService.findByTipo(req.params.tipo);
      return res.json({
        success: true,
        data: competencies
      });
    } catch (error) {
      next(error);
    }
  }

  async findByCompetenciaDe(req, res, next) {
    try {
      const competencies = await competencyService.findByCompetenciaDe(req.params.competenciaDe);
      return res.json({
        success: true,
        data: competencies
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const competency = await competencyService.update(
        req.params.id,
        req.body,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: competency,
        message: 'Competência atualizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await competencyService.delete(req.params.id, req.user.tipo);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await competencyService.getStats();
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export { CompetencyController };
```

### 8.5 Criar competency.routes.js

Arquivo: `src/modules/competencies/competency.routes.js`

```javascript
import express from 'express';
import { CompetencyController } from './competency.controller.js';
import { authMiddleware, isAdminMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createCompetencySchema, updateCompetencySchema } from './competency.validation.js';

const router = express.Router();
const competencyController = new CompetencyController();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Rotas públicas (autenticadas) - todos podem ver
router.get('/', (req, res, next) => competencyController.findAll(req, res, next));
router.get('/stats', (req, res, next) => competencyController.getStats(req, res, next));
router.get('/tipo/:tipo', (req, res, next) => competencyController.findByTipo(req, res, next));
router.get('/competencia-de/:competenciaDe', (req, res, next) => competencyController.findByCompetenciaDe(req, res, next));
router.get('/:id', (req, res, next) => competencyController.findById(req, res, next));

// Rotas de admin - criar, atualizar e deletar
router.post('/', isAdminMiddleware, validate(createCompetencySchema), (req, res, next) => competencyController.create(req, res, next));
router.put('/:id', isAdminMiddleware, validate(updateCompetencySchema), (req, res, next) => competencyController.update(req, res, next));
router.delete('/:id', isAdminMiddleware, (req, res, next) => competencyController.delete(req, res, next));

export default router;
```

### 8.6 Adicionar rota no app.js

Arquivo: `src/app.js` (adicionar linha)

```javascript
import competencyRoutes from './modules/competencies/competency.routes.js';

// ... outras rotas ...

app.use('/api/competencies', competencyRoutes);
```

### 8.7 Criar seed de competências (opcional)

Arquivo: `prisma/seed-competencies.js`

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedCompetencies() {
  console.log('Criando competências de exemplo...');

  // Competências de Gestor
  await prisma.competency.create({
    data: {
      nome: 'Delegar tarefas',
      descricao: 'Capacidade de distribuir tarefas adequadamente entre os membros da equipe',
      tipo: 'lideranca',
      competenciaDe: 'gestor',
      criterios: [
        'Identifica as habilidades de cada membro da equipe',
        'Distribui tarefas de forma equilibrada',
        'Acompanha o progresso das tarefas delegadas',
        'Fornece suporte quando necessário'
      ]
    }
  });

  await prisma.competency.create({
    data: {
      nome: 'Comunicação efetiva',
      descricao: 'Habilidade de se comunicar de forma clara e objetiva com a equipe',
      tipo: 'comportamento',
      competenciaDe: 'gestor',
      criterios: [
        'Comunica expectativas de forma clara',
        'Escuta ativamente os membros da equipe',
        'Fornece feedback construtivo',
        'Mantém canais de comunicação abertos'
      ]
    }
  });

  // Competências de Colaborador
  await prisma.competency.create({
    data: {
      nome: 'Trabalho em equipe',
      descricao: 'Capacidade de colaborar efetivamente com outros membros da equipe',
      tipo: 'comportamento',
      competenciaDe: 'colaborador',
      criterios: [
        'Colabora ativamente com colegas',
        'Compartilha conhecimento e recursos',
        'Respeita opiniões diferentes',
        'Contribui para um ambiente positivo'
      ]
    }
  });

  await prisma.competency.create({
    data: {
      nome: 'Resolução de problemas',
      descricao: 'Habilidade de identificar e resolver problemas de forma eficiente',
      tipo: 'tecnica',
      competenciaDe: 'colaborador',
      criterios: [
        'Identifica problemas rapidamente',
        'Analisa causas raiz',
        'Propõe soluções viáveis',
        'Implementa soluções efetivas'
      ]
    }
  });

  // Competências para Todos
  await prisma.competency.create({
    data: {
      nome: 'Pontualidade',
      descricao: 'Compromisso com horários e prazos estabelecidos',
      tipo: 'comportamento',
      competenciaDe: 'todos',
      criterios: [
        'Chega no horário estabelecido',
        'Cumpre prazos de entregas',
        'Avisa com antecedência quando há imprevistos',
        'Respeita o tempo dos outros'
      ]
    }
  });

  await prisma.competency.create({
    data: {
      nome: 'Proatividade',
      descricao: 'Iniciativa para identificar e resolver problemas sem necessidade de supervisão',
      tipo: 'comportamento',
      competenciaDe: 'todos',
      criterios: [
        'Toma iniciativa sem ser solicitado',
        'Identifica oportunidades de melhoria',
        'Busca soluções de forma independente',
        'Antecipa necessidades da equipe'
      ]
    }
  });

  console.log('Competências criadas com sucesso!');
}

seedCompetencies()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Rodar seed de competências:
```bash
node prisma/seed-competencies.js
```

### 8.8 Testar no Postman

**1. Criar competência**
```
POST http://localhost:3000/api/competencies
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "nome": "Liderança de equipe",
  "descricao": "Capacidade de liderar e motivar uma equipe",
  "tipo": "lideranca",
  "competenciaDe": "gestor",
  "criterios": [
    "Inspira e motiva a equipe",
    "Define metas claras",
    "Desenvolve talentos",
    "Toma decisões assertivas"
  ]
}
```

**2. Listar todas as competências**
```
GET http://localhost:3000/api/competencies
Authorization: Bearer SEU_TOKEN
```

**3. Buscar competências por tipo**
```
GET http://localhost:3000/api/competencies/tipo/lideranca
Authorization: Bearer SEU_TOKEN
```

**4. Buscar competências por competenciaDe**
```
GET http://localhost:3000/api/competencies/competencia-de/gestor
Authorization: Bearer SEU_TOKEN
```

**5. Buscar com filtros e paginação**
```
GET http://localhost:3000/api/competencies?page=1&limit=10&tipo=comportamento&search=comunicação
Authorization: Bearer SEU_TOKEN
```

**6. Ver estatísticas**
```
GET http://localhost:3000/api/competencies/stats
Authorization: Bearer SEU_TOKEN
```

**7. Atualizar competência**
```
PUT http://localhost:3000/api/competencies/uuid-da-competencia
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "descricao": "Descrição atualizada",
  "criterios": [
    "Critério 1 atualizado",
    "Critério 2 atualizado",
    "Critério 3 atualizado"
  ]
}
```

**8. Deletar competência (apenas admin)**
```
DELETE http://localhost:3000/api/competencies/uuid-da-competencia
Authorization: Bearer SEU_TOKEN_ADMIN
```

## Resumo

Agora você tem o módulo de competências completo! Ele permite:

- ✅ Criar competências (gestor/admin)
- ✅ Listar competências com filtros e busca
- ✅ Buscar por tipo (desempenho, comportamento, técnica, liderança)
- ✅ Buscar por competenciaDe (gestor, colaborador, todos)
- ✅ Ver estatísticas de competências
- ✅ Atualizar competências (gestor/admin)
- ✅ Deletar competências (apenas admin)
- ✅ Validação de critérios (1 a 10 por competência)
- ✅ Controle de permissões por tipo de usuário

Próximo passo: Módulo Nine Box!
