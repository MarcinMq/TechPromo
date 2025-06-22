import { useState } from 'react'
import './App.css'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="auth-container">
      {mode === 'login' ? (
        <>
          <LoginForm onSuccess={() => alert('Zalogowano')} />
          <p>
            Nie masz konta?{' '}
            <button onClick={() => setMode('register')}>Zarejestruj się</button>
          </p>
        </>
      ) : (
        <>
          <RegisterForm onSuccess={() => setMode('login')} />
          <p>
            Masz konto?{' '}
            <button onClick={() => setMode('login')}>Zaloguj się</button>
          </p>
        </>
      )}
    </div>
  )
}

export default App
