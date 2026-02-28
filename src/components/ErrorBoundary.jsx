import { Component } from 'react'

/**
 * Error Boundary: evita tela branca quando um erro não capturado ocorre na árvore de componentes.
 * Exibe uma mensagem e um botão para recarregar a página.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#e2e8f0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center'
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Algo deu errado</h1>
          <p style={{ marginBottom: 24, opacity: 0.9 }}>
            A página encontrou um erro. Tente recarregar.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#fff',
              background: '#0ea5e9',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
