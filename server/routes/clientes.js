import express from 'express'
import { getDb, dbGet, dbRun, dbAll } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// GET /api/clientes - Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const clientes = await dbAll(db, `
      SELECT c.*, 
      (SELECT json_group_array(n.descricao) 
       FROM necessidades n 
       WHERE n.cliente_id = c.id) as necessidades_json
      FROM clientes c
      WHERE c.usuario_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id])
    
    const clientesFormatados = clientes.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      dataNascimento: cliente.data_nascimento,
      endereco: cliente.endereco ? JSON.parse(cliente.endereco) : null,
      status: cliente.status,
      necessidades: cliente.necessidades_json ? JSON.parse(cliente.necessidades_json) : [],
      observacoes: cliente.observacoes,
      createdAt: cliente.created_at
    }))
    
    res.json(clientesFormatados)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    res.status(500).json({ error: 'Erro ao buscar clientes' })
  }
})

// GET /api/clientes/search?q=termo - Buscar clientes por nome, email ou CPF
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2) {
      return res.json([])
    }

    const db = getDb()
    const searchTerm = `%${q.trim()}%`
    const clientes = await dbAll(db, `
      SELECT id, nome, email, cpf, telefone
      FROM clientes
      WHERE usuario_id = ? 
      AND (
        nome LIKE ? 
        OR email LIKE ? 
        OR cpf LIKE ?
      )
      ORDER BY nome ASC
      LIMIT 10
    `, [req.user.id, searchTerm, searchTerm, searchTerm])
    
    res.json(clientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    res.status(500).json({ error: 'Erro ao buscar clientes' })
  }
})

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const cliente = await dbGet(db, `
      SELECT c.*, 
      (SELECT json_group_array(n.descricao) 
       FROM necessidades n 
       WHERE n.cliente_id = c.id) as necessidades_json
      FROM clientes c
      WHERE c.id = ? AND c.usuario_id = ?
    `, [req.params.id, req.user.id])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    const clienteFormatado = {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      dataNascimento: cliente.data_nascimento,
      endereco: cliente.endereco ? JSON.parse(cliente.endereco) : null,
      status: cliente.status,
      necessidades: cliente.necessidades_json ? JSON.parse(cliente.necessidades_json) : [],
      observacoes: cliente.observacoes,
      createdAt: cliente.created_at
    }
    
    res.json(clienteFormatado)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    res.status(500).json({ error: 'Erro ao buscar cliente' })
  }
})

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const db = getDb()
    const {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      endereco,
      necessidades,
      observacoes,
      status
    } = req.body
    
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' })
    }
    
    const result = await dbRun(db, `
      INSERT INTO clientes (
        usuario_id, nome, email, telefone, cpf, data_nascimento,
        endereco, status, observacoes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      req.user.id,
      nome,
      email,
      telefone || null,
      cpf || null,
      dataNascimento || null,
      endereco ? JSON.stringify(endereco) : null,
      status || 'avaliacao-realizada',
      observacoes || null
    ])
    
    const clienteId = result.lastID
    
    // Adicionar necessidades
    if (necessidades && Array.isArray(necessidades) && necessidades.length > 0) {
      for (const necessidade of necessidades) {
        if (necessidade && necessidade.trim()) {
          await dbRun(db, `
            INSERT INTO necessidades (cliente_id, descricao, data) 
            VALUES (?, ?, datetime('now'))
          `, [clienteId, necessidade.trim()])
        }
      }
    }
    
    // Adicionar histórico inicial
    await dbRun(db, `
      INSERT INTO historico_cliente (cliente_id, tipo, descricao, usuario, data) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [clienteId, 'criacao', `Cliente ${nome} cadastrado`, req.user.nome || 'Sistema'])
    
    res.status(201).json({ id: clienteId, message: 'Cliente criado com sucesso' })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    res.status(500).json({ error: 'Erro ao criar cliente' })
  }
})

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const db = getDb()
    const {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      endereco,
      observacoes,
      status
    } = req.body
    
    // Verificar se o cliente pertence ao usuário
    const cliente = await dbGet(db, 'SELECT id FROM clientes WHERE id = ? AND usuario_id = ?', [
      req.params.id,
      req.user.id
    ])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    await dbRun(db, `
      UPDATE clientes SET
        nome = ?,
        email = ?,
        telefone = ?,
        cpf = ?,
        data_nascimento = ?,
        endereco = ?,
        observacoes = ?,
        status = ?
      WHERE id = ? AND usuario_id = ?
    `, [
      nome,
      email,
      telefone || null,
      cpf || null,
      dataNascimento || null,
      endereco ? JSON.stringify(endereco) : null,
      observacoes || null,
      status,
      req.params.id,
      req.user.id
    ])
    
    res.json({ message: 'Cliente atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    res.status(500).json({ error: 'Erro ao atualizar cliente' })
  }
})

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    
    // Verificar se o cliente pertence ao usuário
    const cliente = await dbGet(db, 'SELECT id FROM clientes WHERE id = ? AND usuario_id = ?', [
      req.params.id,
      req.user.id
    ])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    // Deletar necessidades e histórico relacionados (CASCADE já faz isso, mas vamos garantir)
    await dbRun(db, 'DELETE FROM necessidades WHERE cliente_id = ?', [req.params.id])
    await dbRun(db, 'DELETE FROM historico_cliente WHERE cliente_id = ?', [req.params.id])
    await dbRun(db, 'DELETE FROM clientes WHERE id = ?', [req.params.id])
    
    res.json({ message: 'Cliente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    res.status(500).json({ error: 'Erro ao deletar cliente' })
  }
})

