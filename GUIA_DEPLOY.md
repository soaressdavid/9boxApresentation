# Guia Completo - Deploy e Produção

Este guia ensina como preparar e fazer deploy da aplicação em produção.

## Parte 11: Preparação para Produção (30 min)

### 11.1 Configurar variáveis de ambiente

Arquivo: `.env.example` (criar para documentar)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_SECRET="seu_secret_super_seguro_aqui_min_32_caracteres"
JWT_EXPIRES_IN=30d

# CORS (opcional)
CORS_ORIGIN=https://seu-frontend.com
```

### 1.3 Configurar package.json

Adiciona os scripts e configura ES Modules:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "build": "echo 'No build needed for Node.js'",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js",
    "test": "echo 'No tests yet'",
    "lint": "echo 'No linter configured'"
  }
}
```

### 11.3 Configurar CORS adequadamente

Arquivo: `src/app.js` (atualizar configuração de CORS)

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Configuração de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rotas
import userRoutes from './modules/users/user.routes.js';
import evaluationRoutes from './modules/evaluations/evaluation.routes.js';
import competencyRoutes from './modules/competencies/competency.routes.js';
import nineBoxRoutes from './modules/ninebox/ninebox.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

app.use('/api/users', userRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/ninebox', nineBoxRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Error handler (sempre por último)
app.use(errorHandler);

export default app;
```

### 11.4 Melhorar error handler

Arquivo: `src/middlewares/errorHandler.js` (atualizar)

```javascript
const errorHandler = (err, req, res, next) => {
  // Log do erro (em produção, use um logger como Winston)
  if (process.env.NODE_ENV === 'development') {
    console.error('Erro:', err);
  } else {
    // Em produção, log apenas mensagem
    console.error('Erro:', err.message);
  }

  // Erro operacional (esperado)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Erro do Prisma
  if (err.code) {
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

    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Referência inválida'
      });
    }
  }

  // Erro de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message,
      errors: err.details.map(d => d.message)
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Erro genérico (não expõe detalhes em produção)
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Erro interno do servidor'
  });
};

