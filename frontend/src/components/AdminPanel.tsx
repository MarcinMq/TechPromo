import { useEffect, useState } from 'react'
import { getUsers, changeRole } from '../api'

interface User {
  id: number
  email: string
  nazwaUzytkownika: string
  rola: string
}

export default function AdminPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([])

  const load = async () => {
    const data = await getUsers(token)
    setUsers(data)
  }

  useEffect(() => { load() }, [])

  const updateRole = async (id: number, role: string) => {
    await changeRole(id, role, token)
    await load()
  }

  return (
    <div>
      <h2>Użytkownicy</h2>
      <table>
        <thead>
          <tr><th>Email</th><th>Nazwa</th><th>Rola</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.nazwaUzytkownika}</td>
              <td>
                <select value={u.rola} onChange={e => updateRole(u.id, e.target.value)}>
                  <option value="Uzytkownik">Uzytkownik</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
