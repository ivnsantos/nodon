# 📝 Documentação - API de Anotações

## 📋 Índice
1. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
2. [Scripts SQL](#scripts-sql)
3. [Rotas da API](#rotas-da-api)
4. [Exemplos de Requisições](#exemplos-de-requisições)
5. [Estrutura de Dados](#estrutura-de-dados)

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `anotacoes`

A tabela `anotacoes` armazena as anotações dos usuários com suporte a formatação HTML.

#### Campos:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | UUID | Identificador único da anotação | Sim (PK) |
| `clienteMasterId` | UUID | ID do cliente master (dono da anotação) | Sim (FK) |
| `userId` | UUID | ID do usuário que criou a anotação | Sim (FK) |
| `titulo` | VARCHAR(255) | Título da anotação | Sim |
| `conteudo` | TEXT | Conteúdo em texto puro (para busca) | Sim |
| `conteudoHTML` | TEXT | Conteúdo formatado em HTML | Sim |
| `categoria` | VARCHAR(50) | Categoria da anotação | Sim |
| `cor` | VARCHAR(7) | Cor do post-it (hexadecimal) | Sim |
| `ativo` | BOOLEAN | Se a anotação está ativa | Sim (default: true) |
| `createdAt` | TIMESTAMP | Data de criação | Sim |
| `updatedAt` | TIMESTAMP | Data de atualização | Sim |

#### Índices:
- `idx_anotacoes_cliente_master` em `clienteMasterId`
- `idx_anotacoes_user` em `userId`
- `idx_anotacoes_categoria` em `categoria`
- `idx_anotacoes_created_at` em `createdAt` (DESC)

---

## 📜 Scripts SQL

### 1. Criar Tabela

```sql
CREATE TABLE IF NOT EXISTS anotacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clienteMasterId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    "conteudoHTML" TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Lembrete',
    cor VARCHAR(7) NOT NULL DEFAULT '#FFE082',
    ativo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_anotacoes_cliente_master 
        FOREIGN KEY ("clienteMasterId") 
        REFERENCES "clientesMaster"(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_anotacoes_user 
        FOREIGN KEY ("userId") 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_anotacoes_cor_format 
        CHECK (cor ~ '^#[0-9A-Fa-f]{6}$'),
    
    CONSTRAINT chk_anotacoes_categoria 
        CHECK (categoria IN ('Lembrete', 'Estudo', 'Paciente', 'Material', 'Curso', 'Protocolo', 'Outro'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_anotacoes_cliente_master 
    ON anotacoes("clienteMasterId");

CREATE INDEX IF NOT EXISTS idx_anotacoes_user 
    ON anotacoes("userId");

CREATE INDEX IF NOT EXISTS idx_anotacoes_categoria 
    ON anotacoes(categoria);

CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at 
    ON anotacoes("createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_anotacoes_ativo 
    ON anotacoes(ativo) 
    WHERE ativo = true;
```

### 2. Trigger para Atualizar `updatedAt`

```sql
CREATE OR REPLACE FUNCTION update_anotacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anotacoes_updated_at
    BEFORE UPDATE ON anotacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_anotacoes_updated_at();
```

---

## 🛣️ Rotas da API

### Base URL
```
/api/anotacoes
```

Todas as rotas requerem autenticação via Bearer Token e header `X-Cliente-Master-Id`.

---

### 1. **Listar Anotações**

**GET** `/api/anotacoes`

Lista todas as anotações do cliente master, ordenadas por data de criação (mais recentes primeiro).

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

#### Query Parameters (Opcionais):
- `categoria` (string): Filtrar por categoria
- `ativo` (boolean): Filtrar por status (default: true)
- `limit` (number): Limite de resultados (default: 100)
- `offset` (number): Offset para paginação (default: 0)

#### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-anotacao-1",
      "clienteMasterId": "uuid-cliente-master",
      "userId": "uuid-user",
      "titulo": "Lembrete: Revisão de Protocolo",
      "conteudo": "Revisar protocolo de limpeza profunda...",
      "conteudoHTML": "<p><strong>Revisar protocolo</strong>...</p>",
      "categoria": "Lembrete",
      "cor": "#FFE082",
      "ativo": true,
      "createdAt": "2026-02-13T10:30:00.000Z",
      "updatedAt": "2026-02-13T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 100,
    "offset": 0
  }
}
```

---

### 2. **Buscar Anotação por ID**

**GET** `/api/anotacoes/:id`

Busca uma anotação específica por ID.

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

#### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-anotacao-1",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Lembrete: Revisão de Protocolo",
    "conteudo": "Revisar protocolo de limpeza profunda...",
    "conteudoHTML": "<p><strong>Revisar protocolo</strong>...</p>",
    "categoria": "Lembrete",
    "cor": "#FFE082",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
}
```

#### Resposta (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Anotação não encontrada",
  "timestamp": "2026-02-13T10:30:00.000Z",
  "path": "/api/anotacoes/uuid-invalido"
}
```

---

### 3. **Criar Anotação**

**POST** `/api/anotacoes`

Cria uma nova anotação.

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
Content-Type: application/json
```

#### Body:
```json
{
  "titulo": "Lembrete: Revisão de Protocolo",
  "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta.",
  "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda...</p>",
  "categoria": "Lembrete",
  "cor": "#FFE082"
}
```

#### Validações:
- `titulo`: obrigatório, string, máximo 255 caracteres
- `conteudo`: obrigatório, string, não vazio
- `conteudoHTML`: obrigatório, string, não vazio
- `categoria`: obrigatório, deve ser uma das: 'Lembrete', 'Estudo', 'Paciente', 'Material', 'Curso', 'Protocolo', 'Outro'
- `cor`: obrigatório, formato hexadecimal (#RRGGBB)

#### Resposta (201 Created):
```json
{
  "statusCode": 201,
  "message": "Anotação criada com sucesso",
  "data": {
    "id": "uuid-anotacao-nova",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Lembrete: Revisão de Protocolo",
    "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta.",
    "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda...</p>",
    "categoria": "Lembrete",
    "cor": "#FFE082",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
}
```

---

### 4. **Atualizar Anotação**

**PATCH** `/api/anotacoes/:id`

Atualiza uma anotação existente. Apenas o usuário que criou pode atualizar.

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
Content-Type: application/json
```

#### Body (todos os campos são opcionais):
```json
{
  "titulo": "Lembrete: Revisão de Protocolo - Atualizado",
  "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta. ATUALIZADO.",
  "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda... <em>ATUALIZADO</em></p>",
  "categoria": "Protocolo",
  "cor": "#C5E1A5",
  "ativo": true
}
```

#### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Anotação atualizada com sucesso",
  "data": {
    "id": "uuid-anotacao-1",
    "clienteMasterId": "uuid-cliente-master",
    "userId": "uuid-user",
    "titulo": "Lembrete: Revisão de Protocolo - Atualizado",
    "conteudo": "Revisar protocolo de limpeza profunda antes da próxima consulta. ATUALIZADO.",
    "conteudoHTML": "<p><strong>Revisar protocolo</strong> de limpeza profunda... <em>ATUALIZADO</em></p>",
    "categoria": "Protocolo",
    "cor": "#C5E1A5",
    "ativo": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:35:00.000Z"
  }
}
```

#### Resposta (403 Forbidden - se não for o criador):
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para atualizar esta anotação",
  "timestamp": "2026-02-13T10:30:00.000Z",
  "path": "/api/anotacoes/uuid-anotacao-1"
}
```

---

### 5. **Excluir Anotação**

**DELETE** `/api/anotacoes/:id`

Exclui (soft delete) uma anotação. Apenas o usuário que criou pode excluir.

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

#### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Anotação excluída com sucesso",
  "data": null
}
```

#### Resposta (403 Forbidden - se não for o criador):
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para excluir esta anotação",
  "timestamp": "2026-02-13T10:30:00.000Z",
  "path": "/api/anotacoes/uuid-anotacao-1"
}
```

---

### 6. **Buscar Anotações por Categoria**

**GET** `/api/anotacoes/categoria/:categoria`

Lista anotações filtradas por categoria.

#### Headers:
```
Authorization: Bearer <token>
X-Cliente-Master-Id: <uuid>
```

#### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid-anotacao-1",
      "titulo": "Lembrete: Revisão de Protocolo",
      "categoria": "Lembrete",
      "cor": "#FFE082",
      "createdAt": "2026-02-13T10:30:00.000Z"
    }
  ]
}
```

