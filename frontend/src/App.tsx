import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profil from './pages/konto/Profil';
import AdminPanel from './pages/admin/AdminPanel';
import ModeratorPanel from './pages/moderator/ModeratorPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, getUserData, logout } from './utils/auth';
import './App.css'; 

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [nick, setNick] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  // Sprawdzam autoryzację za pomocą JWT tokenów zamiast pytać backend co chwilę
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUserData();
        if (userData) {
          // Token ważny - użytkownik zalogowany
          setIsLogged(true);
          setNick(userData.nick);
          setUserRole(userData.role);
        } else {
          // Błąd pobierania danych - wyloguj
          setIsLogged(false);
          setNick('');
          setUserRole('');
        }
      } else {
        // Token nieważny/wygasł - użytkownik niezalogowany
        setIsLogged(false);
        setNick('');
        setUserRole('');
      }
    };

    // Sprawdzam od razu przy starcie aplikacji
    checkAuth();
    
    // Sprawdzam co 30 sekund czy token nie wygasł
    const interval = setInterval(checkAuth, 30000);
    
    // Nasłuchuję zmian w localStorage - kiedy ktoś się loguje/wylogowuje
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userNick' || e.key === 'userRole') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Nasłuchuję mojego custom eventu - gdy logowanie/wylogowanie w tej samej karcie
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    // Sprzątam po sobie
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsLogged(false);
    setNick('');
    setUserRole('');
    navigate('/');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-title">TechPromo</div>
        <div className="navbar-actions">
          {!isLogged && (
            <>
              <Link to="/auth/login" className="nav-link">Zaloguj</Link>
              <Link to="/auth/register" className="nav-link">Zarejestruj</Link>
            </>
          )}
          {isLogged && (
            <>
              <Link to="/konto/profil" className="nav-link">Profil ({nick})</Link>
              {userRole === 'Admin' && (
                <Link to="/admin" className="nav-link">🛠️ Panel Admin</Link>
              )}
              {(userRole === 'Moderator' || userRole === 'Admin') && (
                <Link to="/moderator" className="nav-link">🛡️ Panel Moderatora</Link>
              )}
              <button className="nav-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={handleLogout}>Wyloguj</button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<div className="main-page">Tu będzie strona główna TechPromo</div>} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/konto/profil" element={
          <ProtectedRoute>
            <Profil />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="Admin">
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/moderator" element={
          <ProtectedRoute requiredRole="Moderator,Admin">
            <ModeratorPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
