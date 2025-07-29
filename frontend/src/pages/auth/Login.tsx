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
    <div className="flex justify-center items-center min-h-screen py-12 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Logowanie</h2>
        
        <div className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-4 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-4 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-custom-blue text-white rounded-2xl hover:bg-custom-blue-dark disabled:bg-gray-300 font-semibold text-lg transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg backdrop-blur-sm"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </div>
        
        {info && (
          <div
            className={`text-center mt-6 p-4 rounded-2xl font-semibold backdrop-blur-sm ${
              info.includes('Zalogowano') 
                ? 'bg-green-100/80 text-green-700 border border-green-200/50' 
                : 'bg-red-100/80 text-red-700 border border-red-200/50'
            }`}
          >
            {info}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
