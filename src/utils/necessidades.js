/**
 * Utilitários para o recurso Necessidades (API atualizada).
 * Resposta da API: array de objetos { id, descricao, status, observacao, pacienteId, radiografiaId, clienteMasterId, createdAt, updatedAt }
 * Status permitidos: analisado_ia | validado | em_andamento | concluido
 */

/** Converte item vindo da API (objeto ou string legado) para formato interno { id?, texto, status?, origem, radiografiaId?, ... } */
function itemFromApi(nec, defaultOrigem = 'paciente') {
  if (nec == null) return null
  if (typeof nec === 'string') {
    return { texto: nec.trim(), origem: defaultOrigem }
  }
  if (typeof nec === 'object' && nec.descricao !== undefined) {
    return {
      id: nec.id,
      texto: typeof nec.descricao === 'string' ? nec.descricao : String(nec.descricao || ''),
      status: nec.status,
      observacao: nec.observacao,
      pacienteId: nec.pacienteId,
      radiografiaId: nec.radiografiaId,
      clienteMasterId: nec.clienteMasterId,
      origem: nec.radiografiaId ? 'radiografia' : defaultOrigem,
      radiografiaId: nec.radiografiaId,
      createdAt: nec.createdAt,
      updatedAt: nec.updatedAt
    }
  }
  if (Array.isArray(nec)) return null
  return { texto: String(nec), origem: defaultOrigem }
}

/**
 * Normaliza necessidades vindas da API (GET pacientes, GET radiografias, GET necessidades)
 * para formato interno: array de { id?, texto, status?, origem, radiografiaId?, ... }
 */
export function normalizeNecessidadesFromApi(necessidadesRaw, defaultOrigem = 'paciente') {
  if (!necessidadesRaw) return []
  if (!Array.isArray(necessidadesRaw)) {
    if (typeof necessidadesRaw === 'string' && necessidadesRaw.trim()) {
      try {
        const parsed = JSON.parse(necessidadesRaw)
        if (Array.isArray(parsed)) return normalizeNecessidadesFromApi(parsed, defaultOrigem)
      } catch (_) {}
    }
    const one = itemFromApi(necessidadesRaw, defaultOrigem)
    return one ? [one] : []
  }
  return necessidadesRaw
    .map(nec => itemFromApi(nec, defaultOrigem))
    .filter(Boolean)
}

/**
 * Retorna apenas os textos (descricao) para uso em formulários que esperam array de strings.
 */
export function necessidadesToDisplayStrings(necessidadesRaw) {
  const normalized = normalizeNecessidadesFromApi(necessidadesRaw)
  return normalized.map(n => n.texto).filter(Boolean)
}

/** Status permitidos pela API */
export const NECESSIDADES_STATUS = ['analisado_ia', 'validado', 'em_andamento', 'concluido']

/** Rótulos para exibição do status */
export const NECESSIDADES_STATUS_LABELS = {
  analisado_ia: 'Analisado IA',
  validado: 'Validado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído'
}

/** Cores por status – blocos sólidos como no layout (Avaliação=azul, Em andamento=laranja, Aprovado=verde, Concluído=roxo) */
export const NECESSIDADES_STATUS_COLORS = {
  analisado_ia: '#2563eb',   /* azul sólido - Avaliação Realizada */
  validado: '#16a34a',       /* verde sólido - Aprovado */
  em_andamento: '#ea580c',   /* laranja sólido - Em Andamento */
  concluido: '#7c3aed'       /* roxo sólido - Tratamento Concluído */
}

/** Status que podem ser escolhidos ao adicionar nova necessidade (sem analisado_ia); padrão = último = concluido */
export const NECESSIDADES_STATUS_OPCOES_NOVA = ['validado', 'em_andamento', 'concluido']
export const NECESSIDADES_STATUS_PADRAO_NOVA = 'concluido'

/**
 * Chamadas à API de necessidades.
 * Base: /api/necessidades
 * Listar: GET ?clienteMasterId=UUID (&pacienteId=UUID | &radiografiaId=UUID)
 * Buscar uma: GET /:id
 * Criar: POST body { clienteMasterId, pacienteId, descricao, status?, observacao?, radiografiaId? }
 * Atualizar: PUT /:id body { status?, observacao?, descricao? }
 * Remover: DELETE /:id
 */
export function necessidadesApi(apiClient) {
  return {
    listar(params) {
      return apiClient.get('/necessidades', { params })
    },
    listarPorCliente(clienteMasterId) {
      return apiClient.get('/necessidades', { params: { clienteMasterId } })
    },
    listarPorPaciente(clienteMasterId, pacienteId) {
      return apiClient.get('/necessidades', { params: { clienteMasterId, pacienteId } })
    },
    listarPorRadiografia(clienteMasterId, radiografiaId) {
      return apiClient.get('/necessidades', { params: { clienteMasterId, radiografiaId } })
    },
    buscar(id) {
      return apiClient.get(`/necessidades/${id}`)
    },
    criar(body) {
      return apiClient.post('/necessidades', body)
    },
    atualizar(id, body) {
      return apiClient.put(`/necessidades/${id}`, body)
    },
    remover(id) {
      return apiClient.delete(`/necessidades/${id}`)
    }
  }
}
