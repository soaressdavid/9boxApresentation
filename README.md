# 🚀 Portal de Gestão de Pessoas

Sistema de avaliação de desempenho com gestão de colaboradores, avaliações 360°/180°, Nine Box e relatórios.

## 📋 Stack

- **Frontend**: HTML + CSS + JavaScript (Vanilla)
- **Backend**: Node.js + Express + Prisma + Supabase + JWT + Joi

## 🎯 Funcionalidades

- Sistema de permissões (Admin, Gestor, Colaborador)
- Cadastro e busca por RA (Registro Acadêmico - 7 dígitos)
- Avaliações de desempenho com critérios
- Sistema Nine Box (Performance × Potencial)
- Avaliações 360° e 180°
- Gestão de competências
- Dashboard e relatórios

## 📁 Estrutura

```
Nine-Box/
├── docs/
│   ├── BACKEND.md      # 🔧 Guia completo do backend
│   ├── FRONTEND.md     # 🎨 Guia completo do frontend
│   ├── backend/        # Docs específicos (estagiários, schema, FAQ)
│   └── frontend/       # Docs específicos (estagiários, FAQ)
│
├── backend/            # API REST (a ser criado)
├── frontend/           # Interface (arquivos atuais)
└── README.md
```

## 🚀 Início Rápido

### 📚 Documentação
**COMECE AQUI**: [`docs/START_HERE.md`](docs/START_HERE.md)

### 🔧 Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
📖 Guia completo: [`docs/BACKEND.md`](docs/BACKEND.md)

### 🎨 Frontend
```bash
npx serve .
```
📖 Guia completo: [`docs/FRONTEND.md`](docs/FRONTEND.md)

---

## 🔐 Credenciais de Teste

```
Admin:        admin@empresa.com / admin123 (RA: 1000000)
Gestor:       joao@empresa.com / senha123 (RA: 2021001)
Colaborador:  ana@empresa.com / senha123 (RA: 2022001)
```

## 📚 Documentação

- **Backend**: [`docs/BACKEND.md`](docs/BACKEND.md) - Guia completo
- **Frontend**: [`docs/FRONTEND.md`](docs/FRONTEND.md) - Guia completo
- **FAQ Backend**: [`docs/backend/FAQ.md`](docs/backend/FAQ.md)
- **FAQ Frontend**: [`docs/frontend/FAQ.md`](docs/frontend/FAQ.md)

---

**Desenvolvido com ❤️ pela equipe de estagiários**
