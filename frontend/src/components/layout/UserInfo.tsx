import { useEffect, useState } from 'react';
import { getUserData, isAuthenticated, logout } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const UserInfo = () => {
  const [userData, setUserData] = useState(getUserData());
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated());
      setUserData(getUserData());
    };

    // Sprawdź autoryzację przy załadowaniu
    checkAuth();

    // Sprawdzaj autoryzację co 30 sekund
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/');
  };

  if (!isLoggedIn || !userData) {
    return (
      <div className="user-info">
        <button onClick={() => navigate('/auth/login')}>Zaloguj się</button>
        <button onClick={() => navigate('/auth/register')}>Zarejestruj się</button>
      </div>
    );
  }

  return (
    <div className="user-info">
      <span>Witaj, <strong>{userData.nick}</strong>!</span>
      <span>Punkty: <strong>{userData.points}</strong></span>
              <button 
          onClick={() => navigate('/profile')}
          className="px-3 py-2 bg-blue-500/30 text-white font-semibold rounded-lg hover:bg-blue-500/50 transition-all duration-300 text-sm backdrop-blur-sm border border-blue-500/30"
        >
          Profil
        </button>
      {userData.role === 'Admin' && (
  <button onClick={() => navigate('/konto/profil')}>Panel</button>
      )}
      <button onClick={handleLogout}>Wyloguj</button>
    </div>
  );
};

export default UserInfo;
