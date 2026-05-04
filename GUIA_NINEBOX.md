# Guia Completo - Módulo Nine Box

Este guia ensina como implementar o módulo Nine Box do zero.

## Parte 9: Módulo Nine Box (1h)

### 9.1 Criar ninebox.validation.js

Arquivo: `src/modules/ninebox/ninebox.validation.js`

```javascript
import Joi from 'joi';

const createNineBoxSchema = Joi.object({
  pessoaId: Joi.string().uuid().required(),
  performance: Joi.number().integer().min(1).max(3).required()
    .messages({
      'number.min': 'Performance deve ser entre 1 (baixo) e 3 (alto)',
      'number.max': 'Performance deve ser entre 1 (baixo) e 3 (alto)'
    }),
  potential: Joi.number().integer().min(1).max(3).required()
    .messages({
      'number.min': 'Potential deve ser entre 1 (baixo) e 3 (alto)',
      'number.max': 'Potential deve ser entre 1 (baixo) e 3 (alto)'
    }),
  comentario: Joi.string().max(500).optional().allow('', null)
});

const updateNineBoxSchema = Joi.object({
  performance: Joi.number().integer().min(1).max(3).optional(),
  potential: Joi.number().integer().min(1).max(3).optional(),
  comentario: Joi.string().max(500).optional().allow('', null)
});

const queryNineBoxSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  categoria: Joi.string().optional(),
  pessoaId: Joi.string().uuid().optional()
});

export {
  createNineBoxSchema,
  updateNineBoxSchema,
  queryNineBoxSchema
};
```

### 9.2 Criar ninebox.repository.js

Arquivo: `src/modules/ninebox/ninebox.repository.js`

```javascript
import { prisma } from '../../config/database.js';

class NineBoxRepository {
  async create(data) {
    return prisma.nineBox.create({
      data,
      include: {
        pessoa: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            cargo: true,
            departamento: true,
            foto: true
          }
        }
      }
    });
  }

  async findById(id) {
    return prisma.nineBox.findUnique({
      where: { id },
      include: {
        pessoa: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            cargo: true,
            departamento: true,
            foto: true
          }
        }
      }
    });
  }

  async findAll({ page = 1, limit = 10, categoria, pessoaId }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (categoria) where.categoria = categoria;
    if (pessoaId) where.pessoaId = pessoaId;

    const [nineBoxes, total] = await Promise.all([
      prisma.nineBox.findMany({
        where,
        skip,
        take: limit,
        include: {
          pessoa: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              cargo: true,
              departamento: true,
              foto: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.nineBox.count({ where })
    ]);

    return {
      nineBoxes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByPessoa(pessoaId) {
    return prisma.nineBox.findMany({
      where: { pessoaId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findLatestByPessoa(pessoaId) {
    return prisma.nineBox.findFirst({
      where: { pessoaId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id, data) {
    return prisma.nineBox.update({
      where: { id },
      data,
      include: {
        pessoa: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            cargo: true,
            departamento: true,
            foto: true
          }
        }
      }
    });
  }

  async delete(id) {
    return prisma.nineBox.delete({ where: { id } });
  }

  async getGridDistribution() {
    const nineBoxes = await prisma.nineBox.findMany({
      select: {
        categoria: true,
        performance: true,
        potential: true
      }
    });

    // Agrupa por categoria
    const distribution = nineBoxes.reduce((acc, nb) => {
      if (!acc[nb.categoria]) {
        acc[nb.categoria] = 0;
      }
      acc[nb.categoria]++;
      return acc;
    }, {});

    // Agrupa por coordenadas (performance, potential)
    const byCoordinates = nineBoxes.reduce((acc, nb) => {
      const key = `${nb.performance}-${nb.potential}`;
      if (!acc[key]) {
        acc[key] = {
          performance: nb.performance,
          potential: nb.potential,
          categoria: nb.categoria,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    return {
      total: nineBoxes.length,
      porCategoria: distribution,
      porCoordenadas: Object.values(byCoordinates)
    };
  }

  async getStatsByTipo() {
    const nineBoxes = await prisma.nineBox.findMany({
      include: {
        pessoa: {
          select: {
            tipo: true
          }
        }
      }
    });

    const porTipo = nineBoxes.reduce((acc, nb) => {
      const tipo = nb.pessoa.tipo;
      if (!acc[tipo]) {
        acc[tipo] = {
          total: 0,
          categorias: {}
        };
      }
      acc[tipo].total++;
      if (!acc[tipo].categorias[nb.categoria]) {
        acc[tipo].categorias[nb.categoria] = 0;
      }
      acc[tipo].categorias[nb.categoria]++;
      return acc;
    }, {});

    return porTipo;
  }
}

export { NineBoxRepository };
```

