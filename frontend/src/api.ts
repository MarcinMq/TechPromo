const API_URL = 'https://localhost:5001/api';

// Funkcja logowania - zwraca JWT oraz rolę

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Błąd logowania');
  return res.json();
}

export async function register(data: { email: string; password: string; nazwaUzytkownika: string }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Błąd rejestracji');
}

// Pobranie listy użytkowników (tylko dla admina)
export async function getUsers(token: string) {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Błąd pobierania');
  return res.json();
}

// Zmiana roli wybranego użytkownika
export async function changeRole(id: number, role: string, token: string) {
  const res = await fetch(`${API_URL}/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rola: role })
  });
  if (!res.ok) throw new Error('Błąd zmiany roli');
}
