export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const asaasApiUrl = process.env.VITE_ASAAS_API_URL || 'https://api.asaas.com'
    const asaasToken = process.env.VITE_ASAAS_TOKEN

    if (!asaasToken) {
      return res.status(500).json({ error: 'Token Asaas não configurado' })
    }

    // Fazer requisição para a API Asaas
    const response = await fetch(`${asaasApiUrl}/v3/creditCard/tokenizeCreditCard`, {
      method: 'POST',
      headers: {
        'access_token': asaasToken,
        'User-Agent': 'Checkout assas.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    // Retornar status e dados
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Erro ao tokenizar cartão:', error)
    return res.status(500).json({ error: error.message || 'Erro ao processar requisição' })
  }
}
