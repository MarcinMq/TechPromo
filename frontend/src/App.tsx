import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PasekNawigacji from './components/layout/PasekNawigacji';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Stopka from './components/layout/Stopka';
import StronaGlowna from './pages/StronaGlowna';
import StronaWyszukiwania from './pages/StronaWyszukiwania';
import Logowanie from './pages/auth/Logowanie';
import Rejestracja from './pages/auth/Rejestracja';
import ZapomnialemHaslaStrona from './pages/ZapomnialemHaslaStrona';
import ResetowanieHaslaStrona from './pages/ResetowanieHaslaStrona';
import Profil from './pages/profile/Profil';
import StronaPublicznegoProfileu from './pages/user/StronaPublicznegoProfileu';
// Panele przeniesione do profilu – pełne strony wyłączone
// Usunięto UserPanel – funkcje przeniesione do Profil
import FormularzTworzeniaOkazji from './pages/offers/FormularzTworzeniaOkazji';
import FormularzTworzeniaKuponu from './pages/offers/FormularzTworzeniaKuponu';
import StronaSzczegolyOferty from './pages/offers/StronaSzczegolyOferty';
import ChronionyRoute from './components/ChronionyRoute';
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
      <PasekNawigacji
        isLoggedIn={isLogged}
        userName={nick}
        userRole={userRole}
        onLogout={handleLogout}
      />

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<StronaGlowna />} />
      <Route path="/okazja/:id" element={<StronaSzczegolyOferty />} />
          <Route path="/search" element={<StronaWyszukiwania />} />
          {/* Specyficzne trasy przed dynamicznymi parametrami */}
          <Route path="/uzytkownik/panel" element={<Profil />} />
          <Route path="/uzytkownik/:nick" element={<StronaPublicznegoProfileu />} />
          <Route path="/auth/login" element={<Logowanie />} />
          <Route path="/auth/register" element={<Rejestracja />} />
          <Route path="/zapomniane-haslo" element={<ZapomnialemHaslaStrona />} />
          <Route path="/resetuj-haslo" element={<ResetowanieHaslaStrona />} />
          <Route path="/stworz-oferte/okazja" element={
            <ChronionyRoute>
              <FormularzTworzeniaOkazji />
            </ChronionyRoute>
          } />
          <Route path="/stworz-oferte/kupon" element={
            <ChronionyRoute>
              <FormularzTworzeniaKuponu />
            </ChronionyRoute>
          } />
          <Route path="/konto/profil" element={
            <ChronionyRoute>
              <Profil />
            </ChronionyRoute>
          } />
          {/* Old standalone panels removed; redirect to profile */}
          <Route path="/admin" element={<Navigate to="/konto/profil" replace />} />
          <Route path="/moderator" element={<Navigate to="/konto/profil" replace />} />
        </Routes>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav isLoggedIn={isLogged} />
      
      {/* Stopka */}
      <Stopka />
    </div>
  );
}

export default App;
