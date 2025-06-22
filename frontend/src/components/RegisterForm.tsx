import { useState } from 'react'

interface Props {
  onSuccess: () => void
}

export default function RegisterForm({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      onSuccess()
    } else {
      const msg = await res.text()
      setError(msg || 'Błąd rejestracji')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Rejestracja</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Zarejestruj</button>
    </form>
  )
}
