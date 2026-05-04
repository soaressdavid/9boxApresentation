# Guia Completo - Módulo de Relatórios (Reports)

Este guia ensina como implementar o módulo de relatórios do zero.

## Parte 10: Módulo de Relatórios (45 min)

### 10.1 Criar reports.service.js

Arquivo: `src/modules/reports/reports.service.js`

```javascript
import { AppError } from '../../utils/errors.js';
import { UserRepository } from '../users/user.repository.js';
import { EvaluationRepository } from '../evaluations/evaluation.repository.js';
import { NineBoxRepository } from '../ninebox/ninebox.repository.js';
import { CompetencyRepository } from '../competencies/competency.repository.js';

class ReportsService {
  constructor() {
    this.userRepository = new UserRepository();
    this.evaluationRepository = new EvaluationRepository();
    this.nineBoxRepository = new NineBoxRepository();
    this.competencyRepository = new CompetencyRepository();
  }

  async getDashboardStats(userTipo) {
    // Colaborador não pode ver dashboard geral
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para ver dashboard geral', 403);
    }

    // Busca dados de todas as entidades
    const [users, evaluations, nineBoxes, competencies] = await Promise.all([
      this.userRepository.findAll({ page: 1, limit: 1000 }),
      this.evaluationRepository.findAll({ page: 1, limit: 1000 }),
      this.nineBoxRepository.findAll({ page: 1, limit: 1000 }),
      this.competencyRepository.findAll({ page: 1, limit: 1000 })
    ]);

    // Estatísticas de usuários
    const userStats = {
      total: users.pagination.total,
      porTipo: users.users.reduce((acc, user) => {
        acc[user.tipo] = (acc[user.tipo] || 0) + 1;
        return acc;
      }, {})
    };

    // Estatísticas de avaliações
    const evaluationStats = {
      total: evaluations.pagination.total,
      porTipo: evaluations.evaluations.reduce((acc, ev) => {
        acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
        return acc;
      }, {}),
      mediaGeral: evaluations.evaluations.length > 0
        ? evaluations.evaluations.reduce((sum, ev) => sum + (ev.media || 0), 0) / evaluations.evaluations.length
        : 0
    };

    // Estatísticas de Nine Box
    const nineBoxStats = await this.nineBoxRepository.getGridDistribution();

    // Estatísticas de competências
    const competencyStats = await this.competencyRepository.getStatsByTipo();

    return {
      usuarios: userStats,
      avaliacoes: evaluationStats,
      nineBox: nineBoxStats,
      competencias: competencyStats,
      timestamp: new Date().toISOString()
    };
  }

  async getUserReport(userId, requestUserId, requestUserTipo) {
    // Colaborador só pode ver seu próprio relatório
    if (requestUserTipo === 'colaborador' && userId !== requestUserId) {
      throw new AppError('Sem permissão para ver este relatório', 403);
    }

    // Busca dados do usuário
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Busca avaliações recebidas
    const evaluationsReceived = await this.evaluationRepository.findByAvaliado(userId, { page: 1, limit: 1000 });

    // Busca avaliações feitas
    const evaluationsMade = await this.evaluationRepository.findByAvaliador(userId, { page: 1, limit: 1000 });

    // Busca avaliações Nine Box
    const nineBoxes = await this.nineBoxRepository.findByPessoa(userId);

    // Calcula estatísticas de avaliações recebidas
    const receivedStats = {
      total: evaluationsReceived.evaluations.length,
      mediaGeral: evaluationsReceived.evaluations.length > 0
        ? evaluationsReceived.evaluations.reduce((sum, ev) => sum + (ev.media || 0), 0) / evaluationsReceived.evaluations.length
        : 0,
      porTipo: evaluationsReceived.evaluations.reduce((acc, ev) => {
        acc[ev.tipo] = (acc[ev.tipo] || 0) + 1;
        return acc;
      }, {})
    };

    // Última avaliação Nine Box
    const latestNineBox = nineBoxes.length > 0 ? nineBoxes[0] : null;

    // Remove senha do usuário
    delete user.senha;

    return {
      usuario: user,
      avaliacoesRecebidas: {
        ...receivedStats,
        lista: evaluationsReceived.evaluations
      },
      avaliacoesFeitas: {
        total: evaluationsMade.evaluations.length,
        lista: evaluationsMade.evaluations
      },
      nineBox: {
        total: nineBoxes.length,
        ultima: latestNineBox,
        historico: nineBoxes
      },
      timestamp: new Date().toISOString()
    };
  }

  async getEvaluationsReport(filters, userTipo) {
    // Colaborador não pode ver relatório geral
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para ver relatório geral de avaliações', 403);
    }

    const evaluations = await this.evaluationRepository.findAll({
      page: 1,
      limit: 1000,
      ...filters
    });

    // Agrupa por avaliado
    const byAvaliado = evaluations.evaluations.reduce((acc, ev) => {
      const key = ev.avaliadoId;
      if (!acc[key]) {
        acc[key] = {
          avaliado: ev.avaliado,
          avaliacoes: [],
          mediaGeral: 0
        };
      }
      acc[key].avaliacoes.push(ev);
      return acc;
    }, {});

    // Calcula média por avaliado
    Object.values(byAvaliado).forEach(item => {
      const total = item.avaliacoes.reduce((sum, ev) => sum + (ev.media || 0), 0);
      item.mediaGeral = item.avaliacoes.length > 0 ? total / item.avaliacoes.length : 0;
    });

    // Agrupa por tipo
    const byTipo = evaluations.evaluations.reduce((acc, ev) => {
      if (!acc[ev.tipo]) {
        acc[ev.tipo] = {
          total: 0,
          mediaGeral: 0,
          avaliacoes: []
        };
      }
      acc[ev.tipo].total++;
      acc[ev.tipo].avaliacoes.push(ev);
      return acc;
    }, {});

    // Calcula média por tipo
    Object.values(byTipo).forEach(item => {
      const total = item.avaliacoes.reduce((sum, ev) => sum + (ev.media || 0), 0);
      item.mediaGeral = item.avaliacoes.length > 0 ? total / item.avaliacoes.length : 0;
    });

    return {
      total: evaluations.pagination.total,
      porAvaliado: Object.values(byAvaliado),
      porTipo: byTipo,
      avaliacoes: evaluations.evaluations,
      timestamp: new Date().toISOString()
    };
  }

  async getNineBoxReport(userTipo) {
    // Colaborador não pode ver relatório geral
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para ver relatório geral de Nine Box', 403);
    }

    const distribution = await this.nineBoxRepository.getGridDistribution();
    const byTipo = await this.nineBoxRepository.getStatsByTipo();

    const allNineBoxes = await this.nineBoxRepository.findAll({ page: 1, limit: 1000 });

    // Agrupa por pessoa (última avaliação)
    const byPessoa = {};
    allNineBoxes.nineBoxes.forEach(nb => {
      if (!byPessoa[nb.pessoaId] || new Date(nb.createdAt) > new Date(byPessoa[nb.pessoaId].createdAt)) {
        byPessoa[nb.pessoaId] = nb;
      }
    });

    return {
      distribuicao: distribution,
      porTipo: byTipo,
      porPessoa: Object.values(byPessoa),
      timestamp: new Date().toISOString()
    };
  }

  async getCompetenciesReport(userTipo) {
    // Colaborador não pode ver relatório geral
    if (userTipo === 'colaborador') {
      throw new AppError('Sem permissão para ver relatório geral de competências', 403);
    }

    const stats = await this.competencyRepository.getStatsByTipo();
    const competencies = await this.competencyRepository.findAll({ page: 1, limit: 1000 });

    // Agrupa por tipo
    const byTipo = competencies.competencies.reduce((acc, comp) => {
      if (!acc[comp.tipo]) {
        acc[comp.tipo] = [];
      }
      acc[comp.tipo].push(comp);
      return acc;
    }, {});

    // Agrupa por competenciaDe
    const byCompetenciaDe = competencies.competencies.reduce((acc, comp) => {
      if (!acc[comp.competenciaDe]) {
        acc[comp.competenciaDe] = [];
      }
      acc[comp.competenciaDe].push(comp);
      return acc;
    }, {});

    return {
      total: competencies.pagination.total,
      estatisticas: stats,
      porTipo: byTipo,
      porCompetenciaDe: byCompetenciaDe,
      competencias: competencies.competencies,
      timestamp: new Date().toISOString()
    };
  }

  async exportData(userTipo) {
    // Apenas admin pode exportar todos os dados
    if (userTipo !== 'admin') {
      throw new AppError('Sem permissão para exportar dados', 403);
    }

    const [users, evaluations, nineBoxes, competencies] = await Promise.all([
      this.userRepository.findAll({ page: 1, limit: 10000 }),
      this.evaluationRepository.findAll({ page: 1, limit: 10000 }),
      this.nineBoxRepository.findAll({ page: 1, limit: 10000 }),
      this.competencyRepository.findAll({ page: 1, limit: 10000 })
    ]);

    // Remove senhas dos usuários
    users.users.forEach(user => delete user.senha);

    return {
      exportDate: new Date().toISOString(),
      data: {
        usuarios: users.users,
        avaliacoes: evaluations.evaluations,
        nineBox: nineBoxes.nineBoxes,
        competencias: competencies.competencies
      }
    };
  }
}

export { ReportsService };
```

