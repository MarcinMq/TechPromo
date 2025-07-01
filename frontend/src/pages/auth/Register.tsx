import { useState } from 'react';

const Register = () => {
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo(null);

    try {
      const response = await fetch('http://localhost:5023/konto/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nick: nick,
          email: email,
          password: password
        }),
        credentials: 'include',
      });
      const text = await response.text();
      setInfo(text);
      if (response.ok) {
        setNick('');
        setEmail('');
        setPassword('');
      }
    } catch {
      setInfo('Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Rejestracja</h2>
      <input type="text" placeholder="Nick" value={nick} onChange={e => setNick(e.target.value)} required />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? 'Rejestrowanie...' : 'Zarejestruj'}</button>
      <div className="auth-info" style={{ color: info?.includes('Zarejestrowano') ? 'green' : 'crimson' }}>
        {info}
      </div>
    </form>
  );
};

export default Register;
