import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, dbGet, dbRun } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Registrar novo usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, password, tipo } = req.body

    if (!nome || !email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' })
    }

    const db = getDb()
    
    // Verificar se email já existe
    const existingUser = await dbGet(db, 'SELECT id FROM usuarios WHERE email = ?', [email])
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserir usuário
    const result = await dbRun(db, `
      INSERT INTO usuarios (nome, email, password, tipo)
      VALUES (?, ?, ?, ?)
    `, [nome, email, hashedPassword, tipo || 'usuario'])

    // Buscar usuário criado
    const user = await dbGet(db, 'SELECT id, nome, email, tipo FROM usuarios WHERE id = ?', [result.lastID])

    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET || 'seu-secret-key-aqui',
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user })
  } catch (error) {
    console.error('Erro ao registrar:', error)
    res.status(500).json({ message: 'Erro ao registrar usuário' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' })
    }

    const db = getDb()
    
    // Buscar usuário
    const user = await dbGet(db, 'SELECT * FROM usuarios WHERE email = ?', [email])
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET || 'seu-secret-key-aqui',
      { expiresIn: '7d' }
    )

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user

    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
})

// Obter usuário atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    const user = await dbGet(db, 'SELECT id, nome, email, tipo FROM usuarios WHERE id = ?', [req.user.id])
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar usuário' })
  }
})

export default router

