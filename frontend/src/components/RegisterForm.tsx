import { useState } from 'react'
import { register } from '../api'

export default function RegisterForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({ email, password, nazwaUzytkownika: name })
      setMsg('Zarejestrowano, możesz się zalogować')
    } catch {
      setMsg('Błąd rejestracji')
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>Rejestracja</h2>
      {msg && <p>{msg}</p>}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Nazwa" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button>Zarejestruj</button>
      <button type="button" onClick={onBack}>Wróć</button>
    </form>
  )
}
