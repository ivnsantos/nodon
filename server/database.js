import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')

let db

export const getDb = () => {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err)
      } else {
        console.log('✅ Conectado ao banco de dados SQLite')
      }
    })
  }
  return db
}

const dbRun = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

const dbAll = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

const dbGet = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export const initDatabase = async () => {
  const database = getDb()

  // Criar tabela de usuários
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'usuario',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Criar tabela de dentistas
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS dentistas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      crm TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      telefone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Criar tabela de diagnósticos
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS diagnosticos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      cliente_id INTEGER,
      paciente TEXT NOT NULL,
      descricao TEXT NOT NULL,
      tratamento TEXT NOT NULL,
      data DATE NOT NULL,
      imagem TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `)
  
  // Adicionar colunas se não existirem (migração)
  try {
    await dbRun(database, `ALTER TABLE diagnosticos ADD COLUMN usuario_id INTEGER`)
  } catch (e) {
    // Coluna já existe
  }
  try {
    await dbRun(database, `ALTER TABLE diagnosticos ADD COLUMN cliente_id INTEGER`)
  } catch (e) {
    // Coluna já existe
  }
  try {
    await dbRun(database, `ALTER TABLE diagnosticos ADD COLUMN imagem TEXT`)
  } catch (e) {
    // Coluna já existe
  }

  // Criar tabela de conversas do chat
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS conversas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      mensagem TEXT NOT NULL,
      resposta TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `)

  // Criar tabela de clientes
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT,
      cpf TEXT,
      data_nascimento DATE,
      endereco TEXT,
      status TEXT NOT NULL DEFAULT 'avaliacao-realizada',
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `)

  // Criar tabela de necessidades
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS necessidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `)

  // Criar tabela de histórico do cliente
  await dbRun(database, `
    CREATE TABLE IF NOT EXISTS historico_cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      usuario TEXT NOT NULL,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `)

  // Criar usuário admin padrão se não existir
  const adminExists = await dbGet(database, 'SELECT id FROM usuarios WHERE email = ?', ['admin@dente.com'])
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await dbRun(database, `
      INSERT INTO usuarios (nome, email, password, tipo)
      VALUES (?, ?, ?, ?)
    `, ['Administrador', 'admin@dente.com', hashedPassword, 'admin'])
    console.log('👤 Usuário admin criado: admin@dente.com / admin123')
  }

  console.log('✅ Banco de dados inicializado')
}

export { dbRun, dbAll, dbGet }