module.exports = { errorHandler };
```

### 11.5 Adicionar graceful shutdown

Arquivo: `src/server.js` (atualizar)

```javascript
import 'dotenv/config';
import app from './app.js';
import { prisma } from './config/database.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recebido. Encerrando gracefully...`);
  
  server.close(async () => {
    console.log('✅ Servidor HTTP fechado');
    
    try {
      await prisma.$disconnect();
      console.log('✅ Conexão com banco fechada');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao fechar conexão:', error);
      process.exit(1);
    }
  });

  // Força encerramento após 10 segundos
  setTimeout(() => {
    console.error('⚠️  Forçando encerramento após timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
```

## Parte 12: Deploy em Diferentes Plataformas

### 12.1 Deploy no Render (Recomendado - Grátis)

**Passo 1: Preparar o projeto**

1. Certifique-se que o código está no GitHub
2. Crie um arquivo `render.yaml` na raiz:

```yaml
services:
  - type: web
    name: gestao-pessoas-api
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: gestao-pessoas-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 30d

databases:
  - name: gestao-pessoas-db
    databaseName: gestao_pessoas
    user: gestao_user
```

**Passo 2: Deploy**

1. Acesse [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo PostgreSQL Database
4. Crie um novo Web Service
5. Configure as variáveis de ambiente
6. Deploy automático!

**Passo 3: Rodar migrations**

No dashboard do Render, vá em "Shell" e execute:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 12.2 Deploy no Railway (Alternativa - Grátis)

**Passo 1: Instalar Railway CLI**

```bash
npm install -g @railway/cli
railway login
```

**Passo 2: Inicializar projeto**

```bash
railway init
railway add --database postgresql
```

**Passo 3: Configurar variáveis**

```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=seu_secret_aqui
railway variables set JWT_EXPIRES_IN=30d
```

**Passo 4: Deploy**

```bash
railway up
```

**Passo 5: Rodar migrations**

```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### 12.3 Deploy no Heroku

**Passo 1: Criar Procfile**

Arquivo: `Procfile`

```
web: npm start
release: npx prisma migrate deploy
```

**Passo 2: Deploy**

```bash
heroku login
heroku create seu-app-name
heroku addons:create heroku-postgresql:mini

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu_secret_aqui
heroku config:set JWT_EXPIRES_IN=30d

# Deploy
git push heroku main

# Seed (opcional)
heroku run npx prisma db seed
```

### 12.4 Deploy no VPS (DigitalOcean, AWS, etc)

**Passo 1: Conectar no servidor**

```bash
ssh root@seu-ip
```

**Passo 2: Instalar dependências**

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar PM2
npm install -g pm2
```

**Passo 3: Configurar PostgreSQL**

```bash
sudo -u postgres psql

CREATE DATABASE gestao_pessoas;
CREATE USER gestao_user WITH PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE gestao_pessoas TO gestao_user;
\q
```

**Passo 4: Clonar e configurar projeto**

```bash
cd /var/www
git clone seu-repositorio.git
cd seu-repositorio

# Instalar dependências
npm install

# Configurar .env
nano .env
# Cole suas variáveis de ambiente

# Gerar Prisma Client
npx prisma generate

# Rodar migrations
npx prisma migrate deploy

# Seed (opcional)
npx prisma db seed
```

**Passo 5: Configurar PM2**

```bash
# Iniciar aplicação
pm2 start src/server.js --name gestao-api

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Ver logs
pm2 logs gestao-api

# Monitorar
pm2 monit
```

**Passo 6: Configurar Nginx (opcional)**

```bash
apt install -y nginx

# Criar configuração
nano /etc/nginx/sites-available/gestao-api
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/gestao-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Passo 7: Configurar SSL com Let's Encrypt**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

## Parte 13: Monitoramento e Manutenção

### 13.1 Logs

**Com PM2:**
```bash
pm2 logs gestao-api
pm2 logs gestao-api --lines 100
pm2 logs gestao-api --err
```

**Com Docker:**
```bash
docker logs container-name
docker logs -f container-name
```

### 13.2 Backup do Banco

**PostgreSQL:**
```bash
# Backup
pg_dump -U gestao_user -d gestao_pessoas > backup.sql

# Restore
psql -U gestao_user -d gestao_pessoas < backup.sql
```

**Automatizar backup (cron):**
```bash
crontab -e

# Backup diário às 3h da manhã
0 3 * * * pg_dump -U gestao_user -d gestao_pessoas > /backups/backup-$(date +\%Y\%m\%d).sql
```

### 13.3 Atualizar aplicação

**Com PM2:**
```bash
cd /var/www/seu-repositorio
git pull
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart gestao-api
```

**Com Docker:**
```bash
docker-compose pull
docker-compose up -d
```

## Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET forte e único
- [ ] DATABASE_URL correto
- [ ] CORS configurado adequadamente
- [ ] Migrations rodadas
- [ ] Seed executado (se necessário)
- [ ] Health check funcionando
- [ ] HTTPS configurado
- [ ] Backup automático configurado
- [ ] Logs sendo salvos
- [ ] Monitoramento ativo
- [ ] Documentação da API atualizada

## Dicas de Segurança

1. **Nunca commite .env** - Use .gitignore
2. **Use senhas fortes** - Mínimo 32 caracteres para JWT_SECRET
3. **Configure rate limiting** - Previne ataques de força bruta
4. **Use HTTPS** - Sempre em produção
5. **Valide inputs** - Já fazemos com Joi
6. **Mantenha dependências atualizadas** - `npm audit`
7. **Configure firewall** - Apenas portas necessárias
8. **Backup regular** - Automatize backups do banco

## Resumo

Agora você sabe:

- ✅ Preparar aplicação para produção
- ✅ Configurar variáveis de ambiente
- ✅ Fazer deploy em múltiplas plataformas
- ✅ Configurar banco de dados em produção
- ✅ Monitorar aplicação
- ✅ Fazer backup e restore
- ✅ Atualizar aplicação em produção
- ✅ Seguir boas práticas de segurança

Seu backend está completo e pronto para produção! 🚀
