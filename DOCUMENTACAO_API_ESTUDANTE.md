# 📚 Documentação API - App Estudante

## 🎯 Visão Geral

Esta documentação contém todos os endpoints necessários para criar um aplicativo exclusivo para **Planos Estudante**, incluindo:
- 🔐 Login e Autenticação
- 💬 Chat (IA)
- 📝 Anotações
- 👤 Perfil

**Base URL:** `http://localhost:5000/api`

**Plano Estudante ID:** `3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7`

---

## 🔐 1. AUTENTICAÇÃO E LOGIN

### 1.1. Login
Autentica o usuário e retorna token JWT.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudante@exemplo.com",
    "senha": "senha123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "866162b2-123d-4b34-b530-434b490d610e",
    "nome": "João Silva",
    "email": "estudante@exemplo.com",
    "telefone": "+5511999999999",
    "assinatura": {
      "id": "uuid-assinatura",
      "planoId": "3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7",
      "status": "ativa",
      "plano": {
        "nome": "Estudante PRO",
        "preco": 29.90
      }
    }
  }
}
```

### 1.3. Verificar Token após login
Valida se o token ainda é válido.

```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 1.4. Refresh Token
Renova o token de autenticação.

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 1.5. Logout
Invalida o token atual.

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 1.6. Recuperar Senha
Envia email para recuperação de senha.

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudante@exemplo.com"
  }'
```

### 1.7. Resetar Senha
Redefine a senha usando token recebido por email.

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-recebido-por-email",
    "novaSenha": "novaSenha123"
  }'
```

---

## 💬 2. CHAT (IA)

### 2.1. Enviar Mensagem (Streaming)
Envia mensagem para IA e recebe resposta em streaming.

```bash
curl -X POST http://localhost:5000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "message": "Quais são os sintomas de gengivite?",
    "conversationId": "uuid-conversa-opcional"
  }'
```

**Response (Server-Sent Events):**
```
data: {"type":"token","content":"Os "}
data: {"type":"token","content":"sintomas "}
data: {"type":"token","content":"de "}
data: {"type":"token","content":"gengivite "}
data: {"type":"done","conversationId":"uuid-conversa"}
```

### 2.2. Listar Conversas
Lista todas as conversas do usuário.

```bash
curl -X GET http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid-conversa",
    "titulo": "Dúvidas sobre gengivite",
    "ultimaMensagem": "Os sintomas de gengivite incluem...",
    "createdAt": "2026-03-12T09:00:00.000Z",
    "updatedAt": "2026-03-12T09:30:00.000Z"
  }
]
```

### 2.3. Buscar Conversa Específica
Retorna todas as mensagens de uma conversa.

```bash
curl -X GET http://localhost:5000/api/chat/conversations/uuid-conversa \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response:**
```json
{
  "id": "uuid-conversa",
  "titulo": "Dúvidas sobre gengivite",
  "mensagens": [
    {
      "id": "uuid-msg-1",
      "role": "user",
      "content": "Quais são os sintomas de gengivite?",
      "createdAt": "2026-03-12T09:00:00.000Z"
    },
    {
      "id": "uuid-msg-2",
      "role": "assistant",
      "content": "Os sintomas de gengivite incluem...",
      "createdAt": "2026-03-12T09:00:05.000Z"
    }
  ]
}
```

### 2.4. Deletar Conversa
Remove uma conversa e todas suas mensagens.

```bash
curl -X DELETE http://localhost:5000/api/chat/conversations/uuid-conversa \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2.5. Renomear Conversa
Altera o título de uma conversa.

```bash
curl -X PUT http://localhost:5000/api/chat/conversations/uuid-conversa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Novo título da conversa"
  }'
```

---

## 📝 3. ANOTAÇÕES

### 3.1. Criar Anotação
Cria uma nova anotação.