### 9.3 Criar ninebox.service.js

Arquivo: `src/modules/ninebox/ninebox.service.js`

```javascript
import { AppError } from '../../utils/errors.js';
import { UserRepository } from '../users/user.repository.js';

class NineBoxService {
  constructor(nineBoxRepository) {
    this.nineBoxRepository = nineBoxRepository;
    this.userRepository = new UserRepository();
  }

  // Calcula a categoria baseada em performance e potential
  calculateCategoria(performance, potential) {
    const categorias = {
      '1-1': 'Questão',
      '2-1': 'Trabalhador',
      '3-1': 'Âncora',
      '1-2': 'Dilema',
      '2-2': 'Núcleo',
      '3-2': 'Especialista',
      '1-3': 'Enigma',
      '2-3': 'Estrela',
      '3-3': 'Superstar'
    };

    return categorias[`${performance}-${potential}`] || 'Indefinido';
  }

  async create(data, userTipo) {
    // Apenas gestor e admin podem criar avaliações Nine Box
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para criar avaliações Nine Box', 403);
    }

    // Verifica se a pessoa existe
    const pessoa = await this.userRepository.findById(data.pessoaId);
    if (!pessoa) {
      throw new AppError('Pessoa não encontrada', 404);
    }

    // Calcula a categoria
    const categoria = this.calculateCategoria(data.performance, data.potential);

    // Cria a avaliação
    const nineBox = await this.nineBoxRepository.create({
      ...data,
      categoria
    });

    return nineBox;
  }

  async findById(id, userId, userTipo) {
    const nineBox = await this.nineBoxRepository.findById(id);
    if (!nineBox) {
      throw new AppError('Avaliação Nine Box não encontrada', 404);
    }

    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador' && nineBox.pessoaId !== userId) {
      throw new AppError('Sem permissão para ver esta avaliação', 403);
    }

    return nineBox;
  }

  async findAll(filters, userId, userTipo) {
    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador') {
      filters.pessoaId = userId;
    }

    return this.nineBoxRepository.findAll(filters);
  }

  async findByPessoa(pessoaId, userId, userTipo) {
    // Verifica se a pessoa existe
    const pessoa = await this.userRepository.findById(pessoaId);
    if (!pessoa) {
      throw new AppError('Pessoa não encontrada', 404);
    }

    // Colaborador só pode ver suas próprias avaliações
    if (userTipo === 'colaborador' && pessoaId !== userId) {
      throw new AppError('Sem permissão para ver estas avaliações', 403);
    }

    return this.nineBoxRepository.findByPessoa(pessoaId);
  }

  async findLatestByPessoa(pessoaId, userId, userTipo) {
    // Verifica se a pessoa existe
    const pessoa = await this.userRepository.findById(pessoaId);
    if (!pessoa) {
      throw new AppError('Pessoa não encontrada', 404);
    }

    // Colaborador só pode ver sua própria avaliação
    if (userTipo === 'colaborador' && pessoaId !== userId) {
      throw new AppError('Sem permissão para ver esta avaliação', 403);
    }

    const nineBox = await this.nineBoxRepository.findLatestByPessoa(pessoaId);
    if (!nineBox) {
      throw new AppError('Nenhuma avaliação Nine Box encontrada para esta pessoa', 404);
    }

    return nineBox;
  }

  async update(id, data, userTipo) {
    // Apenas gestor e admin podem atualizar
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para atualizar avaliações Nine Box', 403);
    }

    const nineBox = await this.nineBoxRepository.findById(id);
    if (!nineBox) {
      throw new AppError('Avaliação Nine Box não encontrada', 404);
    }

    // Recalcula categoria se performance ou potential mudaram
    if (data.performance || data.potential) {
      const performance = data.performance || nineBox.performance;
      const potential = data.potential || nineBox.potential;
      data.categoria = this.calculateCategoria(performance, potential);
    }

    return this.nineBoxRepository.update(id, data);
  }

  async delete(id, userTipo) {
    // Apenas admin pode deletar
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para deletar avaliações Nine Box', 403);
    }

    const nineBox = await this.nineBoxRepository.findById(id);
    if (!nineBox) {
      throw new AppError('Avaliação Nine Box não encontrada', 404);
    }

    await this.nineBoxRepository.delete(id);
    return { message: 'Avaliação Nine Box deletada com sucesso' };
  }

  async getGridDistribution(userTipo) {
    // Colaborador não pode ver distribuição geral
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para ver distribuição do grid', 403);
    }

    return this.nineBoxRepository.getGridDistribution();
  }

  async getStatsByTipo(userTipo) {
    // Apenas admin pode ver estatísticas por tipo
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para ver estatísticas por tipo', 403);
    }

    return this.nineBoxRepository.getStatsByTipo();
  }
}

export { NineBoxService };
```

