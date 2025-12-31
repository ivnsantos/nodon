import express from 'express'
import { getDb, dbAll, dbGet, dbRun } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Listar todos os diagnósticos
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const diagnosticos = await dbAll(db, `
      SELECT d.*, c.nome as cliente_nome, c.email as cliente_email
      FROM diagnosticos d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      WHERE d.usuario_id = ?
      ORDER BY d.data DESC, d.created_at DESC
    `, [req.user.id])
    res.json(diagnosticos)
  } catch (error) {
    console.error('Erro ao buscar diagnósticos:', error)
    res.status(500).json({ message: 'Erro ao buscar diagnósticos' })
  }
})

// Buscar diagnóstico por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const diagnostico = await dbGet(db, 'SELECT * FROM diagnosticos WHERE id = ?', [req.params.id])
    
    if (!diagnostico) {
      return res.status(404).json({ message: 'Diagnóstico não encontrado' })
    }

    res.json(diagnostico)
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error)
    res.status(500).json({ message: 'Erro ao buscar diagnóstico' })
  }
})

// Criar novo diagnóstico
router.post('/', async (req, res) => {
  try {
    const { paciente, descricao, tratamento, data, cliente_id, imagem } = req.body

    if (!paciente || !descricao || !tratamento || !data) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' })
    }

    const db = getDb()
    const result = await dbRun(db, `
      INSERT INTO diagnosticos (usuario_id, cliente_id, paciente, descricao, tratamento, data, imagem)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, cliente_id || null, paciente, descricao, tratamento, data, imagem || null])

    const diagnostico = await dbGet(db, `
      SELECT d.*, c.nome as cliente_nome, c.email as cliente_email
      FROM diagnosticos d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      WHERE d.id = ?
    `, [result.lastID])
    res.status(201).json(diagnostico)
  } catch (error) {
    console.error('Erro ao criar diagnóstico:', error)
    res.status(500).json({ message: 'Erro ao criar diagnóstico' })
  }
})

// Atualizar diagnóstico
router.put('/:id', async (req, res) => {
  try {
    const { paciente, descricao, tratamento, data } = req.body
    const db = getDb()

    await dbRun(db, `
      UPDATE diagnosticos 
      SET paciente = ?, descricao = ?, tratamento = ?, data = ?
      WHERE id = ?
    `, [paciente, descricao, tratamento, data, req.params.id])

    const diagnostico = await dbGet(db, 'SELECT * FROM diagnosticos WHERE id = ?', [req.params.id])
    res.json(diagnostico)
  } catch (error) {
    console.error('Erro ao atualizar diagnóstico:', error)
    res.status(500).json({ message: 'Erro ao atualizar diagnóstico' })
  }
})

// Deletar diagnóstico
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await dbRun(db, 'DELETE FROM diagnosticos WHERE id = ?', [req.params.id])
    res.json({ message: 'Diagnóstico deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar diagnóstico:', error)
    res.status(500).json({ message: 'Erro ao deletar diagnóstico' })
  }
})

export default router