---

## 📦 Estrutura de Dados

### DTOs (Data Transfer Objects)

#### CreateAnotacaoDTO
```typescript
{
  titulo: string;          // obrigatório, max 255 chars
  conteudo: string;        // obrigatório, texto puro
  conteudoHTML: string;    // obrigatório, HTML formatado
  categoria: string;        // obrigatório, enum
  cor: string;             // obrigatório, formato #RRGGBB
}
```

#### UpdateAnotacaoDTO
```typescript
{
  titulo?: string;
  conteudo?: string;
  conteudoHTML?: string;
  categoria?: string;
  cor?: string;
  ativo?: boolean;
}
```

#### AnotacaoResponseDTO
```typescript
{
  id: string;
  clienteMasterId: string;
  userId: string;
  titulo: string;
  conteudo: string;
  conteudoHTML: string;
  categoria: string;
  cor: string;
  ativo: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

---

## 🔒 Regras de Negócio

1. **Autorização**: 
   - Apenas o usuário que criou a anotação pode editá-la ou excluí-la
   - Usuários do mesmo cliente master podem visualizar todas as anotações

2. **Validações**:
   - `categoria` deve ser uma das opções válidas
   - `cor` deve estar no formato hexadecimal (#RRGGBB)
   - `titulo` máximo de 255 caracteres
   - `conteudo` e `conteudoHTML` não podem estar vazios

3. **Soft Delete**:
   - Ao excluir, apenas marca `ativo = false`
   - Não remove fisicamente do banco
   - Filtros padrão retornam apenas anotações ativas

4. **Ordenação**:
   - Listagem padrão ordena por `createdAt DESC` (mais recentes primeiro)

---

## 📝 Exemplos de Uso

### Criar Anotação
```bash
curl -X POST http://localhost:5000/api/anotacoes \
  -H "Authorization: Bearer <token>" \
  -H "X-Cliente-Master-Id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia",
    "conteudo": "Estudar técnicas modernas de tratamento endodôntico.",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico.</p>",
    "categoria": "Estudo",
    "cor": "#C5E1A5"
  }'