```bash
curl -X POST http://localhost:5000/api/anotacoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Estudo sobre periodontia",
    "conteudo": "Anotações da aula de hoje sobre doenças periodontais...",
    "tags": ["periodontia", "estudo", "aula"],
    "cor": "#3b82f6"
  }'
```

**Response:**
```json
{
  "id": "uuid-anotacao",
  "titulo": "Estudo sobre periodontia",
  "conteudo": "Anotações da aula de hoje...",
  "tags": ["periodontia", "estudo", "aula"],
  "cor": "#3b82f6",
  "userId": "866162b2-123d-4b34-b530-434b490d610e",
  "createdAt": "2026-03-12T09:00:00.000Z",
  "updatedAt": "2026-03-12T09:00:00.000Z"
}
```

### 3.2. Listar Anotações
Lista todas as anotações do usuário.

```bash
curl -X GET http://localhost:5000/api/anotacoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid-anotacao",
    "titulo": "Estudo sobre periodontia",
    "conteudo": "Anotações da aula...",
    "tags": ["periodontia", "estudo"],
    "cor": "#3b82f6",
    "createdAt": "2026-03-12T09:00:00.000Z",
    "updatedAt": "2026-03-12T09:00:00.000Z"
  }
]
```

### 3.3. Buscar Anotação por ID
Retorna uma anotação específica.

```bash
curl -X GET http://localhost:5000/api/anotacoes/uuid-anotacao \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3.4. Atualizar Anotação
Edita uma anotação existente.

```bash
curl -X PUT http://localhost:5000/api/anotacoes/uuid-anotacao \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Estudo sobre periodontia - Atualizado",
    "conteudo": "Conteúdo atualizado...",
    "tags": ["periodontia", "estudo", "revisao"],
    "cor": "#10b981"
  }'
```

### 3.5. Deletar Anotação
Remove uma anotação.

```bash
curl -X DELETE http://localhost:5000/api/anotacoes/uuid-anotacao \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3.6. Buscar Anotações por Tag
Filtra anotações por tag específica.

```bash
curl -X GET "http://localhost:5000/api/anotacoes?tag=periodontia" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3.7. Buscar Anotações por Texto
Busca anotações que contenham determinado texto.

```bash
curl -X GET "http://localhost:5000/api/anotacoes/search?q=gengivite" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 👤 4. PERFIL

### 4.1. Buscar Perfil do Usuário
Retorna dados completos do perfil.

```bash
curl -X GET http://localhost:5000/api/perfil \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response:**
```json
{
  "id": "866162b2-123d-4b34-b530-434b490d610e",
  "nome": "João Silva",
  "email": "estudante@exemplo.com",
  "telefone": "+5511999999999",
  "avatar": "https://storage.com/avatar.jpg",
  "bio": "Estudante de Odontologia - 5º semestre",
  "instituicao": "Universidade Federal",
  "assinatura": {
    "id": "uuid-assinatura",
    "planoId": "3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7",
    "status": "ativa",
    "dataInicio": "2026-01-01T00:00:00.000Z",
    "dataFim": "2026-12-31T23:59:59.999Z",
    "plano": {
      "nome": "Estudante PRO",
      "preco": 29.90,
      "recursos": ["chat_ilimitado", "anotacoes"]
    }
  },
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-03-12T09:00:00.000Z"
}
```

### 4.2. Atualizar Perfil
Edita informações do perfil.

```bash
curl -X PUT http://localhost:5000/api/perfil \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "nome": "João Silva Santos",
    "telefone": "+5511988887777",
    "bio": "Estudante de Odontologia - 6º semestre",
    "instituicao": "Universidade Federal de São Paulo"
  }'
```

### 4.3. Upload de Avatar
Faz upload de foto de perfil.

```bash
curl -X POST http://localhost:5000/api/perfil/avatar \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "avatar=@/caminho/para/foto.jpg"
```

### 4.4. Alterar Senha
Muda a senha do usuário.

```bash
curl -X PUT http://localhost:5000/api/perfil/senha \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "senhaAtual": "senha123",
    "novaSenha": "novaSenha456"
  }'
