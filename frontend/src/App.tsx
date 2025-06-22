import { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || '')
  const [showRegister, setShowRegister] = useState(false)

  if (!token) {
    return showRegister ? (
      <RegisterForm onBack={() => setShowRegister(false)} />
    ) : (
      <div className="auth-container">
        <LoginForm onSuccess={(t, r) => { setToken(t); setRole(r) }} />
        <button onClick={() => setShowRegister(true)}>Rejestracja</button>
      </div>
    )
  }

  return (
    <div className="home">
      <h1>Witaj w TechPromo!</h1>
      {role === 'Admin' && <AdminPanel token={token} />}
    </div>
  )
}

export default App
