import { useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await api.post('/Auth/login', {
        email,
        haslo: password,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Błąd logowania');
      }
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4">Logowanie</h2>
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
        <button type="submit" className="btn btn-primary w-100">Zaloguj</button>
      </form>
    </div>
  );
}

export default Login;
