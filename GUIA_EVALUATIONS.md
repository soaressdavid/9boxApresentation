# Guia Completo - Módulo de Avaliações (Evaluations)

Este guia ensina como implementar o módulo de avaliações do zero, seguindo o mesmo padrão do módulo de usuários.

## Parte 7: Módulo de Avaliações (1h30)

### 7.1 Criar evaluation.validation.js

Arquivo: `src/modules/evaluations/evaluation.validation.js`

```javascript
import Joi from 'joi';

const createEvaluationSchema = Joi.object({
  avaliadoId: Joi.string().uuid().required(),
  tipo: Joi.string().valid('gestor', 'colaborador').required(),
  criterios: Joi.object().required(),
  media: Joi.number().min(0).max(5).optional(),
  comentario: Joi.string().optional().allow('', null)
});

const updateEvaluationSchema = Joi.object({
  criterios: Joi.object().optional(),
  media: Joi.number().min(0).max(5).optional(),
  comentario: Joi.string().optional().allow('', null)
});

const queryEvaluationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tipo: Joi.string().valid('gestor', 'colaborador').optional(),
  avaliadoId: Joi.string().uuid().optional(),
  avaliadorId: Joi.string().uuid().optional()
});

export {
  createEvaluationSchema,
  updateEvaluationSchema,
  queryEvaluationSchema
};
```

### 7.2 Criar evaluation.repository.js

Arquivo: `src/modules/evaluations/evaluation.repository.js`

```javascript
import { prisma } from '../../config/database.js';

class EvaluationRepository {
  async create(data) {
    return prisma.evaluation.create({
      data,
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        }
      }
    });
  }

  async findById(id) {
    return prisma.evaluation.findUnique({
      where: { id },
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        }
      }
    });
  }

  async findAll({ page = 1, limit = 10, tipo, avaliadoId, avaliadorId }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (avaliadoId) where.avaliadoId = avaliadoId;
    if (avaliadorId) where.avaliadorId = avaliadorId;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        skip,
        take: limit,
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              foto: true
            }
          },
          avaliado: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              foto: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.evaluation.count({ where })
    ]);

    return {
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByAvaliado(avaliadoId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where: { avaliadoId },
        skip,
        take: limit,
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              foto: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.evaluation.count({ where: { avaliadoId } })
    ]);

    return {
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByAvaliador(avaliadorId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where: { avaliadorId },
        skip,
        take: limit,
        include: {
          avaliado: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              foto: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.evaluation.count({ where: { avaliadorId } })
    ]);

    return {
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, data) {
    return prisma.evaluation.update({
      where: { id },
      data,
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            foto: true
          }
        }
      }
    });
  }

  async delete(id) {
    return prisma.evaluation.delete({ where: { id } });
  }

  async getStatsByAvaliado(avaliadoId) {
    const evaluations = await prisma.evaluation.findMany({
      where: { avaliadoId },
      select: {
        media: true,
        tipo: true,
        data: true
      }
    });

    const total = evaluations.length;
    const mediaGeral = total > 0
      ? evaluations.reduce((sum, ev) => sum + (ev.media || 0), 0) / total
      : 0;

    const porTipo = evaluations.reduce((acc, ev) => {
      if (!acc[ev.tipo]) {
        acc[ev.tipo] = { count: 0, mediaSum: 0 };
      }
      acc[ev.tipo].count++;
      acc[ev.tipo].mediaSum += ev.media || 0;
      return acc;
    }, {});

    const estatisticas = Object.entries(porTipo).map(([tipo, data]) => ({
      tipo,
      total: data.count,
      media: data.mediaSum / data.count
    }));

    return {
      total,
      mediaGeral: parseFloat(mediaGeral.toFixed(2)),
      estatisticas
    };
  }
}

export { EvaluationRepository };
```

### 7.3 Criar evaluation.service.js

Arquivo: `src/modules/evaluations/evaluation.service.js`

