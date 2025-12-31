# 🚀 Como Iniciar o Projeto

## Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Isso instalará todas as dependências necessárias (React, Vite, Express, SQLite, etc.)

## Passo 2: Iniciar o Projeto

Execute o comando para iniciar tanto o frontend quanto o backend:

```bash
npm run dev
```

Este comando irá:
- ✅ Iniciar o servidor **backend** na porta **5000** (http://localhost:5000)
- ✅ Iniciar o servidor **frontend** na porta **3000** (http://localhost:3000)

## Passo 3: Acessar a Aplicação

Abra seu navegador e acesse:

**http://localhost:3000**

## 🔐 Credenciais Padrão

Na primeira vez que o projeto iniciar, um usuário administrador será criado automaticamente:

- **Email:** `admin@dente.com`
- **Senha:** `admin123`

Você pode usar essas credenciais para fazer login ou criar uma nova conta.

## 📝 Comandos Disponíveis

- `npm run dev` - Inicia frontend e backend simultaneamente
- `npm run dev:client` - Inicia apenas o frontend (porta 3000)
- `npm run dev:server` - Inicia apenas o backend (porta 5000)
- `npm run build` - Cria build de produção do frontend

## ⚠️ Problemas Comuns

### Erro: "Porta já em uso"
Se a porta 3000 ou 5000 estiver em uso, você pode:
1. Fechar outros aplicativos usando essas portas
2. Ou alterar as portas no arquivo `vite.config.js` (frontend) e `server/index.js` (backend)

### Erro: "Cannot find module"
Execute novamente `npm install` para garantir que todas as dependências foram instaladas.

### Banco de dados não criado
O banco SQLite será criado automaticamente na primeira execução em `server/database.sqlite`.

## 🎉 Pronto!

Agora você pode:
- ✅ Fazer login na plataforma
- ✅ Cadastrar dentistas
- ✅ Cadastrar diagnósticos
- ✅ Conversar com a IA
- ✅ Visualizar o dashboard