```

### Listar Anotações
```bash
curl -X GET "http://localhost:5000/api/anotacoes?categoria=Lembrete&limit=10" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cliente-Master-Id: <uuid>"
```

### Atualizar Anotação
```bash
curl -X PATCH http://localhost:5000/api/anotacoes/<id> \
  -H "Authorization: Bearer <token>" \
  -H "X-Cliente-Master-Id: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudo: Endodontia - Atualizado",
    "conteudoHTML": "<p><strong>Estudar técnicas modernas</strong> de tratamento endodôntico. <em>ATUALIZADO</em></p>"
  }'
```

### Excluir Anotação
```bash
curl -X DELETE http://localhost:5000/api/anotacoes/<id> \
  -H "Authorization: Bearer <token>" \
  -H "X-Cliente-Master-Id: <uuid>"
```

---

## ✅ Checklist de Implementação

- [ ] Criar tabela `anotacoes` no banco de dados
- [ ] Criar índices para performance
- [ ] Criar trigger para `updatedAt`
- [ ] Implementar rota GET `/api/anotacoes` (listar)
- [ ] Implementar rota GET `/api/anotacoes/:id` (buscar por ID)
- [ ] Implementar rota POST `/api/anotacoes` (criar)
- [ ] Implementar rota PATCH `/api/anotacoes/:id` (atualizar)
- [ ] Implementar rota DELETE `/api/anotacoes/:id` (excluir)
- [ ] Implementar rota GET `/api/anotacoes/categoria/:categoria` (filtrar por categoria)
- [ ] Adicionar validações de entrada
- [ ] Adicionar autorização (verificar ownership)
- [ ] Implementar soft delete
- [ ] Testar todas as rotas
- [ ] Atualizar frontend para usar as novas rotas

---

**Última atualização**: 2026-02-13

