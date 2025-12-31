import express from 'express'
import { getDb, dbAll, dbGet, dbRun } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Listar todos os dentistas
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const dentistas = await dbAll(db, 'SELECT * FROM dentistas ORDER BY created_at DESC')
    res.json(dentistas)
  } catch (error) {
    console.error('Erro ao buscar dentistas:', error)
    res.status(500).json({ message: 'Erro ao buscar dentistas' })
  }
})

// Buscar dentista por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const dentista = await dbGet(db, 'SELECT * FROM dentistas WHERE id = ?', [req.params.id])
    
    if (!dentista) {
      return res.status(404).json({ message: 'Dentista não encontrado' })
    }

    res.json(dentista)
  } catch (error) {
    console.error('Erro ao buscar dentista:', error)
    res.status(500).json({ message: 'Erro ao buscar dentista' })
  }
})

// Criar novo dentista
router.post('/', async (req, res) => {
  try {
    const { nome, email, crm, especialidade, telefone } = req.body

    if (!nome || !email || !crm || !especialidade) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' })
    }

    const db = getDb()
    
    // Verificar se email já existe
    const existing = await dbGet(db, 'SELECT id FROM dentistas WHERE email = ?', [email])
    if (existing) {
      return res.status(400).json({ message: 'Email já cadastrado' })
    }

    const result = await dbRun(db, `
      INSERT INTO dentistas (nome, email, crm, especialidade, telefone)
      VALUES (?, ?, ?, ?, ?)
    `, [nome, email, crm, especialidade, telefone || null])

    const dentista = await dbGet(db, 'SELECT * FROM dentistas WHERE id = ?', [result.lastID])
    res.status(201).json(dentista)
  } catch (error) {
    console.error('Erro ao criar dentista:', error)
    res.status(500).json({ message: 'Erro ao criar dentista' })
  }
})

// Atualizar dentista
router.put('/:id', async (req, res) => {
  try {
    const { nome, email, crm, especialidade, telefone } = req.body
    const db = getDb()

    await dbRun(db, `
      UPDATE dentistas 
      SET nome = ?, email = ?, crm = ?, especialidade = ?, telefone = ?
      WHERE id = ?
    `, [nome, email, crm, especialidade, telefone || null, req.params.id])

    const dentista = await dbGet(db, 'SELECT * FROM dentistas WHERE id = ?', [req.params.id])
    res.json(dentista)
  } catch (error) {
    console.error('Erro ao atualizar dentista:', error)
    res.status(500).json({ message: 'Erro ao atualizar dentista' })
  }
})

// Deletar dentista
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await dbRun(db, 'DELETE FROM dentistas WHERE id = ?', [req.params.id])
    res.json({ message: 'Dentista deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar dentista:', error)
    res.status(500).json({ message: 'Erro ao deletar dentista' })
  }
})

export default router