### 9.4 Criar ninebox.controller.js

Arquivo: `src/modules/ninebox/ninebox.controller.js`

```javascript
import { NineBoxRepository } from './ninebox.repository.js';
import { NineBoxService } from './ninebox.service.js';

const nineBoxRepository = new NineBoxRepository();
const nineBoxService = new NineBoxService(nineBoxRepository);

class NineBoxController {
  async create(req, res, next) {
    try {
      const nineBox = await nineBoxService.create(req.body, req.user.tipo);
      return res.status(201).json({
        success: true,
        data: nineBox,
        message: 'Avaliação Nine Box criada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const nineBox = await nineBoxService.findById(
        req.params.id,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: nineBox
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const { page, limit, categoria, pessoaId } = req.query;
      const result = await nineBoxService.findAll(
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          categoria,
          pessoaId
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

  async findByPessoa(req, res, next) {
    try {
      const nineBoxes = await nineBoxService.findByPessoa(
        req.params.pessoaId,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: nineBoxes
      });
    } catch (error) {
      next(error);
    }
  }

  async findLatestByPessoa(req, res, next) {
    try {
      const nineBox = await nineBoxService.findLatestByPessoa(
        req.params.pessoaId,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: nineBox
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const nineBox = await nineBoxService.update(
        req.params.id,
        req.body,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: nineBox,
        message: 'Avaliação Nine Box atualizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await nineBoxService.delete(req.params.id, req.user.tipo);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getGridDistribution(req, res, next) {
    try {
      const distribution = await nineBoxService.getGridDistribution(req.user.tipo);
      return res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatsByTipo(req, res, next) {
    try {
      const stats = await nineBoxService.getStatsByTipo(req.user.tipo);
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export { NineBoxController };
```

### 9.5 Criar ninebox.routes.js

Arquivo: `src/modules/ninebox/ninebox.routes.js`

```javascript
import express from 'express';
import { NineBoxController } from './ninebox.controller.js';
import { authMiddleware, isGestorOrAdminMiddleware, isAdminMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createNineBoxSchema, updateNineBoxSchema } from './ninebox.validation.js';

const router = express.Router();
const nineBoxController = new NineBoxController();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Rotas públicas (autenticadas)
router.get('/', (req, res, next) => nineBoxController.findAll(req, res, next));
router.get('/:id', (req, res, next) => nineBoxController.findById(req, res, next));
router.get('/pessoa/:pessoaId', (req, res, next) => nineBoxController.findByPessoa(req, res, next));
router.get('/pessoa/:pessoaId/latest', (req, res, next) => nineBoxController.findLatestByPessoa(req, res, next));

// Rotas de gestor/admin
router.get('/stats/distribution', isGestorOrAdminMiddleware, (req, res, next) => nineBoxController.getGridDistribution(req, res, next));
router.post('/', isGestorOrAdminMiddleware, validate(createNineBoxSchema), (req, res, next) => nineBoxController.create(req, res, next));
router.put('/:id', isGestorOrAdminMiddleware, validate(updateNineBoxSchema), (req, res, next) => nineBoxController.update(req, res, next));

// Rotas de admin
router.get('/stats/tipo', isAdminMiddleware, (req, res, next) => nineBoxController.getStatsByTipo(req, res, next));
router.delete('/:id', isAdminMiddleware, (req, res, next) => nineBoxController.delete(req, res, next));

export default router;
```