// POST /api/clientes/:id/necessidades - Adicionar necessidade
router.post('/:id/necessidades', async (req, res) => {
  try {
    const db = getDb()
    const { descricao } = req.body
    
    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'Descrição é obrigatória' })
    }
    
    // Verificar se o cliente pertence ao usuário
    const cliente = await dbGet(db, 'SELECT id FROM clientes WHERE id = ? AND usuario_id = ?', [
      req.params.id,
      req.user.id
    ])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    const result = await dbRun(db, `
      INSERT INTO necessidades (cliente_id, descricao, data) 
      VALUES (?, ?, datetime('now'))
    `, [req.params.id, descricao.trim()])
    
    // Adicionar ao histórico
    await dbRun(db, `
      INSERT INTO historico_cliente (cliente_id, tipo, descricao, usuario, data) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [
      req.params.id,
      'necessidade',
      `Necessidade adicionada: ${descricao.trim()}`,
      req.user.nome || 'Sistema'
    ])
    
    res.json({ id: result.lastID, message: 'Necessidade adicionada com sucesso' })
  } catch (error) {
    console.error('Erro ao adicionar necessidade:', error)
    res.status(500).json({ error: 'Erro ao adicionar necessidade' })
  }
})

// PUT /api/clientes/:id/status - Atualizar status
router.put('/:id/status', async (req, res) => {
  try {
    const db = getDb()
    const { status } = req.body
    
    const statusLabels = {
      'avaliacao-realizada': 'Avaliação Realizada',
      'em-andamento': 'Em Andamento',
      'aprovado': 'Aprovado',
      'tratamento-concluido': 'Tratamento Concluído',
      'perdido': 'Perdido'
    }
    
    // Verificar se o cliente pertence ao usuário
    const cliente = await dbGet(db, 'SELECT id, nome, status FROM clientes WHERE id = ? AND usuario_id = ?', [
      req.params.id,
      req.user.id
    ])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    const statusAnterior = statusLabels[cliente.status] || cliente.status
    const statusNovo = statusLabels[status] || status
    
    await dbRun(db, 'UPDATE clientes SET status = ? WHERE id = ?', [status, req.params.id])
    
    // Adicionar ao histórico
    await dbRun(db, `
      INSERT INTO historico_cliente (cliente_id, tipo, descricao, usuario, data) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [
      req.params.id,
      'status',
      `Status alterado de "${statusAnterior}" para "${statusNovo}"`,
      req.user.nome || 'Sistema'
    ])
    
    res.json({ message: 'Status atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    res.status(500).json({ error: 'Erro ao atualizar status' })
  }
})

// GET /api/clientes/:id/historico - Buscar histórico do cliente
router.get('/:id/historico', async (req, res) => {
  try {
    const db = getDb()
    
    // Verificar se o cliente pertence ao usuário
    const cliente = await dbGet(db, 'SELECT id FROM clientes WHERE id = ? AND usuario_id = ?', [
      req.params.id,
      req.user.id
    ])
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }
    
    const historico = await dbAll(db, `
      SELECT * FROM historico_cliente 
      WHERE cliente_id = ? 
      ORDER BY data DESC
    `, [req.params.id])
    
    res.json(historico)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

export default router
