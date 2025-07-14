import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUserSession } from '../../utils/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo(null);

    try {
      const response = await fetch('http://localhost:5023/konto/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Zapisz sesję używając funkcji helper
        saveUserSession(data);
        
        setInfo(`Zalogowano pomyślnie! Witaj ${data.nick}!`);
        
        setTimeout(() => {
          setEmail('');
          setPassword('');
          setInfo(null);
          navigate('/');
        }, 800);
      } else {
        const errorText = await response.text();
        setInfo(errorText || 'Błąd logowania');
      }
    } catch (error) {
      console.error('Login error:', error);
      setInfo('Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2>Logowanie</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj'}</button>
      <div className="auth-info" style={{ color: info?.includes('Zalogowano') ? 'green' : 'crimson' }}>
        {info}
      </div>
    </form>
  );
};

export default Login;
