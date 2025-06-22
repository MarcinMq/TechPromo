import { useState } from 'react'
import { login } from '../api'

interface Props { onSuccess: (token: string, role: string) => void }

export default function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      onSuccess(data.token, data.role)
    } catch {
      setError('Błąd logowania')
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>Logowanie</h2>
      {error && <p className="error">{error}</p>}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button>Zaloguj</button>
    </form>
  )
}
