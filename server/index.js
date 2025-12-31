import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import dentistasRoutes from './routes/dentistas.js'
import diagnosticosRoutes from './routes/diagnosticos.js'
import chatRoutes from './routes/chat.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Inicializar banco de dados
initDatabase()

// Rotas
app.use('/api/auth', authRoutes)
app.use('/api/dentistas', dentistasRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/diagnosticos', diagnosticosRoutes)
app.use('/api/chat', chatRoutes)

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