```javascript
import { AppError } from '../../utils/errors.js';
import { UserRepository } from '../users/user.repository.js';

class EvaluationService {
  constructor(evaluationRepository) {
    this.evaluationRepository = evaluationRepository;
    this.userRepository = new UserRepository();
  }

  async create(avaliadorId, data) {
    // Verifica se o avaliado existe
    const avaliado = await this.userRepository.findById(data.avaliadoId);
    if (!avaliado) {
      throw new AppError('Avaliado não encontrado', 404);
    }

    // Não pode avaliar a si mesmo
    if (avaliadorId === data.avaliadoId) {
      throw new AppError('Não é possível avaliar a si mesmo', 400);
    }

    // Cria a avaliação
    const evaluation = await this.evaluationRepository.create({
      ...data,
      avaliadorId
    });

    return evaluation;
  }

  async findById(id, userId, userTipo) {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new AppError('Avaliação não encontrada', 404);
    }

    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador' && 
        evaluation.avaliadoId !== userId && 
        evaluation.avaliadorId !== userId) {
      throw new AppError('Sem permissão para ver esta avaliação', 403);
    }

    return evaluation;
  }

  async findAll(filters, userId, userTipo) {
    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador') {
      filters.avaliadoId = userId;
    }

    return this.evaluationRepository.findAll(filters);
  }

  async findByAvaliado(avaliadoId, pagination, userId, userTipo) {
    // Verifica se o avaliado existe
    const avaliado = await this.userRepository.findById(avaliadoId);
    if (!avaliado) {
      throw new AppError('Avaliado não encontrado', 404);
    }

    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador' && avaliadoId !== userId) {
      throw new AppError('Sem permissão para ver estas avaliações', 403);
    }

    return this.evaluationRepository.findByAvaliado(avaliadoId, pagination);
  }

  async findByAvaliador(avaliadorId, pagination, userId, userTipo) {
    // Colaborador só pode ver avaliações que fez
    if (userTipo === 'colaborador' && avaliadorId !== userId) {
      throw new AppError('Sem permissão para ver estas avaliações', 403);
    }

    return this.evaluationRepository.findByAvaliador(avaliadorId, pagination);
  }

  async update(id, data, userId, userTipo) {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new AppError('Avaliação não encontrada', 404);
    }

    // Apenas o avaliador ou admin pode editar
    if (userTipo !== 'admin' && evaluation.avaliadorId !== userId) {
      throw new AppError('Sem permissão para editar esta avaliação', 403);
    }

    return this.evaluationRepository.update(id, data);
  }

  async delete(id, userId, userTipo) {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new AppError('Avaliação não encontrada', 404);
    }

    // Apenas o avaliador ou admin pode deletar
    if (userTipo !== 'admin' && evaluation.avaliadorId !== userId) {
      throw new AppError('Sem permissão para deletar esta avaliação', 403);
    }

    await this.evaluationRepository.delete(id);
    return { message: 'Avaliação deletada com sucesso' };
  }

  async getStatsByAvaliado(avaliadoId, userId, userTipo) {
    // Verifica se o avaliado existe
    const avaliado = await this.userRepository.findById(avaliadoId);
    if (!avaliado) {
      throw new AppError('Avaliado não encontrado', 404);
    }

    // Colaborador só pode ver suas próprias estatísticas
    if (userTipo === 'colaborador' && avaliadoId !== userId) {
      throw new AppError('Sem permissão para ver estas estatísticas', 403);
    }

    return this.evaluationRepository.getStatsByAvaliado(avaliadoId);
  }
}

export { EvaluationService };
```

### 7.4 Criar evaluation.controller.js

Arquivo: `src/modules/evaluations/evaluation.controller.js`

```javascript
import { EvaluationRepository } from './evaluation.repository.js';
import { EvaluationService } from './evaluation.service.js';

const evaluationRepository = new EvaluationRepository();
const evaluationService = new EvaluationService(evaluationRepository);

class EvaluationController {
  async create(req, res, next) {
    try {
      const evaluation = await evaluationService.create(req.user.userId, req.body);
      return res.status(201).json({
        success: true,
        data: evaluation,
        message: 'Avaliação criada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const evaluation = await evaluationService.findById(
        req.params.id,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const { page, limit, tipo, avaliadoId, avaliadorId } = req.query;
      const result = await evaluationService.findAll(
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          tipo,
          avaliadoId,
          avaliadorId
        },
        req.user.userId,
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

  async findByAvaliado(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await evaluationService.findByAvaliado(
        req.params.avaliadoId,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10
        },
        req.user.userId,
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

  async findByAvaliador(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await evaluationService.findByAvaliador(
        req.params.avaliadorId,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10
        },
        req.user.userId,
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

  async update(req, res, next) {
    try {
      const evaluation = await evaluationService.update(
        req.params.id,
        req.body,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: evaluation,
        message: 'Avaliação atualizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await evaluationService.delete(
        req.params.id,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatsByAvaliado(req, res, next) {
    try {
      const stats = await evaluationService.getStatsByAvaliado(
        req.params.avaliadoId,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export { EvaluationController };
```

