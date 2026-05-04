# 🚀 Portal de Gestão de Pessoas

Sistema de avaliação de desempenho com gestão de colaboradores, avaliações 360°/180°, Nine Box e relatórios.

## 📋 Stack

- **Frontend**: HTML + CSS + JavaScript (Vanilla)
- **Backend**: Node.js + Express + Prisma + Supabase + JWT + Joi

## 🎯 Funcionalidades

- Sistema de permissões (Admin, Gestor, Colaborador)
- Cadastro e busca por RA (Registro Acadêmico - identificador único)
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

**IMPORTANTE**: Use RAs reais das pessoas. Os exemplos abaixo são fictícios.

```
Admin:        admin@eniac.edu.br / admin123 (RA: use RA real do admin)
Gestor:       joao@eniac.edu.br / senha123 (RA: use RA real do gestor)
Colaborador:  ana@eniac.edu.br / senha123 (RA: use RA real do colaborador)
```

**Sistema de RA**: Cada pessoa já tem seu RA (como CPF). No cadastro, a pessoa informa o RA dela.

## 📚 Documentação

- **Backend**: [`docs/BACKEND.md`](docs/BACKEND.md) - Guia completo
- **Frontend**: [`docs/FRONTEND.md`](docs/FRONTEND.md) - Guia completo
- **FAQ Backend**: [`docs/backend/FAQ.md`](docs/backend/FAQ.md)
- **FAQ Frontend**: [`docs/frontend/FAQ.md`](docs/frontend/FAQ.md)

---

**Desenvolvido com ❤️ pela equipe de estagiários**
