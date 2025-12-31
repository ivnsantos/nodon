# 🦷 Plataforma Dente

Plataforma odontológica completa com React + Vite e backend integrado (monolito).

## 🚀 Funcionalidades

- ✅ Cadastro de usuários
- ✅ Cadastro de dentistas
- ✅ Cadastro de diagnósticos
- ✅ Chat com IA para consultas odontológicas
- ✅ Dashboard com estatísticas
- ✅ Autenticação e autorização

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🛠️ Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Isso iniciará:
- Frontend na porta 3000 (http://localhost:3000)
- Backend na porta 5000 (http://localhost:5000)

## 🔐 Credenciais Padrão

Após a primeira inicialização, um usuário admin é criado automaticamente:

- **Email:** admin@dente.com
- **Senha:** admin123

## 📁 Estrutura do Projeto

```
dente/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── context/           # Context API (Auth)
│   └── App.jsx            # Componente principal
├── server/                # Backend Express
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   ├── database.js        # Configuração do banco
│   └── index.js           # Servidor principal
└── package.json
```

## 🗄️ Banco de Dados

O projeto usa SQLite para simplicidade. O banco é criado automaticamente na primeira execução em `server/database.sqlite`.

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário atual

### Dentistas
- `GET /api/dentistas` - Listar dentistas
- `POST /api/dentistas` - Criar dentista
- `GET /api/dentistas/:id` - Buscar dentista
- `PUT /api/dentistas/:id` - Atualizar dentista
- `DELETE /api/dentistas/:id` - Deletar dentista

### Diagnósticos
- `GET /api/diagnosticos` - Listar diagnósticos
- `POST /api/diagnosticos` - Criar diagnóstico
- `GET /api/diagnosticos/:id` - Buscar diagnóstico
- `PUT /api/diagnosticos/:id` - Atualizar diagnóstico
- `DELETE /api/diagnosticos/:id` - Deletar diagnóstico

### Chat
- `POST /api/chat` - Enviar mensagem para IA
- `GET /api/chat/history` - Obter histórico de conversas

## 🎨 Tecnologias

- **Frontend:** React 18, Vite, React Router
- **Backend:** Express.js, SQLite3
- **Autenticação:** JWT, bcryptjs
- **Estilização:** CSS puro com variáveis CSS

## 📝 Notas

- O chat com IA atualmente usa respostas simuladas baseadas em palavras-chave
- Para produção, integre com uma API real de IA (OpenAI, etc.)
- O banco SQLite é adequado para desenvolvimento, considere PostgreSQL para produção

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Tokens JWT para autenticação
- Middleware de autenticação nas rotas protegidas

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

