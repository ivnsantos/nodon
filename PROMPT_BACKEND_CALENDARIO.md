# 📋 PROMPT PARA DESENVOLVIMENTO DO BACKEND - SISTEMA DE CALENDÁRIO

## OBJETIVO
Implementar as APIs e estrutura de banco de dados para o sistema de calendário de consultas/agendamentos da plataforma odontológica.

---

## 🗄️ BANCO DE DADOS

### Tabela 1: `tipos_consulta`
Armazena os tipos personalizados de consulta/tratamento (ex: "Consulta", "Revisão", "Tratamento").

**Estrutura:**
```sql
CREATE TABLE tipos_consulta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_master_id INTEGER NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#0ea5e9',
  ativo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE
);
```

### Tabela 2: `consultas`
Armazena as consultas/eventos agendados no calendário.

**Estrutura:**
```sql
CREATE TABLE consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_master_id INTEGER NOT NULL,
  tipo_consulta_id INTEGER NOT NULL,
  paciente_id INTEGER NOT NULL,
  profissional_id INTEGER, -- NULL se for o próprio usuário logado
  profissional_user_base_id INTEGER, -- ID do userBase quando profissional é o próprio usuário
  titulo VARCHAR(255),
  data_consulta DATE NOT NULL,
  hora_consulta TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'agendada',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (cliente_master_id) REFERENCES clientes_master(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_consulta_id) REFERENCES tipos_consulta(id) ON DELETE RESTRICT,
  FOREIGN KEY (paciente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

**Índices necessários:**
- `idx_consultas_cliente_master` em `cliente_master_id`
- `idx_consultas_data` em `data_consulta`
- `idx_consultas_paciente` em `paciente_id`
- `idx_consultas_profissional` em `profissional_id`
- `idx_consultas_tipo` em `tipo_consulta_id`

---

## 🔌 ENDPOINTS NECESSÁRIOS

### BASE: `/api/calendario`

### 1. TIPOS DE CONSULTA

#### GET `/api/calendario/tipos`
Lista todos os tipos de consulta do cliente master.

**Resposta:**
```json
{
  "statusCode": 200,
  "data": {
    "tipos": [
      {
        "id": 1,
        "nome": "Consulta",
        "cor": "#0ea5e9",
        "ativo": true
      }
    ]
  }
}
```

#### POST `/api/calendario/tipos`
Cria um novo tipo de consulta.

**Body:**
```json
{
  "nome": "Tratamento",
  "cor": "#8b5cf6"
}
```

#### PUT `/api/calendario/tipos/:id`
Atualiza um tipo de consulta.

#### DELETE `/api/calendario/tipos/:id`
Exclui um tipo (soft delete). **Não permitir se houver consultas usando este tipo.**

---

### 2. CONSULTAS

#### GET `/api/calendario/consultas`
Lista consultas com filtros opcionais.

**Query Params:**
- `data_inicio` (opcional): YYYY-MM-DD
- `data_fim` (opcional): YYYY-MM-DD
- `profissional_id` (opcional): Filtrar por profissional
- `paciente_id` (opcional): Filtrar por paciente
- `tipo_consulta_id` (opcional): Filtrar por tipo
- `status` (opcional): agendada, confirmada, cancelada, concluida

**Resposta deve incluir:**
- Dados do tipo de consulta (nome, cor)
- Dados do paciente (nome)
- Dados do profissional (nome, user_base_id se for o próprio usuário)

#### GET `/api/calendario/consultas/periodo`
Otimizado para calendário mensal.

**Query Params:**
- `ano` (obrigatório): YYYY
- `mes` (obrigatório): 1-12
- `profissional_id` (opcional): null para "Eu" ou ID do profissional

**Resposta simplificada:**
```json
{
  "statusCode": 200,
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
      }
    ]
  }
}
```

#### GET `/api/calendario/consultas/:id`
Busca uma consulta específica com todos os detalhes.

#### POST `/api/calendario/consultas`
Cria uma nova consulta.

**Body:**
```json
{
  "tipo_consulta_id": 1,
  "paciente_id": 5,
  "profissional_id": null,  // null = próprio usuário
  "profissional_user_base_id": 10,  // ID do userBase quando profissional é o próprio usuário
  "titulo": "Consulta - João Silva",  // opcional, gerar automaticamente se não fornecido
  "data_consulta": "2024-01-15",
  "hora_consulta": "09:00",
  "observacoes": "Primeira consulta"
}
```

**Validações:**
- `paciente_id` é obrigatório
- `tipo_consulta_id` é obrigatório
- `data_consulta` e `hora_consulta` são obrigatórios
- **Não permitir sobreposição de horários para o mesmo profissional**
- Se `titulo` não fornecido, gerar: `{tipo_consulta.nome} - {paciente.nome}`

#### PUT `/api/calendario/consultas/:id`
Atualiza uma consulta existente.

#### DELETE `/api/calendario/consultas/:id`
Exclui uma consulta.

---

## 🔗 RELACIONAMENTOS

- **Paciente**: Vem da tabela `clientes` (já existe)
- **Profissional**: Vem da tabela `usuarios` (UserComum) ou é o próprio usuário logado
- **Cliente Master**: Todas as consultas pertencem a um ClienteMaster (filtrado pelo header `X-Cliente-Master-Id`)

---

## ⚠️ REGRAS DE NEGÓCIO IMPORTANTES

1. **Geração de Título**: Se não fornecido, gerar `{tipo_consulta.nome} - {paciente.nome}`

2. **Validação de Horários**: 
   - Não permitir criar/editar consultas com sobreposição de horário para o mesmo profissional
   - Considerar duração padrão de 30 minutos para verificar conflitos

3. **Profissional**:
   - Se `profissional_id` é NULL, significa que o profissional é o próprio usuário logado
   - Usar `profissional_user_base_id` para identificar quando necessário

4. **Filtro "Eu"**: 
   - Quando `profissional_id` é NULL no filtro, mostrar apenas consultas do próprio usuário logado

5. **Soft Delete**: Tipos de consulta usam soft delete (campo `ativo`)

---

## 📝 FORMATO DE RESPOSTA PADRÃO

**Sucesso:**
```json
{
  "statusCode": 200,
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

**Erro:**
```json
{
  "statusCode": 400,
  "message": "Mensagem de erro descritiva"
}
```

**Erro de Validação:**
```json
{
  "statusCode": 400,
  "message": "Erro de validação",
  "errors": [
    {
      "field": "paciente_id",
      "message": "Paciente é obrigatório"
    }
  ]
}
```

---

## ✅ CHECKLIST

- [ ] Criar tabelas `tipos_consulta` e `consultas`
- [ ] Criar índices necessários
- [ ] Implementar CRUD de tipos de consulta
- [ ] Implementar CRUD de consultas
- [ ] Adicionar validação de sobreposição de horários
- [ ] Implementar filtros (data, profissional, paciente, tipo)
- [ ] Implementar endpoint `/periodo` otimizado para calendário
- [ ] Adicionar relacionamentos com clientes e profissionais
- [ ] Implementar soft delete para tipos
- [ ] Testar todos os endpoints
- [ ] Documentar erros possíveis

---

## 🎯 PRIORIDADES

1. **Alta**: CRUD de consultas e tipos
2. **Alta**: Validação de sobreposição de horários
3. **Média**: Filtros e endpoint `/periodo`
4. **Baixa**: Soft delete e otimizações

