import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveUserSession } from '../../utils/auth';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 px-4 py-8">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_60%)]" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_70%,white,transparent_60%)]" />
      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center z-10">
        {/* Left / Promo */}
        <div className="hidden md:flex flex-col text-white space-y-6 px-2">
          <h1 className="text-4xl font-extrabold leading-tight drop-shadow-md">Witaj ponownie<span className="block text-indigo-200 font-light text-2xl mt-3">Zaloguj się i odkrywaj najlepsze promocje</span></h1>
          <ul className="space-y-3 text-indigo-100/90 text-sm">
            <li className="flex items-start"><span className="mt-1 mr-2 w-2 h-2 rounded-full bg-white" />Głosuj na gorące oferty i zdobywaj punkty</li>
            <li className="flex items-start"><span className="mt-1 mr-2 w-2 h-2 rounded-full bg-white" />Dodawaj własne okazje oraz kupony</li>
            <li className="flex items-start"><span className="mt-1 mr-2 w-2 h-2 rounded-full bg-white" />Zbieraj odznaki i awansuj w rankingu</li>
          </ul>
          <div className="mt-4 text-sm text-indigo-200/90">Nie masz konta?{' '}<Link to="/auth/register" className="font-semibold underline decoration-white/30 hover:decoration-white">Zarejestruj się</Link></div>
        </div>
        {/* Right / Form */}
        <div className="w-full">
          <form onSubmit={handleLogin} className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 md:p-10 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <h2 className="text-3xl font-bold mb-8 text-gray-900 flex items-center gap-3"><LogIn className="w-8 h-8 text-indigo-600" /> Logowanie</h2>
            <div className="space-y-6">
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  placeholder="Adres email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full pl-12 pr-4 py-4 rounded-2xl bg-white/90 border border-gray-300/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm focus:shadow-lg"
                />
              </div>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Hasło"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full pl-12 pr-12 py-4 rounded-2xl bg-white/90 border border-gray-300/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm focus:shadow-lg"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-gray-600">Zapamiętaj mnie</span>
                </label>
                <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium">Zapomniałeś hasła?</button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-2xl bg-indigo-600 text-white font-semibold py-4 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />} {loading ? 'Logowanie...' : 'Zaloguj się'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="text-sm text-center text-gray-600">Nie masz konta? <Link to="/auth/register" className="text-indigo-600 font-semibold hover:underline">Zarejestruj się</Link></div>
            </div>
            {info && (
              <div className={`mt-6 p-4 rounded-2xl text-sm font-medium ${info.includes('Zalogowano') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{info}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
