import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import AddClinic from './pages/AddClinic'
import Dentistas from './pages/Dentistas'
import Diagnosticos from './pages/Diagnosticos'
import DiagnosticoDetalhes from './pages/DiagnosticoDetalhes'
import DiagnosticoDesenho from './pages/DiagnosticoDesenho'
import DetalhamentoProfissional from './pages/DetalhamentoProfissional'
import Chat from './pages/Chat'
import Clientes from './pages/Clientes'
import ClienteDetalhes from './pages/ClienteDetalhes'
import ClienteNovo from './pages/ClienteNovo'
import Orcamentos from './pages/Orcamentos'
import OrcamentoNovo from './pages/OrcamentoNovo'
import OrcamentoDetalhes from './pages/OrcamentoDetalhes'
import Anamneses from './pages/Anamneses'
import AnamneseNovo from './pages/AnamneseNovo'
import AnamneseDetalhes from './pages/AnamneseDetalhes'
import Perfil from './pages/Perfil'
import Calendario from './pages/Calendario'
import AssinaturaPendente from './pages/AssinaturaPendente'
import VerifyEmail from './pages/VerifyEmail'
import SelectClinic from './pages/SelectClinic'
import UsuarioInativo from './pages/UsuarioInativo'
import RegisterByHash from './pages/RegisterByHash'
import LPDentista from './pages/LPDentista'
import LPEstudante from './pages/LPEstudante'
import GoogleCallback from './pages/GoogleCallback'
import ForgotPassword from './pages/ForgotPassword'
import ForgotPasswordPhone from './pages/ForgotPasswordPhone'
import ResetPassword from './pages/ResetPassword'
import ResponderAnamnese from './pages/ResponderAnamnese'
import AnamneseEntrada from './pages/AnamneseEntrada'
import Feedback from './pages/Feedback'
import FeedbackNovo from './pages/FeedbackNovo'
import FeedbackRespostas from './pages/FeedbackRespostas'
import ResponderQuestionario from './pages/ResponderQuestionario'
import ResponderQuestionarioForm from './pages/ResponderQuestionarioForm'
import Precificacao from './pages/Precificacao'
import PrecificacaoTratamento from './pages/PrecificacaoTratamento'
import PrecificacaoCategoria from './pages/PrecificacaoCategoria'
import PrecificacaoProduto from './pages/PrecificacaoProduto'
import Anotacoes from './pages/Anotacoes'
import AgendamentoPublico from './pages/AgendamentoPublico'
import ConfirmarAgendamento from './pages/ConfirmarAgendamento'
import { AuthProvider } from './context/AuthContext'
import { ChatHeaderProvider } from './context/ChatHeaderContext'

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/checkout" element={
          <PublicRoute>
            <Checkout />
          </PublicRoute>
        } />
        <Route path="/add-clinic" element={
          <ProtectedRoute>
            <AddClinic />
          </ProtectedRoute>
        } />
        <Route path="/verify-email" element={
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/forgot-password-phone" element={
          <PublicRoute>
            <ForgotPasswordPhone />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/facebook/callback" element={<GoogleCallback />} />
        <Route path="/select-clinic" element={
          <ProtectedRoute>
            <SelectClinic />
          </ProtectedRoute>
        } />
        <Route path="/assinatura-pendente" element={
          <ProtectedRoute>
            <AssinaturaPendente />
          </ProtectedRoute>
        } />
        <Route path="/usuario-inativo" element={
          <ProtectedRoute>
            <UsuarioInativo />
          </ProtectedRoute>
        } />
        <Route path="/profissional/:hash" element={
          <PublicRoute>
            <RegisterByHash />
          </PublicRoute>
        } />
        <Route path="/lp/dentista" element={
          <PublicRoute>
            <LPDentista />
          </PublicRoute>
        } />
        <Route path="/lp/estudante" element={
          <PublicRoute>
            <LPEstudante />
          </PublicRoute>
        } />
        <Route path="/responder-anamnese/:id" element={
          <PublicRoute>
            <AnamneseEntrada />
          </PublicRoute>
        } />
        <Route path="/responder-anamnese/:id/iniciar" element={
          <PublicRoute>
            <ResponderAnamnese />
          </PublicRoute>
        } />
        <Route path="/responder-questionario/:id" element={
          <PublicRoute>
            <ResponderQuestionario />
          </PublicRoute>
        } />
        <Route path="/responder-questionario/:id/iniciar" element={
          <PublicRoute>
            <ResponderQuestionarioForm />
          </PublicRoute>
        } />
        <Route path="/agendamento/:id" element={
          <PublicRoute>
            <AgendamentoPublico />
          </PublicRoute>
        } />
        <Route path="/confirmar-agendamento/:consultaId" element={
          <PublicRoute>
            <ConfirmarAgendamento />
          </PublicRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dentistas" element={<Dentistas />} />
          <Route path="diagnosticos" element={<Diagnosticos />} />
          <Route path="diagnosticos/:id" element={<DiagnosticoDetalhes />} />
          <Route path="diagnosticos/:id/desenho" element={<DiagnosticoDesenho />} />
          <Route path="diagnosticos/:id/detalhamento-profissional" element={<DetalhamentoProfissional />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="feedback/novo" element={<FeedbackNovo />} />
          <Route path="feedback/:id/editar" element={<FeedbackNovo />} />
          <Route path="feedback/:id/respostas" element={<FeedbackRespostas />} />
          <Route path="precificacao" element={<Precificacao />} />
          <Route path="precificacao/tratamento/novo" element={<PrecificacaoTratamento />} />
          <Route path="precificacao/tratamento/:id/editar" element={<PrecificacaoTratamento />} />
          <Route path="precificacao/categoria/novo" element={<PrecificacaoCategoria />} />
          <Route path="precificacao/categoria/:id/editar" element={<PrecificacaoCategoria />} />
          <Route path="precificacao/produto/novo" element={<PrecificacaoProduto />} />
          <Route path="precificacao/produto/:id/editar" element={<PrecificacaoProduto />} />
          <Route path="anotacoes" element={<Anotacoes />} />
          <Route path="chat" element={<Chat />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<ClienteNovo />} />
          <Route path="clientes/:id" element={<ClienteDetalhes />} />
          <Route path="clientes/:id/editar" element={<ClienteNovo />} />
          <Route path="orcamentos" element={<Orcamentos />} />
          <Route path="orcamentos/novo" element={<OrcamentoNovo />} />
          <Route path="orcamentos/:id" element={<OrcamentoDetalhes />} />
          <Route path="orcamentos/:id/editar" element={<OrcamentoNovo />} />
          <Route path="anamneses" element={<Anamneses />} />
          <Route path="anamneses/novo" element={<AnamneseNovo />} />
          <Route path="anamneses/:id" element={<AnamneseDetalhes />} />
          <Route path="anamneses/:id/editar" element={<AnamneseNovo />} />
        </Route>
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <ChatHeaderProvider>
        <AppRoutes />
      </ChatHeaderProvider>
    </AuthProvider>
  )
}

export default App

