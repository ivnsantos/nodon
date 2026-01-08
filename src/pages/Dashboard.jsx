import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserMd, faFileAlt, faComments, faUsers,
  faXRay, faUser, faFileMedical, faImage,
  faChartLine, faClock, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview')
  const { isUsuario } = useAuth()

  const allStats = [
    { label: 'Total de Dentistas', value: '0', icon: faUserMd, color: '#0ea5e9', trend: '+12%', hideForUsuario: true },
    { label: 'Radiografias', value: '0', icon: faXRay, color: '#06b6d4', trend: '+8%', hideForUsuario: false },
    { label: 'Pacientes', value: '0', icon: faUsers, color: '#14b8a6', trend: '+15%', hideForUsuario: false },
    { label: 'Relatórios', value: '0', icon: faFileMedical, color: '#8b5cf6', trend: '+20%', hideForUsuario: false },
  ]

  // Filtrar stats baseado no tipo de relacionamento
  const stats = isUsuario() 
    ? allStats.filter(stat => !stat.hideForUsuario)
    : allStats

  const recentRadiographs = [
    { id: 1, patient: 'João Silva', date: '2024-01-15', type: 'Panorâmica', status: 'Analisado' },
    { id: 2, patient: 'Maria Santos', date: '2024-01-14', type: 'Periapical', status: 'Pendente' },
    { id: 3, patient: 'Pedro Costa', date: '2024-01-13', type: 'Panorâmica', status: 'Analisado' },
  ]

  const recentPatients = [
    { id: 1, name: 'Ana Oliveira', age: 35, lastVisit: '2024-01-10', image: null },
    { id: 2, name: 'Carlos Mendes', age: 42, lastVisit: '2024-01-08', image: null },
    { id: 3, name: 'Julia Ferreira', age: 28, lastVisit: '2024-01-05', image: null },
  ]

  const recentReports = [
    { id: 1, patient: 'João Silva', date: '2024-01-15', findings: 12, status: 'Concluído' },
    { id: 2, patient: 'Maria Santos', date: '2024-01-14', findings: 8, status: 'Em análise' },
    { id: 3, patient: 'Pedro Costa', date: '2024-01-13', findings: 15, status: 'Concluído' },
  ]

  return (
    <div className="dashboard-modern">
      <div className="stats-grid-modern">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-modern">
            <div className="stat-card-bg" style={{ background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)` }}></div>
            <div className="stat-icon-modern" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)` }}>
              <FontAwesomeIcon icon={stat.icon} />
            </div>
            <div className="stat-content-modern">
              <p className="stat-value-modern">{stat.value}</p>
              <p className="stat-label-modern">{stat.label}</p>
              <span className="stat-trend">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          <FontAwesomeIcon icon={faChartLine} /> Visão Geral
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'radiographs' ? 'active' : ''}`}
          onClick={() => setSelectedTab('radiographs')}
        >
          <FontAwesomeIcon icon={faXRay} /> Radiografias
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'patients' ? 'active' : ''}`}
          onClick={() => setSelectedTab('patients')}
        >
          <FontAwesomeIcon icon={faUsers} /> Pacientes
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'reports' ? 'active' : ''}`}
          onClick={() => setSelectedTab('reports')}
        >
          <FontAwesomeIcon icon={faFileMedical} /> Relatórios
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <div className="overview-grid">
            <div className="dashboard-card-modern">
              <div className="card-header">
                <h3>
                  <FontAwesomeIcon icon={faClock} /> Atividades Recentes
                </h3>
              </div>
              <div className="card-body">
                <div className="activity-item">
                  <div className="activity-icon">
                    <FontAwesomeIcon icon={faXRay} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">Nova radiografia analisada</p>
                    <p className="activity-subtitle">João Silva • há 2 horas</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">Novo paciente cadastrado</p>
                    <p className="activity-subtitle">Maria Santos • há 5 horas</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FontAwesomeIcon icon={faFileMedical} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">Relatório gerado</p>
                    <p className="activity-subtitle">Pedro Costa • há 1 dia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card-modern">
              <div className="card-header">
                <h3>
                  <FontAwesomeIcon icon={faChartLine} /> Estatísticas
                </h3>
              </div>
              <div className="card-body">
                <div className="empty-state-modern">
                  <FontAwesomeIcon icon={faChartLine} size="3x" />
                  <p>Gráficos serão exibidos aqui</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'radiographs' && (
          <div className="dashboard-card-modern">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faXRay} /> Galeria de Radiografias
              </h3>
              <button className="btn-modern-primary">
                <FontAwesomeIcon icon={faImage} /> Upload Nova Imagem
              </button>
            </div>
            <div className="card-body">
              <div className="radiographs-grid">
                {recentRadiographs.map((item) => (
                  <div key={item.id} className="radiograph-card">
                    <div className="radiograph-image-placeholder">
                      <FontAwesomeIcon icon={faXRay} size="3x" />
                    </div>
                    <div className="radiograph-info">
                      <h4>{item.patient}</h4>
                      <p className="radiograph-type">{item.type}</p>
                      <div className="radiograph-meta">
                        <span className="radiograph-date">
                          <FontAwesomeIcon icon={faClock} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`radiograph-status ${item.status.toLowerCase()}`}>
                          {item.status === 'Analisado' ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faClock} />}
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'patients' && (
          <div className="dashboard-card-modern">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faUsers} /> Cadastro de Pacientes
              </h3>
              <button className="btn-modern-primary">
                <FontAwesomeIcon icon={faUser} /> Novo Paciente
              </button>
            </div>
            <div className="card-body">
              <div className="patients-grid">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="patient-card">
                    <div className="patient-avatar">
                      {patient.image ? (
                        <img src={patient.image} alt={patient.name} />
                      ) : (
                        <div className="patient-avatar-placeholder">
                          {patient.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="patient-info">
                      <h4>{patient.name}</h4>
                      <p className="patient-age">{patient.age} anos</p>
                      <p className="patient-last-visit">
                        Última visita: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button className="patient-view-btn">Ver Detalhes</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'reports' && (
          <div className="dashboard-card-modern">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faFileMedical} /> Relatórios de Análise
              </h3>
            </div>
            <div className="card-body">
              <div className="reports-list">
                {recentReports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-icon">
                      <FontAwesomeIcon icon={faFileMedical} />
                    </div>
                    <div className="report-content">
                      <h4>{report.patient}</h4>
                      <div className="report-details">
                        <span className="report-date">
                          <FontAwesomeIcon icon={faClock} /> {new Date(report.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="report-findings">
                          {report.findings} achados detectados
                        </span>
                      </div>
                    </div>
                    <div className="report-status">
                      <span className={`status-badge ${report.status.toLowerCase().replace(' ', '-')}`}>
                        {report.status}
                      </span>
                      <button className="report-view-btn">Ver Relatório</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