### 9.6 Adicionar rota no app.js

Arquivo: `src/app.js` (adicionar linha)

```javascript
import nineBoxRoutes from './modules/ninebox/ninebox.routes.js';

// ... outras rotas ...

app.use('/api/ninebox', nineBoxRoutes);
```

### 9.7 Testar no Postman

**1. Criar avaliação Nine Box**
```
POST http://localhost:3000/api/ninebox
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "pessoaId": "uuid-da-pessoa",
  "performance": 3,
  "potential": 3,
  "comentario": "Excelente desempenho e alto potencial de crescimento"
}
```

**2. Listar todas as avaliações**
```
GET http://localhost:3000/api/ninebox
Authorization: Bearer SEU_TOKEN
```

**3. Buscar avaliações de uma pessoa**
```
GET http://localhost:3000/api/ninebox/pessoa/uuid-da-pessoa
Authorization: Bearer SEU_TOKEN
```

**4. Buscar última avaliação de uma pessoa**
```
GET http://localhost:3000/api/ninebox/pessoa/uuid-da-pessoa/latest
Authorization: Bearer SEU_TOKEN
```

**5. Ver distribuição do grid**
```
GET http://localhost:3000/api/ninebox/stats/distribution
Authorization: Bearer SEU_TOKEN_GESTOR
```

**6. Ver estatísticas por tipo (admin)**
```
GET http://localhost:3000/api/ninebox/stats/tipo
Authorization: Bearer SEU_TOKEN_ADMIN
```

**7. Atualizar avaliação**
```
PUT http://localhost:3000/api/ninebox/uuid-da-avaliacao
Authorization: Bearer SEU_TOKEN_GESTOR
Content-Type: application/json

{
  "performance": 2,
  "potential": 3,
  "comentario": "Comentário atualizado"
}
```

**8. Deletar avaliação (admin)**
```
DELETE http://localhost:3000/api/ninebox/uuid-da-avaliacao
Authorization: Bearer SEU_TOKEN_ADMIN
```

## Categorias do Nine Box

O sistema calcula automaticamente a categoria baseada em Performance e Potential:

| Performance | Potential | Categoria |
|------------|-----------|-----------|
| 1 (Baixo) | 1 (Baixo) | Questão |
| 2 (Médio) | 1 (Baixo) | Trabalhador |
| 3 (Alto) | 1 (Baixo) | Âncora |
| 1 (Baixo) | 2 (Médio) | Dilema |
| 2 (Médio) | 2 (Médio) | Núcleo |
| 3 (Alto) | 2 (Médio) | Especialista |
| 1 (Baixo) | 3 (Alto) | Enigma |
| 2 (Médio) | 3 (Alto) | Estrela |
| 3 (Alto) | 3 (Alto) | Superstar |

## Resumo

Agora você tem o módulo Nine Box completo! Ele permite:

- ✅ Criar avaliações Nine Box (gestor/admin)
- ✅ Cálculo automático de categoria
- ✅ Listar avaliações com filtros
- ✅ Ver histórico de avaliações por pessoa
- ✅ Ver última avaliação de uma pessoa
- ✅ Ver distribuição do grid (gestor/admin)
- ✅ Ver estatísticas por tipo de usuário (admin)
- ✅ Atualizar avaliações (gestor/admin)
- ✅ Deletar avaliações (admin)
- ✅ Controle de permissões por tipo de usuário
- ✅ Validação de valores (1-3 para performance e potential)

Próximo passo: Módulo de Relatórios e Deploy!