### 10.2 Criar reports.controller.js

Arquivo: `src/modules/reports/reports.controller.js`

```javascript
import { ReportsService } from './reports.service.js';

const reportsService = new ReportsService();

class ReportsController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await reportsService.getDashboardStats(req.user.tipo);
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReport(req, res, next) {
    try {
      const report = await reportsService.getUserReport(
        req.params.userId,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReport(req, res, next) {
    try {
      const report = await reportsService.getUserReport(
        req.user.userId,
        req.user.userId,
        req.user.tipo
      );
      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getEvaluationsReport(req, res, next) {
    try {
      const { tipo, avaliadoId, avaliadorId } = req.query;
      const report = await reportsService.getEvaluationsReport(
        { tipo, avaliadoId, avaliadorId },
        req.user.tipo
      );
      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getNineBoxReport(req, res, next) {
    try {
      const report = await reportsService.getNineBoxReport(req.user.tipo);
      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompetenciesReport(req, res, next) {
    try {
      const report = await reportsService.getCompetenciesReport(req.user.tipo);
      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  async exportData(req, res, next) {
    try {
      const data = await reportsService.exportData(req.user.tipo);
      
      // Define headers para download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.json`);
      
      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

export { ReportsController };
```

### 10.3 Criar reports.routes.js

Arquivo: `src/modules/reports/reports.routes.js`

```javascript
import express from 'express';
import { ReportsController } from './reports.controller.js';
import { authMiddleware, isGestorOrAdminMiddleware, isAdminMiddleware } from '../../middlewares/auth.js';

