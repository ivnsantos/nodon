import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminNew from './pages/AdminNew'

const AppAdmin = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminNew />} />
        <Route path="*" element={<AdminNew />} />
      </Routes>
    </Router>
  )
}

export default AppAdmin
