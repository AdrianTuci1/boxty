import LandingPage from './components/LandingPage';

export default function App() {
  function handleLogin(accessCode) {
    console.log('Logging in with access code:', accessCode);
    // Standard mock verification feedback
    alert(`Connected to workspace console using: ${accessCode}`);
  }

  return (
    <LandingPage
      onLogin={handleLogin}
      onViewHowItWorks={() => console.log('View How It Works')}
      onViewUsageExamples={() => console.log('View Usage Examples')}
    />
  );
}