const router = express.Router();
const reportsController = new ReportsController();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Rotas públicas (autenticadas)
router.get('/me', (req, res, next) => reportsController.getMyReport(req, res, next));

// Rotas de gestor/admin
router.get('/dashboard', isGestorOrAdminMiddleware, (req, res, next) => reportsController.getDashboardStats(req, res, next));
router.get('/user/:userId', isGestorOrAdminMiddleware, (req, res, next) => reportsController.getUserReport(req, res, next));
router.get('/evaluations', isGestorOrAdminMiddleware, (req, res, next) => reportsController.getEvaluationsReport(req, res, next));
router.get('/ninebox', isGestorOrAdminMiddleware, (req, res, next) => reportsController.getNineBoxReport(req, res, next));
router.get('/competencies', isGestorOrAdminMiddleware, (req, res, next) => reportsController.getCompetenciesReport(req, res, next));

// Rotas de admin
router.get('/export', isAdminMiddleware, (req, res, next) => reportsController.exportData(req, res, next));

export default router;
```

### 10.4 Adicionar rota no app.js

Arquivo: `src/app.js` (adicionar linha)

```javascript
import reportsRoutes from './modules/reports/reports.routes.js';

// ... outras rotas ...

app.use('/api/reports', reportsRoutes);
```

### 10.5 Testar no Postman

**1. Dashboard geral (gestor/admin)**
```
GET http://localhost:3000/api/reports/dashboard
Authorization: Bearer SEU_TOKEN_GESTOR
```

**2. Meu relatório (qualquer usuário)**
```
GET http://localhost:3000/api/reports/me
Authorization: Bearer SEU_TOKEN
```

**3. Relatório de um usuário específico (gestor/admin)**
```
GET http://localhost:3000/api/reports/user/uuid-do-usuario
Authorization: Bearer SEU_TOKEN_GESTOR
```

**4. Relatório de avaliações (gestor/admin)**
```
GET http://localhost:3000/api/reports/evaluations
Authorization: Bearer SEU_TOKEN_GESTOR
```

**5. Relatório de avaliações com filtros**
```
GET http://localhost:3000/api/reports/evaluations?tipo=gestor&avaliadoId=uuid
Authorization: Bearer SEU_TOKEN_GESTOR
```

**6. Relatório Nine Box (gestor/admin)**
```
GET http://localhost:3000/api/reports/ninebox
Authorization: Bearer SEU_TOKEN_GESTOR
```

**7. Relatório de competências (gestor/admin)**
```
GET http://localhost:3000/api/reports/competencies
Authorization: Bearer SEU_TOKEN_GESTOR
```

**8. Exportar todos os dados (admin)**
```
GET http://localhost:3000/api/reports/export
Authorization: Bearer SEU_TOKEN_ADMIN
```

## Estrutura dos Relatórios

### Dashboard Stats
```json
{
  "usuarios": {
    "total": 10,
    "porTipo": {
      "admin": 1,
      "gestor": 3,
      "colaborador": 6
    }
  },
  "avaliacoes": {
    "total": 25,
    "porTipo": {
      "gestor": 15,
      "colaborador": 10
    },
    "mediaGeral": 4.2
  },
  "nineBox": {
    "total": 8,
    "porCategoria": {
      "Superstar": 2,
      "Estrela": 3,
      "Núcleo": 3
    }
  },
  "competencias": {
    "total": 12,
    "porTipo": {...},
    "porCompetenciaDe": {...}
  }
}
```

### User Report
```json
{
  "usuario": {
    "id": "...",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "tipo": "gestor"
  },
  "avaliacoesRecebidas": {
    "total": 5,
    "mediaGeral": 4.5,
    "porTipo": {...},
    "lista": [...]
  },
  "avaliacoesFeitas": {
    "total": 10,
    "lista": [...]
  },
  "nineBox": {
    "total": 3,
    "ultima": {...},
    "historico": [...]
  }
}
```

## Resumo

Agora você tem o módulo de relatórios completo! Ele permite:

- ✅ Dashboard com estatísticas gerais (gestor/admin)
- ✅ Relatório individual de usuário
- ✅ Meu relatório (qualquer usuário)
- ✅ Relatório de avaliações com filtros
- ✅ Relatório Nine Box com distribuição
- ✅ Relatório de competências
- ✅ Exportação completa de dados (admin)
- ✅ Controle de permissões por tipo de usuário
- ✅ Agregações e estatísticas automáticas

Próximo passo: Deploy e configuração de produção!
