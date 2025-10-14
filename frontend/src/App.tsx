import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profil from './pages/profile/Profil';
import PublicProfilePage from './pages/user/PublicProfilePage';
// Panele przeniesione do profilu – pełne strony wyłączone
// Usunięto UserPanel – funkcje przeniesione do Profil
import CreateDealForm from './pages/offers/CreateDealForm';
import CreateCouponForm from './pages/offers/CreateCouponForm';
import OfferDetailsPage from './pages/offers/OfferDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, getUserData, logout } from './utils/auth';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors">
      <Navbar
        isLoggedIn={isLogged}
        userName={nick}
        userRole={userRole}
        onLogout={handleLogout}
      />

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
      <Route path="/okazja/:id" element={<OfferDetailsPage />} />
          <Route path="/search" element={<SearchPage />} />
          {/* Specyficzne trasy przed dynamicznymi parametrami */}
          <Route path="/uzytkownik/panel" element={<Profil />} />
          <Route path="/uzytkownik/:nick" element={<PublicProfilePage />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/stworz-oferte/okazja" element={
            <ProtectedRoute>
              <CreateDealForm />
            </ProtectedRoute>
          } />
          <Route path="/stworz-oferte/kupon" element={
            <ProtectedRoute>
              <CreateCouponForm />
            </ProtectedRoute>
          } />
          <Route path="/konto/profil" element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          } />
          {/* Old standalone panels removed; redirect to profile */}
          <Route path="/admin" element={<Navigate to="/konto/profil" replace />} />
          <Route path="/moderator" element={<Navigate to="/konto/profil" replace />} />
        </Routes>
      </main>
      
      {/* Stopka */}
      <Footer />
    </div>
  );
}

export default App;
