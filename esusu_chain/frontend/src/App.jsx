import { useState } from 'react'
import './config/flow' // Initialize Flow configuration
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import CreateCircle from './pages/CreateCircle'
import CircleDetails from './pages/CircleDetails'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [selectedCircle, setSelectedCircle] = useState(null)

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onSelectCircle={setSelectedCircle} />
      case 'create':
        return <CreateCircle onNavigate={setCurrentPage} />
      case 'details':
        return <CircleDetails circle={selectedCircle} onNavigate={setCurrentPage} />
      default:
        return <LandingPage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {renderPage()}
    </div>
  )
}

export default App
