# API Cliente Master - Buscar e Editar

## Base URL
```
/api/clientes-master
```

## Headers Obrigatórios
Todas as requisições devem incluir:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}  // Para rotas que requerem contexto do cliente master
```

---

## 1. Buscar Cliente Master por ID

**GET** `/api/clientes-master/:id`

Busca os dados de um cliente master específico pelo ID.

### Headers:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}
```

### Parâmetros de URL:
- `id` (UUID): ID do cliente master a ser buscado

### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Cliente master encontrado com sucesso",
  "data": {
    "id": "uuid-cliente-master",
    "nome": "Clínica XYZ",
    "nome_empresa": "Clínica XYZ",
    "email": "contato@clinicaxyz.com",
    "telefone_empresa": "11999999999",
    "site": "https://clinicaxyz.com",
    "logo": "https://clinicaxyz.com/logo.png",
    "cor": "#0ea5e9",
    "endereco": "Rua Exemplo, 123 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90",
    "ativo": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Resposta (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Cliente master não encontrado"
}
```

### cURL:
```bash
curl -X GET http://localhost:5000/api/clientes-master/34106e22-8a15-4731-81fa-6a525fef98e5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

## 2. Editar Cliente Master

**PUT** `/api/clientes-master/:id`

Atualiza os dados de um cliente master específico.

### Headers:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}
Content-Type: application/json
```

### Parâmetros de URL:
- `id` (UUID): ID do cliente master a ser editado

### Body (JSON):
```json
{
  "nome": "Clínica XYZ Atualizada",
  "nome_empresa": "Clínica XYZ Atualizada",
  "email": "novoemail@clinicaxyz.com",
  "telefone_empresa": "11988888888",
  "site": "https://novosite.com",
  "logo": "https://novosite.com/logo.png",
  "cor": "#10b981",
  "endereco": "Nova Rua, 456 - São Paulo, SP",
  "cnpj": "12.345.678/0001-90"
}
```

### Campos Opcionais:
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

- `nome` (string): Nome do cliente master
- `nome_empresa` (string): Nome da empresa
- `email` (string): Email de contato
- `telefone_empresa` (string): Telefone da empresa
- `site` (string): Site da empresa
- `logo` (string): URL do logo
- `cor` (string): Cor principal (formato hexadecimal #RRGGBB)
- `endereco` (string): Endereço completo
- `cnpj` (string): CNPJ da empresa

### Validações:
- `email`: Deve ser um email válido (se fornecido)
- `cor`: Deve estar no formato hexadecimal #RRGGBB (se fornecido)
- `cnpj`: Deve estar no formato válido (se fornecido)

### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Cliente master atualizado com sucesso",
  "data": {
    "id": "uuid-cliente-master",
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90",
    "ativo": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

### Resposta (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Cliente master não encontrado"
}
```

### Resposta (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### cURL:
```bash
curl -X PUT http://localhost:5000/api/clientes-master/34106e22-8a15-4731-81fa-6a525fef98e5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -d '{
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90"
  }'
```

---

## 3. Buscar Cliente Master Atual (Meus Dados)

**GET** `/api/clientes-master/meus-dados`

Busca os dados do cliente master autenticado (baseado no token e header X-Cliente-Master-Id).

### Headers:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}
```

### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Dados do cliente master recuperados com sucesso",
  "data": {
    "id": "uuid-cliente-master",
    "nome": "Clínica XYZ",
    "nome_empresa": "Clínica XYZ",
    "email": "contato@clinicaxyz.com",
    "telefone_empresa": "11999999999",
    "site": "https://clinicaxyz.com",
    "logo": "https://clinicaxyz.com/logo.png",
    "cor": "#0ea5e9",
    "endereco": "Rua Exemplo, 123 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90",
    "ativo": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### cURL:
```bash
curl -X GET http://localhost:5000/api/clientes-master/meus-dados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

---

## 4. Atualizar Cliente Master Atual (Meus Dados)

**POST** `/api/clientes-master/meus-dados`

Atualiza os dados do cliente master autenticado. Esta rota já existe no sistema.

### Headers:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}
Content-Type: application/json
```

### Body (JSON):
```json
{
  "nome": "Clínica XYZ Atualizada",
  "nome_empresa": "Clínica XYZ Atualizada",
  "email": "novoemail@clinicaxyz.com",
  "telefone_empresa": "11988888888",
  "site": "https://novosite.com",
  "logo": "https://novosite.com/logo.png",
  "cor": "#10b981",
  "endereco": "Nova Rua, 456 - São Paulo, SP",
  "cnpj": "12.345.678/0001-90"
}
```

### Resposta (200 OK):
```json
{
  "statusCode": 200,
  "message": "Dados atualizados com sucesso",
  "data": {
    "id": "uuid-cliente-master",
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90",
    "ativo": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

### cURL:
```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -d '{
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90"
  }'
```

---

## Resumo dos cURLs

### 1. Buscar Cliente Master por ID
```bash
curl -X GET http://localhost:5000/api/clientes-master/34106e22-8a15-4731-81fa-6a525fef98e5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### 2. Editar Cliente Master por ID
```bash
curl -X PUT http://localhost:5000/api/clientes-master/34106e22-8a15-4731-81fa-6a525fef98e5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -d '{
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90"
  }'
```

### 3. Buscar Meus Dados
```bash
curl -X GET http://localhost:5000/api/clientes-master/meus-dados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5"
```

### 4. Atualizar Meus Dados
```bash
curl -X POST http://localhost:5000/api/clientes-master/meus-dados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "X-Cliente-Master-Id: 34106e22-8a15-4731-81fa-6a525fef98e5" \
  -d '{
    "nome": "Clínica XYZ Atualizada",
    "nome_empresa": "Clínica XYZ Atualizada",
    "email": "novoemail@clinicaxyz.com",
    "telefone_empresa": "11988888888",
    "site": "https://novosite.com",
    "logo": "https://novosite.com/logo.png",
    "cor": "#10b981",
    "endereco": "Nova Rua, 456 - São Paulo, SP",
    "cnpj": "12.345.678/0001-90"
  }'
```

