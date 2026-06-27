import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LandingPage from './components/LandingPage'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function LandingPageWrapper() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const showDashboard = isAuthenticated || DEMO_MODE

  function handleLogin(accessCode: string) {
    console.log('Logging in with access code:', accessCode)
    alert(`Connected to workspace console using: ${accessCode}`)
  }

  function handleDashboard() {
    navigate('/apps/adrian-tucicovenco/main')
  }

  return (
    <LandingPage
      onLogin={handleLogin}
      onViewHowItWorks={() => navigate('/docs')}
      onViewUsageExamples={() => console.log('View Usage Examples')}
      isAuthenticated={showDashboard}
      onDashboard={handleDashboard}
    />
  )
}