### 7.5 Criar evaluation.routes.js

Arquivo: `src/modules/evaluations/evaluation.routes.js`

```javascript
import express from 'express';
import { EvaluationController } from './evaluation.controller.js';
import { authMiddleware, isGestorOrAdminMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createEvaluationSchema, updateEvaluationSchema } from './evaluation.validation.js';

const router = express.Router();
const evaluationController = new EvaluationController();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Rotas públicas (autenticadas)
router.get('/', (req, res, next) => evaluationController.findAll(req, res, next));
router.get('/:id', (req, res, next) => evaluationController.findById(req, res, next));
router.get('/avaliado/:avaliadoId', (req, res, next) => evaluationController.findByAvaliado(req, res, next));
router.get('/avaliador/:avaliadorId', (req, res, next) => evaluationController.findByAvaliador(req, res, next));
router.get('/stats/avaliado/:avaliadoId', (req, res, next) => evaluationController.getStatsByAvaliado(req, res, next));

// Rotas de gestor/admin
router.post('/', isGestorOrAdminMiddleware, validate(createEvaluationSchema), (req, res, next) => evaluationController.create(req, res, next));
router.put('/:id', isGestorOrAdminMiddleware, validate(updateEvaluationSchema), (req, res, next) => evaluationController.update(req, res, next));
router.delete('/:id', isGestorOrAdminMiddleware, (req, res, next) => evaluationController.delete(req, res, next));

export default router;
```

### 7.6 Adicionar rota no app.js

Arquivo: `src/app.js` (adicionar linha)

```javascript
import evaluationRoutes from './modules/evaluations/evaluation.routes.js';

// ... outras rotas ...

app.use('/api/evaluations', evaluationRoutes);
```

### 7.7 Testar no Postman

**1. Criar avaliação**
```
POST http://localhost:3000/api/evaluations
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "avaliadoId": "uuid-do-colaborador",
  "tipo": "colaborador",
  "criterios": {
    "pontualidade": 5,
    "comunicacao": 4,
    "tecnico": 5,
    "proatividade": 4,
    "equipe": 5
  },
  "media": 4.6,
  "comentario": "Excelente colaborador, muito dedicado"
}
```

**2. Listar todas as avaliações**
```
GET http://localhost:3000/api/evaluations
Authorization: Bearer SEU_TOKEN
```

**3. Buscar avaliações de um avaliado**
```
GET http://localhost:3000/api/evaluations/avaliado/uuid-do-colaborador
Authorization: Bearer SEU_TOKEN
```

**4. Buscar estatísticas de um avaliado**
```
GET http://localhost:3000/api/evaluations/stats/avaliado/uuid-do-colaborador
Authorization: Bearer SEU_TOKEN
```

**5. Atualizar avaliação**
```
PUT http://localhost:3000/api/evaluations/uuid-da-avaliacao
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "media": 4.8,
  "comentario": "Comentário atualizado"
}
```

**6. Deletar avaliação**
```
DELETE http://localhost:3000/api/evaluations/uuid-da-avaliacao
Authorization: Bearer SEU_TOKEN_GESTOR
```

## Resumo

Agora você tem o módulo de avaliações completo! Ele permite:

- ✅ Criar avaliações (gestor/admin)
- ✅ Listar avaliações com filtros
- ✅ Ver avaliações por avaliado
- ✅ Ver avaliações por avaliador
- ✅ Ver estatísticas de um avaliado
- ✅ Atualizar avaliações
- ✅ Deletar avaliações
- ✅ Controle de permissões por tipo de usuário

Próximo passo: Módulo de Competências!
