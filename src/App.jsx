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
import ResetPassword from './pages/ResetPassword'
import ResponderAnamnese from './pages/ResponderAnamnese'
import AnamneseEntrada from './pages/AnamneseEntrada'
import { AuthProvider } from './context/AuthContext'

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
          <Route path="chat" element={<Chat />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<ClienteNovo />} />
          <Route path="clientes/:id" element={<ClienteDetalhes />} />
          <Route path="clientes/:id/editar" element={<ClienteNovo />} />
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
      <AppRoutes />
    </AuthProvider>
  )
}

export default App

