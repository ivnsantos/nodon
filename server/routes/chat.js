import express from 'express'
import { getDb, dbRun, dbAll } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Simulação de resposta da IA
// Em produção, você integraria com uma API real de IA (OpenAI, etc.)
const generateAIResponse = (message, history) => {
  const lowerMessage = message.toLowerCase()
  
  // Respostas básicas baseadas em palavras-chave
  if (lowerMessage.includes('cárie') || lowerMessage.includes('carie')) {
    return `A cárie dentária é uma doença causada por bactérias que destroem o esmalte dos dentes. O tratamento geralmente envolve:
    
1. Remoção da parte cariada
2. Limpeza da área afetada
3. Aplicação de material restaurador (amálgama ou resina)
4. Em casos mais graves, pode ser necessário tratamento de canal

É importante manter uma boa higiene bucal e visitas regulares ao dentista para prevenir cáries.`
  }
  
  if (lowerMessage.includes('gengiva') || lowerMessage.includes('gengivite')) {
    return `A gengivite é uma inflamação das gengivas causada pelo acúmulo de placa bacteriana. Os sintomas incluem:
    
- Gengivas vermelhas e inchadas
- Sangramento durante a escovação
- Sensibilidade

O tratamento envolve:
1. Limpeza profissional (tartarectomia)
2. Melhoria da higiene bucal diária
3. Uso de enxaguante bucal antisséptico
4. Em casos avançados, pode evoluir para periodontite

Consulte um dentista para avaliação adequada.`
  }
  
  if (lowerMessage.includes('dor') || lowerMessage.includes('sensibilidade')) {
    return `A dor de dente pode ter várias causas:
    
1. Cárie profunda
2. Abscesso dentário
3. Sensibilidade dentinária
4. Bruxismo
5. Dente quebrado ou lascado

Recomendações imediatas:
- Evitar alimentos muito quentes ou frios
- Usar analgésico se necessário
- Agendar consulta urgente com dentista

Para diagnóstico preciso, é necessário exame clínico e radiográfico.`
  }
  
  if (lowerMessage.includes('clareamento') || lowerMessage.includes('clarear')) {
    return `O clareamento dental pode ser feito de duas formas:
    
1. Clareamento caseiro (com moldeira e gel)
2. Clareamento em consultório (mais rápido e eficaz)

Considerações importantes:
- Não é recomendado para gestantes
- Pode causar sensibilidade temporária
- Resultados variam de pessoa para pessoa
- Manutenção é necessária após o tratamento

Consulte um dentista para avaliar qual método é mais adequado para você.`
  }
  
  // Resposta padrão
  return `Olá! Sou sua assistente de IA para questões odontológicas. 

Posso ajudá-lo com informações sobre:
- Cáries e tratamentos
- Problemas de gengiva
- Dores e sensibilidade
- Clareamento dental
- E outras questões odontológicas

Por favor, descreva sua dúvida ou sintoma de forma mais detalhada para que eu possa ajudá-lo melhor.

⚠️ Lembre-se: Esta é uma assistente virtual. Para diagnóstico e tratamento adequados, sempre consulte um dentista profissional.`
}

// Enviar mensagem para IA
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Mensagem é obrigatória' })
    }

    // Gerar resposta da IA (simulada)
    const aiResponse = generateAIResponse(message, history)

    // Salvar conversa no banco de dados
    const db = getDb()
    await dbRun(db, `
      INSERT INTO conversas (usuario_id, mensagem, resposta)
      VALUES (?, ?, ?)
    `, [req.user.id, message, aiResponse])

    res.json({ response: aiResponse })
  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
    res.status(500).json({ message: 'Erro ao processar mensagem' })
  }
})

// Obter histórico de conversas
router.get('/history', async (req, res) => {
  try {
    const db = getDb()
    const conversas = await dbAll(db, `
      SELECT * FROM conversas 
      WHERE usuario_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `, [req.user.id])
    
    res.json(conversas)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({ message: 'Erro ao buscar histórico' })
  }
})

// Obter uma conversa específica por ID
router.get('/history/:id', async (req, res) => {
  try {
    const db = getDb()
    const conversa = await dbAll(db, `
      SELECT * FROM conversas 
      WHERE id = ? AND usuario_id = ?
    `, [req.params.id, req.user.id])
    
    if (conversa.length === 0) {
      return res.status(404).json({ message: 'Conversa não encontrada' })
    }
    
    res.json(conversa[0])
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    res.status(500).json({ message: 'Erro ao buscar conversa' })
  }
})

export default router