```

### 4.5. Alterar Email
Atualiza o email do usuário.

```bash
curl -X PUT http://localhost:5000/api/perfil/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "novoEmail": "novoemail@exemplo.com",
    "senha": "senha123"
  }'
```

### 4.6. Deletar Conta
Remove permanentemente a conta do usuário.

```bash
curl -X DELETE http://localhost:5000/api/perfil \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "senha": "senha123",
    "confirmacao": "DELETAR MINHA CONTA"
  }'
```

---

## � 5. ASSINATURA E PLANOS

### 5.1. Verificar Status da Assinatura
Verifica se a assinatura está ativa.

```bash
curl -X GET http://localhost:5000/api/assinaturas/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response:**
```json
{
  "id": "uuid-assinatura",
  "status": "ativa",
  "planoId": "3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7",
  "dataInicio": "2026-01-01T00:00:00.000Z",
  "dataFim": "2026-12-31T23:59:59.999Z",
  "diasRestantes": 294,
  "plano": {
    "id": "3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7",
    "nome": "Estudante PRO",
    "preco": 29.90,
    "intervalo": "mensal"
  }
}
```

### 5.2. Listar Planos Disponíveis
Retorna todos os planos, destacando o plano estudante.

```bash
curl -X GET http://localhost:5000/api/planos \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 5.3. Cancelar Assinatura
Cancela a assinatura atual.

```bash
curl -X POST http://localhost:5000/api/assinaturas/cancelar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "motivo": "Não estou mais precisando",
    "senha": "senha123"
  }'
```

---

## 🔒 HEADERS OBRIGATÓRIOS

### Para todas as requisições autenticadas:
```
Authorization: Bearer SEU_TOKEN_JWT
```

### Para endpoints que requerem clienteMasterId:
```
x-cliente-master-id: UUID_DO_CLIENTE_MASTER
```

---

## ⚠️ CÓDIGOS DE ERRO

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 422 | Validação falhou |
| 500 | Erro interno do servidor |

**Exemplo de erro:**
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado",
  "error": "Unauthorized"
}
```

---

## 🎯 FLUXO COMPLETO DO APP ESTUDANTE

### 1️⃣ Autenticação
```bash
# Login
POST /api/auth/login
# Armazena o token retornado
```

### 2️⃣ Carregar Perfil
```bash
# Buscar dados do usuário
GET /api/perfil
```

### 3️⃣ Chat
```bash
# Listar conversas anteriores
GET /api/chat/conversations

# Enviar nova mensagem
POST /api/chat/stream
```

### 4️⃣ Anotações
```bash
# Listar anotações
GET /api/anotacoes

# Criar nova anotação
POST /api/anotacoes
```


---

## 📱 EXEMPLO DE IMPLEMENTAÇÃO

### React Native / Expo
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, senha) => {
  const response = await api.post('/auth/login', { email, senha });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

// Chat
const sendMessage = async (message, conversationId) => {
  const response = await api.post('/chat/stream', {
    message,
    conversationId
  });
  return response.data;
};

// Anotações
const createNote = async (titulo, conteudo, tags) => {
  const response = await api.post('/anotacoes', {
    titulo,
    conteudo,
    tags
  });
  return response.data;
};
```

---

## 🚀 RECURSOS EXCLUSIVOS DO PLANO ESTUDANTE

✅ Chat ilimitado com IA  
✅ Anotações ilimitadas  
✅ Suporte prioritário  
✅ Acesso a materiais educacionais  
✅ Preço especial: R$ 29,90/mês

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas:
- 📧 Email: suporte@denteapp.com
- 💬 WhatsApp: +55 11 99999-9999
- 🌐 Documentação: https://docs.denteapp.com

---

**Última atualização:** 12 de Março de 2026  
**Versão da API:** 1.0.0
