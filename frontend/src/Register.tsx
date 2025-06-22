import { useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Hasła nie są zgodne');
      return;
    }
    try {
      const response = await api.post('/Auth/register', {
        email,
        nazwaUzytkownika: username,
        haslo: password,
        potwierdzHaslo: confirmPassword,
      });
      if (response.data.status === 'Success') {
        navigate('/login');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Błąd rejestracji');
      }
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4">Rejestracja</h2>
      {message && <div className="alert alert-danger">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Nazwa użytkownika</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Hasło</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Potwierdź hasło</label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Zarejestruj</button>
      </form>
    </div>
  );
}

export default Register;
