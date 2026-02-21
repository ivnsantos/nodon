export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  // Permitir apenas POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Lidar com preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    const asaasApiUrl = process.env.VITE_ASAAS_API_URL || 'https://api.asaas.com'
    const asaasToken = process.env.VITE_ASAAS_TOKEN

    if (!asaasToken) {
      return new Response(JSON.stringify({ error: 'Token Asaas não configurado' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const requestBody = await request.json()

    // Fazer requisição para a API Asaas
    const response = await fetch(`${asaasApiUrl}/v3/creditCard/tokenizeCreditCard`, {
      method: 'POST',
      headers: {
        'access_token': asaasToken,
        'User-Agent': 'Checkout assas.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    // Retornar status e dados
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Erro ao tokenizar cartão:', error)
    return new Response(JSON.stringify({ error: error.message || 'Erro ao processar requisição' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
