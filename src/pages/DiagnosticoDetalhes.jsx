import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faArrowLeft, faFileMedical, faCalendar, faUser,
  faCheck, faStethoscope, faFileAlt, faEnvelope, faPencil
} from '@fortawesome/free-solid-svg-icons'
import exameImage from '../img/exame.jpg'
import './DiagnosticoDetalhes.css'

// Dados mockados para detalhes
const getMockDetalhes = (diagnosticoId) => {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const semanaPassada = new Date(Date.now() - 604800000).toISOString().split('T')[0]
  
  const mockData = {
    1: {
      id: 1,
      paciente: 'Radiografia Panorâmica - Exemplo',
      descricao: 'Radiografia panorâmica de exemplo demonstrando a análise de estruturas dentárias. Observa-se arcada dentária completa superior e inferior, com dentição mista. Estruturas ósseas preservadas, seios maxilares aéreos, articulação temporomandibular (ATM) bilateralmente preservada. Presença de restaurações em alguns elementos dentários. Não há evidências de lesões periapicais, cistos ou outras patologias ósseas aparentes.',
      tratamento: 'Este é um exemplo de radiografia panorâmica. Para casos reais, recomenda-se:\n\n1. Análise detalhada das estruturas ósseas maxilares e mandibulares\n2. Verificação de integridade dentária e presença de restaurações\n3. Avaliação de possíveis patologias periapicais\n4. Análise dos seios maxilares e ATM\n5. Identificação de dentes inclusos ou impactados\n6. Acompanhamento periódico conforme protocolo clínico',
      data: hoje,
      imagem: exameImage,
      cliente_nome: 'João Silva',
      cliente_email: 'joao.silva@email.com',
      achados: [
        'Arcada dentária completa superior e inferior',
        'Estruturas ósseas preservadas',
        'Seios maxilares aéreos',
        'ATM bilateralmente preservada',
        'Presença de restaurações em alguns elementos',
        'Ausência de lesões periapicais aparentes'
      ],
      recomendacoes: [
        'Controle periódico a cada 6 meses',
        'Manutenção da higiene bucal',
        'Acompanhamento das restaurações existentes',
        'Avaliação clínica complementar quando necessário'
      ],
      profissional: 'Dr. Carlos Mendes',
      crm: 'CRO-SP 12345',
      tipoExame: 'Panorâmica'
    },
    2: {
      id: 2,
      paciente: 'Radiografia Periapical - Elemento 36',
      descricao: 'Radiografia periapical do elemento 36 (primeiro molar inferior direito). Observa-se raiz completa, espaço periodontal preservado, sem evidências de lesões periapicais. Presença de restauração em resina composta na face oclusal.',
      tratamento: 'Tratamento recomendado:\n\n1. Manutenção da restauração existente\n2. Controle periódico a cada 6 meses\n3. Orientação sobre higiene bucal\n4. Avaliação clínica complementar',
      data: ontem,
      imagem: exameImage,
      cliente_nome: 'Maria Santos',
      cliente_email: 'maria.santos@email.com',
      achados: [
        'Raiz completa do elemento 36',
        'Espaço periodontal preservado',
        'Ausência de lesões periapicais',
        'Restauração em resina composta presente'
      ],
      recomendacoes: [
        'Manutenção da restauração',
        'Controle periódico',
        'Orientação sobre higiene bucal'
      ],
      profissional: 'Dra. Ana Paula',
      crm: 'CRO-SP 67890',
      tipoExame: 'Periapical'
    },
    3: {
      id: 3,
      paciente: 'Radiografia Interproximal - Região Anterior',
      descricao: 'Radiografia interproximal da região anterior superior e inferior. Avaliação de cáries interproximais e contatos dentários. Observa-se boa relação de contato entre os elementos dentários, sem evidências de cáries ou lesões cariosas.',
      tratamento: 'Tratamento:\n\n1. Manutenção preventiva\n2. Aplicação de flúor tópico\n3. Orientação sobre uso de fio dental\n4. Retorno em 6 meses para controle',
      data: semanaPassada,
      imagem: exameImage,
      cliente_nome: 'Pedro Oliveira',
      cliente_email: 'pedro.oliveira@email.com',
      achados: [
        'Boa relação de contato entre elementos',
        'Ausência de cáries interproximais',
        'Estruturas dentárias preservadas'
      ],
      recomendacoes: [
        'Manutenção preventiva',
        'Aplicação de flúor tópico',
        'Uso regular de fio dental'
      ],
      profissional: 'Dr. Roberto Lima',
      crm: 'CRO-SP 11111',
      tipoExame: 'Interproximal'
    }
  }
  
  return mockData[diagnosticoId] || mockData[1]
}

const DiagnosticoDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [diagnostico, setDiagnostico] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDiagnostico()
  }, [id])

      const loadDiagnostico = async () => {
        try {
          // Simular delay de API
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Buscar diagnóstico do localStorage
          const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
          const diagnostico = savedDiagnosticos.find(d => d.id === parseInt(id))
          
          if (diagnostico) {
            // Adicionar dados mockados aos dados reais
            const mockDetalhes = getMockDetalhes(parseInt(id))
            const diagnosticoCompleto = {
              ...diagnostico,
              ...mockDetalhes,
              // Manter dados reais se existirem
              paciente: diagnostico.paciente || mockDetalhes.paciente,
              descricao: diagnostico.descricao || mockDetalhes.descricao,
              tratamento: diagnostico.tratamento || mockDetalhes.tratamento,
              data: diagnostico.data || mockDetalhes.data,
              // Sempre usar exameImage se não for base64 válido
              imagem: (diagnostico.imagem && typeof diagnostico.imagem === 'string' && diagnostico.imagem.startsWith('data:image')) 
                ? diagnostico.imagem 
                : exameImage
            }
            setDiagnostico(diagnosticoCompleto)
          } else {
            // Se não encontrar, usar dados mockados
            const mockDetalhes = getMockDetalhes(parseInt(id))
            setDiagnostico(mockDetalhes)
          }
        } catch (error) {
          console.error('Erro ao carregar diagnóstico:', error)
          // Se não encontrar, usar dados mockados
          const mockDetalhes = getMockDetalhes(parseInt(id))
          setDiagnostico(mockDetalhes)
        } finally {
          setLoading(false)
        }
      }

  if (loading) {
    return (
      <div className="diagnostico-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando detalhes da radiografia...</p>
      </div>
    )
  }

  if (!diagnostico) {
    return (
      <div className="diagnostico-detalhes-error">
        <h2>Radiografia não encontrada</h2>
        <button onClick={() => navigate('/app/diagnosticos')}>
          Voltar para Diagnósticos
        </button>
      </div>
    )
  }

  return (
    <div className="diagnostico-detalhes-page">
      <div className="detalhes-header">
        <div className="header-left-detalhes">
          <button className="btn-back-detalhes" onClick={() => navigate('/app/diagnosticos')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar
          </button>
          <h1>
            <FontAwesomeIcon icon={faFileMedical} /> Detalhes da Radiografia
          </h1>
        </div>
        <button 
          className="btn-desenho-detalhes"
          onClick={() => navigate(`/app/diagnosticos/${id}/desenho`)}
        >
          <FontAwesomeIcon icon={faPencil} /> Ir para Desenho
        </button>
      </div>

      <div className="detalhes-content">
            {/* Imagem da Radiografia */}
            <div className="detalhes-imagem-section">
              <img 
                src={exameImage}
                alt={diagnostico.paciente}
                className="detalhes-imagem"
              />
            </div>

        {/* Informações Principais */}
        <div className="detalhes-info-grid">
          <div className="detalhes-info-card">
            <h3>
              <FontAwesomeIcon icon={faUser} /> Informações do Paciente
            </h3>
            <div className="info-item">
              <strong>Radiografia:</strong>
              <span>{diagnostico.paciente}</span>
            </div>
            {diagnostico.cliente_nome && (
              <div className="info-item">
                <strong>Cliente:</strong>
                <span>{diagnostico.cliente_nome}</span>
              </div>
            )}
            {diagnostico.cliente_email && (
              <div className="info-item">
                <strong>Email:</strong>
                <span>{diagnostico.cliente_email}</span>
              </div>
            )}
            <div className="info-item">
              <strong>Data do Exame:</strong>
              <span>{new Date(diagnostico.data).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="info-item">
              <strong>Tipo de Exame:</strong>
              <span>{diagnostico.tipoExame || 'Radiografia Odontológica'}</span>
            </div>
          </div>

          <div className="detalhes-info-card">
            <h3>
              <FontAwesomeIcon icon={faUser} /> Profissional Responsável
            </h3>
            <div className="info-item">
              <strong>Nome:</strong>
              <span>{diagnostico.profissional || 'Dr. Carlos Mendes'}</span>
            </div>
            <div className="info-item">
              <strong>Registro:</strong>
              <span>{diagnostico.crm || 'CRO-SP 12345'}</span>
            </div>
            <div className="info-item">
              <strong>Data da Análise:</strong>
              <span>{new Date(diagnostico.dataAnalise || diagnostico.data).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="detalhes-section">
          <h3>
            <FontAwesomeIcon icon={faFileAlt} /> Descrição do Exame
          </h3>
          <div className="detalhes-text-content">
            {diagnostico.descricao.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        {/* Achados */}
        {diagnostico.achados && diagnostico.achados.length > 0 && (
          <div className="detalhes-section">
            <h3>
              <FontAwesomeIcon icon={faCheck} /> Achados Radiográficos
            </h3>
            <ul className="detalhes-list">
              {diagnostico.achados.map((achado, index) => (
                <li key={index}>
                  <FontAwesomeIcon icon={faCheck} className="list-icon" />
                  {achado}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tratamento */}
        <div className="detalhes-section">
          <h3>
            <FontAwesomeIcon icon={faStethoscope} /> Tratamento Recomendado
          </h3>
          <div className="detalhes-text-content">
            {diagnostico.tratamento.split('\n').map((line, index) => (
              <p key={index}>{line || <br />}</p>
            ))}
          </div>
        </div>

        {/* Recomendações */}
        {diagnostico.recomendacoes && diagnostico.recomendacoes.length > 0 && (
          <div className="detalhes-section">
            <h3>
              <FontAwesomeIcon icon={faFileMedical} /> Recomendações
            </h3>
            <ul className="detalhes-list">
              {diagnostico.recomendacoes.map((recomendacao, index) => (
                <li key={index}>
                  <FontAwesomeIcon icon={faCheck} className="list-icon" />
                  {recomendacao}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagnosticoDetalhes

