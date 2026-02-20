# Configuração do Proxy Asaas no Backend

## Problema
Em produção no Vercel, o proxy do Vite não funciona. O frontend precisa fazer chamadas para a API Asaas através do backend.

## Solução
O backend precisa ter um endpoint que faça proxy para a API Asaas.

## Endpoint Necessário

### Rota: `POST /api/asaas-proxy/creditCard/tokenizeCreditCard`

Este endpoint deve:
1. Receber o payload do frontend
2. Fazer uma requisição POST para a API Asaas: `https://api.asaas.com/v3/creditCard/tokenizeCreditCard` (ou sandbox em dev)
3. Adicionar os headers necessários:
   - `access_token`: Token da Asaas (de variável de ambiente)
   - `User-Agent`: `Checkout assas.com`
   - `Content-Type`: `application/json`
4. Retornar a resposta da Asaas para o frontend

### Exemplo de Implementação (Node.js/Express)

```javascript
// Rota de proxy para tokenização de cartão
router.post('/asaas-proxy/creditCard/tokenizeCreditCard', async (req, res) => {
  try {
    const asaasApiUrl = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com'
    const asaasToken = process.env.ASAAS_TOKEN
    
    if (!asaasToken) {
      return res.status(500).json({ error: 'Token Asaas não configurado' })
    }
    
    const response = await axios.post(
      `${asaasApiUrl}/v3/creditCard/tokenizeCreditCard`,
      req.body,
      {
        headers: {
          'access_token': asaasToken,
          'User-Agent': 'Checkout assas.com',
          'Content-Type': 'application/json'
        }
      }
    )
    
    res.json(response.data)
  } catch (error) {
    console.error('Erro ao tokenizar cartão:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    })
  }
})
```

## Variáveis de Ambiente Necessárias

No backend, configure:
- `ASAAS_API_URL`: URL da API Asaas (https://api.asaas.com para produção, https://api-sandbox.asaas.com para dev)
- `ASAAS_TOKEN`: Token de acesso da Asaas

## Nota
O frontend já está configurado para usar este endpoint em produção automaticamente.

