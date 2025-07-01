import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profil from './pages/konto/Profil';
import AdminPanel from './pages/admin/AdminPanel';
import './App.css'; 

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [nick, setNick] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  // Sprawdzamy, czy użytkownik jest zalogowany za każdym razem gdy zmieni się trasa
  useEffect(() => {
    const check = async () => {
      const res = await fetch('http://localhost:5023/konto/profil', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIsLogged(true);
        setNick(data.nick);
        setUserRole(data.rola);
      } else {
        setIsLogged(false);
        setNick('');
        setUserRole('');
      }
    };
    check();
  }, [window.location.pathname]);

  const handleLogout = async () => {
    await fetch('http://localhost:5023/konto/logout', {
      method: 'POST',
      credentials: 'include',
    });
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
              <Link to="/login" className="nav-link">Zaloguj</Link>
              <Link to="/register" className="nav-link">Zarejestruj</Link>
            </>
          )}
          {isLogged && (
            <>
              <Link to="/konto/profil" className="nav-link">Profil ({nick})</Link>
              {userRole === 'Admin' && (
                <Link to="/admin" className="nav-link">🛠️ Panel Admin</Link>
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/konto/profil" element={<Profil />} />
        <Route path="/admin" element={
          userRole === 'Admin' ? <AdminPanel /> : <div>Brak uprawnień administratora</div>
        } />
      </Routes>
    </div>
  );
}

export default App;
