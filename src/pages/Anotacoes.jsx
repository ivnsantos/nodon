import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, faTrash, faEdit, faStickyNote, 
  faBold, faItalic, faUnderline, faListUl, faListOl,
  faAlignLeft, faAlignCenter, faAlignRight, faUndo, faRedo,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Anotacoes.css'

const Anotacoes = () => {
  const { selectedClinicData } = useAuth()
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [anotacoes, setAnotacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [anotacaoEditando, setAnotacaoEditando] = useState(null)
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    conteudoHTML: '',
    cor: '#FFE082',
    categoria: 'Lembrete'
  })
  const editorRef = useRef(null)

  const coresDisponiveis = [
    { nome: 'Amarelo', valor: '#FFE082' },
    { nome: 'Verde', valor: '#C5E1A5' },
    { nome: 'Laranja', valor: '#FFCCBC' },
    { nome: 'Roxo', valor: '#B39DDB' },
    { nome: 'Azul', valor: '#90CAF9' },
    { nome: 'Rosa', valor: '#F8BBD0' },
    { nome: 'Ciano', valor: '#80DEEA' },
    { nome: 'Bege', valor: '#D7CCC8' }
  ]

  const categorias = ['Lembrete', 'Estudo', 'Paciente', 'Material', 'Curso', 'Protocolo', 'Outro']

  // Carregar anotações ao montar o componente
  useEffect(() => {
    if (selectedClinicData) {
      loadAnotacoes()
    }
  }, [selectedClinicData])

  // Função para carregar anotações da API
  const loadAnotacoes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/anotacoes')
      
      // Tratar diferentes formatos de resposta da API
      let anotacoesData = []
      if (response.data) {
        if (response.data.statusCode === 200 || response.data.statusCode === 201) {
          // Formato: { statusCode: 200, message: "Success", data: { data: [...] } }
          if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            anotacoesData = response.data.data.data
          } else if (Array.isArray(response.data.data)) {
            anotacoesData = response.data.data
          }
        } else if (Array.isArray(response.data)) {
          anotacoesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          anotacoesData = response.data.data
        }
      }
      
      setAnotacoes(anotacoesData)
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar anotações. Tente novamente.'
      showError(errorMessage)
      setAnotacoes([])
    } finally {
      setLoading(false)
    }
  }

  const handleNovaAnotacao = () => {
    setAnotacaoEditando(null)
    setFormData({
      titulo: '',
      conteudo: '',
      conteudoHTML: '',
      cor: '#FFE082',
      categoria: 'Lembrete'
    })
    setMostrarFormulario(true)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    }, 100)
  }

  const handleEditarAnotacao = (anotacao) => {
    setAnotacaoEditando(anotacao)
    const conteudoHTML = anotacao.conteudoHTML || anotacao.conteudo || ''
    setFormData({
      titulo: anotacao.titulo,
      conteudo: anotacao.conteudo || '',
      conteudoHTML: conteudoHTML,
      cor: anotacao.cor,
      categoria: anotacao.categoria
    })
    setMostrarFormulario(true)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = conteudoHTML
      }
    }, 100)
  }

  // Atualizar conteúdo do editor quando formData.conteudoHTML mudar
  useEffect(() => {
    if (mostrarFormulario && editorRef.current && formData.conteudoHTML && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = formData.conteudoHTML
    }
  }, [mostrarFormulario, formData.conteudoHTML])

  const handleSalvar = async (e) => {
    e.preventDefault()
    
    const conteudoHTML = editorRef.current?.innerHTML || ''
    const conteudoTexto = editorRef.current?.innerText || ''
    
    if (!formData.titulo.trim() || !conteudoTexto.trim()) {
      showError('Por favor, preencha título e conteúdo')
      return
    }

    const payload = {
      titulo: formData.titulo.trim(),
      conteudo: conteudoTexto.trim(),
      conteudoHTML: conteudoHTML.trim(),
      categoria: formData.categoria,
      cor: formData.cor
    }

    try {
      setSalvando(true)

      if (anotacaoEditando) {
        // Atualizar anotação existente
        const response = await api.patch(`/anotacoes/${anotacaoEditando.id}`, payload)
        
        const anotacaoAtualizada = response.data?.data || response.data
        if (anotacaoAtualizada) {
          setAnotacoes(anotacoes.map(anot => 
            anot.id === anotacaoEditando.id
              ? { ...anot, ...anotacaoAtualizada }
              : anot
          ))
          showSuccess('Anotação atualizada com sucesso!')
        }
      } else {
        // Criar nova anotação
        const response = await api.post('/anotacoes', payload)
        
        const novaAnotacao = response.data?.data || response.data
        if (novaAnotacao) {
          setAnotacoes([novaAnotacao, ...anotacoes])
          showSuccess('Anotação criada com sucesso!')
        }
      }

      setMostrarFormulario(false)
      setAnotacaoEditando(null)
      setFormData({
        titulo: '',
        conteudo: '',
        conteudoHTML: '',
        cor: '#FFE082',
        categoria: 'Lembrete'
      })
      
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    } catch (error) {
      console.error('Erro ao salvar anotação:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar anotação. Tente novamente.'
      showError(errorMessage)
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      return
    }

    try {
      setExcluindo(id)
      await api.delete(`/anotacoes/${id}`)
      
      setAnotacoes(anotacoes.filter(anot => anot.id !== id))
      showSuccess('Anotação excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir anotação:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao excluir anotação. Tente novamente.'
      showError(errorMessage)
    } finally {
      setExcluindo(null)
    }
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setAnotacaoEditando(null)
    setFormData({
      titulo: '',
      conteudo: '',
      conteudoHTML: '',
      cor: '#FFE082',
      categoria: 'Lembrete'
    })
  }

  // Funções do editor de texto rico
  const executarComando = (comando, valor = null) => {
    document.execCommand(comando, false, valor)
    editorRef.current?.focus()
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const texto = editorRef.current.innerText
      setFormData({
        ...formData,
        conteudo: texto,
        conteudoHTML: html
      })
    }
  }

  const formatarData = (dataISO) => {
    if (!dataISO) return ''
    const data = new Date(dataISO)
    if (isNaN(data.getTime())) return ''
    
    const dia = String(data.getDate()).padStart(2, '0')
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const ano = data.getFullYear()
    const hora = String(data.getHours()).padStart(2, '0')
    const minuto = String(data.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`
  }

  return (
    <div className="anotacoes-container">
      <AlertModal
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />

      <div className="anotacoes-header">
        <div className="anotacoes-header-left">
          <FontAwesomeIcon icon={faStickyNote} className="anotacoes-icon" />
          <div>
            <h1>Anotações</h1>
            <p>Lembretes e estudos importantes</p>
          </div>
        </div>
        <button 
          className="btn-nova-anotacao" 
          onClick={handleNovaAnotacao}
          disabled={loading || salvando}
        >
          <FontAwesomeIcon icon={faPlus} />
          Nova Anotação
        </button>
      </div>

      {mostrarFormulario && (
        <div className="anotacao-form-container">
          <form className="anotacao-form" onSubmit={handleSalvar}>
            <div className="form-header">
              <h3>{anotacaoEditando ? 'Editar Anotação' : 'Nova Anotação'}</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="titulo">Título</label>
              <input
                type="text"
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="conteudo">Conteúdo</label>
              <div className="editor-toolbar">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('bold')}
                  title="Negrito"
                >
                  <FontAwesomeIcon icon={faBold} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('italic')}
                  title="Itálico"
                >
                  <FontAwesomeIcon icon={faItalic} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('underline')}
                  title="Sublinhado"
                >
                  <FontAwesomeIcon icon={faUnderline} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('insertUnorderedList')}
                  title="Lista com marcadores"
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('insertOrderedList')}
                  title="Lista numerada"
                >
                  <FontAwesomeIcon icon={faListOl} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('justifyLeft')}
                  title="Alinhar à esquerda"
                >
                  <FontAwesomeIcon icon={faAlignLeft} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('justifyCenter')}
                  title="Centralizar"
                >
                  <FontAwesomeIcon icon={faAlignCenter} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('justifyRight')}
                  title="Alinhar à direita"
                >
                  <FontAwesomeIcon icon={faAlignRight} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('undo')}
                  title="Desfazer"
                >
                  <FontAwesomeIcon icon={faUndo} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => executarComando('redo')}
                  title="Refazer"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="editor-content"
                onInput={handleEditorChange}
                onBlur={handleEditorChange}
                data-placeholder="Digite o conteúdo da anotação..."
              />
            </div>

            <div className="form-group">
              <label>Cor do Post-it</label>
              <div className="cores-grid">
                {coresDisponiveis.map(cor => (
                  <button
                    key={cor.valor}
                    type="button"
                    className={`cor-option ${formData.cor === cor.valor ? 'selected' : ''}`}
                    style={{ backgroundColor: cor.valor }}
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancelar" 
                onClick={handleCancelar}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-salvar"
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    {anotacaoEditando ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  anotacaoEditando ? 'Salvar Alterações' : 'Criar Anotação'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="anotacoes-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Carregando anotações...</p>
        </div>
      ) : anotacoes.length === 0 ? (
        <div className="anotacoes-empty">
          <FontAwesomeIcon icon={faStickyNote} />
          <p>Nenhuma anotação ainda</p>
          <button 
            className="btn-nova-anotacao-empty" 
            onClick={handleNovaAnotacao}
            disabled={salvando}
          >
            Criar primeira anotação
          </button>
        </div>
      ) : (
        <div className="anotacoes-grid">
          {anotacoes.map(anotacao => (
            <div
              key={anotacao.id}
              className="anotacao-card"
              style={{ backgroundColor: anotacao.cor }}
            >
              <div className="anotacao-header">
                <span className="anotacao-categoria">{anotacao.categoria}</span>
                <div className="anotacao-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditarAnotacao(anotacao)}
                    title="Editar"
                    disabled={excluindo === anotacao.id}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleExcluir(anotacao.id)}
                    title="Excluir"
                    disabled={excluindo === anotacao.id}
                  >
                    {excluindo === anotacao.id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </button>
                </div>
              </div>
              <h3 className="anotacao-titulo">{anotacao.titulo}</h3>
              <div 
                className="anotacao-conteudo"
                dangerouslySetInnerHTML={{ __html: anotacao.conteudoHTML || anotacao.conteudo }}
              />
              <div className="anotacao-footer">
                <span className="anotacao-data">{formatarData(anotacao.createdAt || anotacao.dataCriacao)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Anotacoes

