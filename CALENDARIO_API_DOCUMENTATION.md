# 📅 Documentação de API e Banco de Dados - Sistema de Calendário

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabela: `tipos_consulta` (Tipos de Consulta/Tratamento)

Armazena os tipos personalizados de consulta/tratamento que podem ser criados pelo usuário.

```sql
CREATE TABLE tipos_consulta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_master_id INTEGER NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#0ea5e9', -- Código hexadecimal da cor
  ativo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_tipos_consulta_cliente_master ON tipos_consulta(cliente_master_id);
```

**Campos:**
- `id`: Identificador único
- `cliente_master_id`: ID da clínica/consultório (vinculado ao ClienteMaster)
- `nome`: Nome do tipo (ex: "Consulta", "Revisão", "Tratamento")
- `cor`: Cor em hexadecimal (ex: "#0ea5e9")
- `ativo`: Se o tipo está ativo (soft delete)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

---

### Tabela: `consultas` (Consultas/Eventos do Calendário)

Armazena as consultas agendadas no calendário.

```sql
CREATE TABLE consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_master_id INTEGER,
  tipo_consulta_id INTEGER NOT NULL,
  paciente_id INTEGER NOT NULL  -- ID do cliente/paciente (pode ser NULL se não houver paciente cadastrado)
  profissional_id INTEGER, -- ID do profissional responsável se for nulo siginfica que o cliente master foi o profissional que cadstrou
  titulo VARCHAR(255),
  data_consulta DATE NOT NULL,
  hora_consulta TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'agendada', -- agendada, confirmada, cancelada, concluida
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- ID do usuário que criou
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_consulta_id) REFERENCES tipos_consulta(id) ON DELETE RESTRICT,
  FOREIGN KEY (paciente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_consultas_cliente_master ON consultas(cliente_master_id);
CREATE INDEX idx_consultas_data ON consultas(data_consulta);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX idx_consultas_tipo ON consultas(tipo_consulta_id);
```

**Campos:**
- `id`: Identificador único
- `cliente_master_id`: ID da clínica/consultório
- `tipo_consulta_id`: ID do tipo de consulta/tratamento
- `paciente_id`: ID do paciente/cliente
- `profissional_id`: ID do usuario_comum, caso for nullo é pq o responsavvel é o cleinte master.
- `titulo`: Título da consulta (gerado automaticamente se não fornecido)
- `data_consulta`: Data da consulta (DATE)
- `hora_consulta`: Hora da consulta (TIME)
- `observacoes`: Observações/notas sobre a consulta
- `status`: Status da consulta (agendada, confirmada, cancelada, concluida)
- `created_at`: Data de criação
- `updated_at`: Data de atualização
- `created_by`: ID do usuário que criou a consulta

---

## 🔌 ENDPOINTS DA API

### Base URL
```
/api/calendario
```

### Headers Obrigatórios
Todas as requisições devem incluir:
```
Authorization: Bearer {token}
X-Cliente-Master-Id: {cliente_master_id}  // Para rotas dentro de /app
```

---

## 📋 TIPOS DE CONSULTA/TRATAMENTO

### 1. Listar Tipos de Consulta
**GET** `/api/calendario/tipos`

Retorna todos os tipos de consulta/tratamento do cliente master.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipos de consulta listados com sucesso",
  "data": {
    "tipos": [
      {
        "id": 1,
        "nome": "Consulta",
        "cor": "#0ea5e9",
        "ativo": true,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      },
      {
        "id": 2,
        "nome": "Revisão",
        "cor": "#14b8a6",
        "ativo": true,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. Criar Tipo de Consulta
**POST** `/api/calendario/tipos`

Cria um novo tipo de consulta/tratamento.

**Body:**
```json
{
  "nome": "Tratamento",
  "cor": "#8b5cf6"
}
```

**Validações:**
- `nome`: obrigatório, string, máximo 100 caracteres
- `cor`: obrigatório, string, formato hexadecimal (#RRGGBB)

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Tipo de consulta criado com sucesso",
  "data": {
    "tipo": {
      "id": 3,
      "nome": "Tratamento",
      "cor": "#8b5cf6",
      "ativo": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

### 3. Atualizar Tipo de Consulta
**PUT** `/api/calendario/tipos/:id`

Atualiza um tipo de consulta existente.

**Body:**
```json
{
  "nome": "Consulta Especial",
  "cor": "#f59e0b"
}
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipo de consulta atualizado com sucesso",
  "data": {
    "tipo": {
      "id": 1,
      "nome": "Consulta Especial",
      "cor": "#f59e0b",
      "ativo": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

---

### 4. Excluir Tipo de Consulta
**DELETE** `/api/calendario/tipos/:id`

Exclui (soft delete) um tipo de consulta.

**Validações:**
- Não permitir exclusão se houver consultas usando este tipo

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Tipo de consulta excluído com sucesso"
}
```

**Erro (se houver consultas vinculadas):**
```json
{
  "statusCode": 400,
  "message": "Não é possível excluir este tipo pois existem consultas vinculadas a ele"
}
```

---

## 📅 CONSULTAS/EVENTOS

### 5. Listar Consultas
**GET** `/api/calendario/consultas`

Lista todas as consultas do cliente master, com filtros opcionais.

**Query Parameters:**
- `data_inicio` (opcional): Data inicial para filtrar (YYYY-MM-DD)
- `data_fim` (opcional): Data final para filtrar (YYYY-MM-DD)
- `profissional_id` (opcional): Filtrar por profissional específico
- `paciente_id` (opcional): Filtrar por paciente específico
- `tipo_consulta_id` (opcional): Filtrar por tipo de consulta
- `status` (opcional): Filtrar por status (agendada, confirmada, cancelada, concluida)

**Exemplo:**
```
GET /api/calendario/consultas?data_inicio=2024-01-01&data_fim=2024-01-31&profissional_id=5
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consultas listadas com sucesso",
  "data": {
    "consultas": [
      {
        "id": 1,
        "tipo_consulta": {
          "id": 1,
          "nome": "Consulta",
          "cor": "#0ea5e9"
        },
        "paciente": {
          "id": 1,
          "nome": "João Silva"
        },
        "profissional": {
          "id": null,
          "nome": "Dr. Carlos",
          "user_base_id": 10
        },
        "titulo": "Consulta - João Silva",
        "data_consulta": "2024-01-15",
        "hora_consulta": "09:00",
        "observacoes": "Primeira consulta",
        "status": "agendada",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 6. Buscar Consulta por ID
**GET** `/api/calendario/consultas/:id`

Retorna os detalhes de uma consulta específica.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta encontrada",
  "data": {
    "consulta": {
      "id": 1,
      "tipo_consulta": {
        "id": 1,
        "nome": "Consulta",
        "cor": "#0ea5e9"
      },
      "paciente": {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999"
      },
      "profissional": {
        "id": null,
        "nome": "Dr. Carlos",
        "user_base_id": 10,
        "email": "carlos@clinica.com"
      },
      "titulo": "Consulta - João Silva",
      "data_consulta": "2024-01-15",
      "hora_consulta": "09:00",
      "observacoes": "Primeira consulta",
      "status": "agendada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

---

### 7. Criar Consulta
**POST** `/api/calendario/consultas`

Cria uma nova consulta no calendário.

**Body:**
```json
{
  "tipo_consulta_id": 1,
  "paciente_id": 5,
  "profissional_id": null,  // null se for o próprio usuário, ou ID do profissional
  "profissional_user_base_id": 10,  // ID do userBase quando profissional é o próprio usuário
  "titulo": "Consulta - João Silva",  // opcional, será gerado automaticamente se não fornecido
  "data_consulta": "2024-01-15",
  "hora_consulta": "09:00",
  "observacoes": "Primeira consulta do paciente"
}
```

**Validações:**
- `tipo_consulta_id`: obrigatório, deve existir na tabela tipos_consulta
- `paciente_id`: obrigatório, deve existir na tabela clientes
- `data_consulta`: obrigatório, formato YYYY-MM-DD
- `hora_consulta`: obrigatório, formato HH:MM
- `profissional_id` ou `profissional_user_base_id`: pelo menos um deve ser fornecido
- Não permitir sobreposição de horários para o mesmo profissional

**Resposta:**
```json
{
  "statusCode": 201,
  "message": "Consulta criada com sucesso",
  "data": {
    "consulta": {
      "id": 1,
      "tipo_consulta": {
        "id": 1,
        "nome": "Consulta",
        "cor": "#0ea5e9"
      },
      "paciente": {
        "id": 5,
        "nome": "João Silva"
      },
      "profissional": {
        "id": null,
        "nome": "Dr. Carlos",
        "user_base_id": 10
      },
      "titulo": "Consulta - João Silva",
      "data_consulta": "2024-01-15",
      "hora_consulta": "09:00",
      "observacoes": "Primeira consulta do paciente",
      "status": "agendada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

**Erro (sobreposição de horário):**
```json
{
  "statusCode": 400,
  "message": "Já existe uma consulta agendada para este profissional neste horário"
}
```

---

### 8. Atualizar Consulta
**PUT** `/api/calendario/consultas/:id`

Atualiza uma consulta existente.

**Body:**
```json
{
  "tipo_consulta_id": 2,
  "paciente_id": 5,
  "profissional_id": 3,
  "titulo": "Revisão - João Silva",
  "data_consulta": "2024-01-20",
  "hora_consulta": "14:30",
  "observacoes": "Acompanhamento pós-tratamento",
  "status": "confirmada"
}
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta atualizada com sucesso",
  "data": {
    "consulta": {
      "id": 1,
      "tipo_consulta": {
        "id": 2,
        "nome": "Revisão",
        "cor": "#14b8a6"
      },
      "paciente": {
        "id": 5,
        "nome": "João Silva"
      },
      "profissional": {
        "id": 3,
        "nome": "Dr. Ana"
      },
      "titulo": "Revisão - João Silva",
      "data_consulta": "2024-01-20",
      "hora_consulta": "14:30",
      "observacoes": "Acompanhamento pós-tratamento",
      "status": "confirmada",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-12T15:30:00Z"
    }
  }
}
```

---

### 9. Excluir Consulta
**DELETE** `/api/calendario/consultas/:id`

Exclui uma consulta do calendário.

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consulta excluída com sucesso"
}
```

---

### 10. Listar Consultas por Período (Para Calendário)
**GET** `/api/calendario/consultas/periodo`

Retorna consultas de um mês específico, otimizado para exibição no calendário.

**Query Parameters:**
- `ano` (obrigatório): Ano (YYYY)
- `mes` (obrigatório): Mês (1-12)
- `profissional_id` (opcional): Filtrar por profissional

**Exemplo:**
```
GET /api/calendario/consultas/periodo?ano=2024&mes=1&profissional_id=5
```

**Resposta:**
```json
{
  "statusCode": 200,
  "message": "Consultas do período listadas com sucesso",
  "data": {
    "consultas": [
      {
        "id": 1,
        "tipo_consulta_id": 1,
        "tipo_consulta_cor": "#0ea5e9",
        "paciente_nome": "João Silva",
        "data_consulta": "2024-01-15",
        "hora_consulta": "09:00",
        "titulo": "Consulta - João Silva"
      },
      {
        "id": 2,
        "tipo_consulta_id": 2,
        "tipo_consulta_cor": "#14b8a6",
        "paciente_nome": "Maria Santos",
        "data_consulta": "2024-01-15",
        "hora_consulta": "11:00",
        "titulo": "Revisão - Maria Santos"
      }
    ]
  }
}
```

---

## 🔗 RELACIONAMENTOS COM OUTRAS ENTIDADES

### Relacionamento com Clientes (Pacientes)
- A consulta **deve** estar vinculada a um paciente (`paciente_id`)
- O paciente vem da tabela `clientes` existente
- Endpoint para buscar pacientes: `GET /api/clientes` (já existe)

### Relacionamento com Profissionais
- A consulta pode estar vinculada a um profissional (`profissional_id`)
- O profissional vem da tabela `usuarios` (UserComum)
- Se `profissional_id` for NULL, significa que o profissional é o próprio usuário logado
- Endpoint para buscar profissionais: `GET /api/clientes-master/:id/usuarios` (já existe)

### Relacionamento com Cliente Master
- Todas as consultas e tipos pertencem a um ClienteMaster
- Filtrado automaticamente pelo header `X-Cliente-Master-Id`

---

## 📝 NOTAS IMPORTANTES

1. **Geração Automática de Título:**
   - Se `titulo` não for fornecido, gerar automaticamente: `{tipo_consulta.nome} - {paciente.nome}`

2. **Validação de Horários:**
   - Não permitir criar consultas com sobreposição de horário para o mesmo profissional
   - Considerar duração padrão (ex: 30 minutos) para verificar conflitos

3. **Filtro de Profissional:**
   - Quando `profissional_id` é NULL, significa que o profissional é o próprio usuário logado
   - Usar `profissional_user_base_id` para identificar o usuário quando necessário

4. **Soft Delete:**
   - Tipos de consulta usam soft delete (campo `ativo`)
   - Consultas podem ser excluídas permanentemente ou usar soft delete (adicionar campo `deleted_at`)

5. **Timezone:**
   - Todas as datas devem ser armazenadas em UTC
   - Converter para timezone do cliente no frontend

6. **Performance:**
   - Usar índices nas colunas de data e relacionamentos
   - Cachear tipos de consulta (raramente mudam)
   - Paginar resultados quando houver muitas consultas

---

## 🎯 EXEMPLO DE FLUXO COMPLETO

### 1. Criar Tipo de Consulta
```
POST /api/calendario/tipos
Body: { "nome": "Consulta", "cor": "#0ea5e9" }
```

### 2. Listar Pacientes Disponíveis
```
GET /api/clientes
```

### 3. Listar Profissionais Disponíveis
```
GET /api/clientes-master/{id}/usuarios
```

### 4. Criar Consulta
```
POST /api/calendario/consultas
Body: {
  "tipo_consulta_id": 1,
  "paciente_id": 5,
  "profissional_id": null,
  "profissional_user_base_id": 10,
  "data_consulta": "2024-01-15",
  "hora_consulta": "09:00",
  "observacoes": "Primeira consulta"
}
```

### 5. Listar Consultas do Mês
```
GET /api/calendario/consultas/periodo?ano=2024&mes=1&profissional_id=null
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar tabelas no banco de dados
- [ ] Implementar endpoints de tipos de consulta (CRUD)
- [ ] Implementar endpoints de consultas (CRUD)
- [ ] Adicionar validação de sobreposição de horários
- [ ] Implementar filtros (data, profissional, paciente, tipo)
- [ ] Adicionar relacionamentos com clientes e profissionais
- [ ] Implementar soft delete para tipos
- [ ] Adicionar índices no banco de dados
- [ ] Implementar tratamento de erros
- [ ] Adicionar logs de auditoria (opcional)
- [ ] Testar todos os endpoints
- [ ] Documentar casos de erro

