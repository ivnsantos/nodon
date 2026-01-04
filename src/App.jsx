import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import Dentistas from './pages/Dentistas'
import Diagnosticos from './pages/Diagnosticos'
import DiagnosticoDetalhes from './pages/DiagnosticoDetalhes'
import DiagnosticoDesenho from './pages/DiagnosticoDesenho'
import DetalhamentoProfissional from './pages/DetalhamentoProfissional'
import Chat from './pages/Chat'
import Clientes from './pages/Clientes'
import ClienteDetalhes from './pages/ClienteDetalhes'
import ClienteNovo from './pages/ClienteNovo'
import Perfil from './pages/Perfil'
import AssinaturaPendente from './pages/AssinaturaPendente'
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
        <Route path="/assinatura-pendente" element={
          <ProtectedRoute>
            <AssinaturaPendente />
          </ProtectedRoute>
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
          <Route path="chat" element={<Chat />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<ClienteNovo />} />
          <Route path="clientes/:id" element={<ClienteDetalhes />} />
          <Route path="clientes/:id/editar" element={<ClienteNovo />} />
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

