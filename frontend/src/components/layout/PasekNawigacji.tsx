import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Settings, LogOut, Zap, Sparkles, Moon, Sun, ChevronDown } from 'lucide-react';
import WybieraczPanelu from '../ui/WybieraczPanelu';
import ModalTypuOferty from '../modals/ModalTypuOferty';
import PasekWyszukiwania from '../search/PasekWyszukiwania';
import { getAuthToken, isAuthenticated } from '../../utils/auth';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
  isLoggedIn: boolean;
  userRole?: string;
  userName?: string;
  onLogout: () => void;
}

// Ikony dla kategorii - mapowanie nazwy kategorii na ikonę
const categoryIcons: Record<string, string> = {
  'Telefony i akcesoria': '📱',
  'Komputery i laptopy': '💻',
  'Tablety': '📱',
  'Smartwatche i opaski': '⌚',
  'Słuchawki i audio': '🎧',
  'Telewizory': '📺',
  'Konsole i gaming': '🎮',
  'Akcesoria komputerowe': '⌨️',
  'Drukarki i skanery': '🖨️',
  'Dyski i pamięć': '💾',
  'Monitory': '🖥️',
  'Kamery i fotografia': '📷',
  'Drony': '🚁',
  'Powerbanki i ładowarki': '🔋',
  'Kabele i adaptery': '🔌',
  'Inteligentny dom': '🏠',
  'Sieć i routery': '📡',
  'Projektory': '📽️',
  'E-booki i czytniki': '📚',
  'Gry i oprogramowanie': '💿',
  'AGD małe': '☕',
  'AGD duże': '🧊',
  'Inne': '📦',
};

// Główne kategorie do wyświetlenia bezpośrednio w navbar
const mainCategories = [
  'Telefony i akcesoria',
  'Komputery i laptopy',
  'Słuchawki i audio',
  'Telewizory',
  'Konsole i gaming',
  'Kamery i fotografia',
];

const PasekNawigacji: React.FC<NavbarProps> = ({ isLoggedIn, userRole, userName, onLogout }) => {
  const [showPanelSelector, setShowPanelSelector] = useState(false);
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handlePanelClick = () => {
    setShowPanelSelector(true);
  };

  const handlePanelSelect = () => {
    setShowPanelSelector(false);
  };

  const handlePublish = () => {
    setShowOfferTypeModal(true);
  };

  const handleCloseOfferTypeModal = () => {
    setShowOfferTypeModal(false);
  };

  // Load categories from API
  useEffect(() => {
    fetch('/api/oferta/kategorie')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  // Fetch avatar for menubar when logged in
  useEffect(() => {
    let abort = false;
    const loadAvatar = async () => {
      try {
        if (!isLoggedIn || !isAuthenticated()) { setAvatarUrl(null); return; }
        const token = getAuthToken();
        const res = await fetch('http://localhost:5023/konto/profil', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        if (!abort) setAvatarUrl(json.avatarUrl || null);
      } catch { /* ignore */ }
    };
    loadAvatar();
    // Refresh after profile changes (avatar upload etc.)
    const handler = () => loadAvatar();
    window.addEventListener('profileChanged', handler as EventListener);
    return () => { abort = true; window.removeEventListener('profileChanged', handler as EventListener); };
  }, [isLoggedIn]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold flex-shrink-0">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white hidden sm:inline">
                TechPromo
              </span>
              <span className="text-gray-900 dark:text-white sm:hidden">
                TP
              </span>
            </Link>

            {/* Wyszukiwarka - centrum */}
            <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
              <PasekWyszukiwania 
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} 
                compact={true}
                className="block sm:hidden"
              />
              <PasekWyszukiwania 
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
                className="hidden sm:block"
              />
            </div>

            {/* Akcje - prawa strona */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              {isLoggedIn ? (
                <>
                  {/* Przycisk publikuj */}
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm" 
                    onClick={handlePublish}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Publikuj</span>
                  </button>

                  {/* Menu użytkownika */}
                  <div className="flex items-center space-x-2">
                    {/* Panel - tylko Moderator/Admin */}
                    {(userRole === 'Moderator' || userRole === 'Admin') && (
                      <button 
                        onClick={handlePanelClick} 
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    )}

                    {/* Profil */}
                    <Link 
                      to="/konto/profil" 
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="relative inline-block w-8 h-8">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                        ) : (
                          <img src="/default-avatar.svg" alt="default avatar" className="w-full h-full rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                        )}
                      </span>
                      <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">{userName || 'Profil'}</span>
                    </Link>

                    {/* Wyloguj */}
                    <button 
                      onClick={onLogout} 
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                </>
              ) : (
                /* Przyciski logowania */
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/auth/login" 
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="hidden sm:inline">Zaloguj się</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4 hidden sm:inline" />
                      <span className="hidden sm:inline">Zarejestruj się</span>
                      <span className="sm:hidden">Rejestr.</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Kategorie - drugi rząd */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-center space-x-1 px-2">
              {/* Tekst "Kategorie" */}
              <div className="flex items-center px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                <span className="hidden sm:inline">Kategorie</span>
                <span className="sm:hidden">Kat.</span>
              </div>

              {/* Główne kategorie */}
              {categories
                .filter(cat => mainCategories.includes(cat))
                .map((category) => (
                  <Link
                    key={category}
                    to={`/?kategoria=${encodeURIComponent(category)}`}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    <span>{categoryIcons[category] || '📦'}</span>
                    <span className="hidden sm:inline">{category}</span>
                  </Link>
                ))}

              {/* Rozwijana lista "Więcej" - menu z boku */}
              {categories.filter(cat => !mainCategories.includes(cat)).length > 0 && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMoreCategories(!showMoreCategories);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    <span>📋</span>
                    <span className="hidden sm:inline">Więcej</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMoreCategories ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Backdrop do zamknięcia menu */}
                  {showMoreCategories && (
                    <div 
                      className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMoreCategories(false);
                      }}
                    />
                  )}
                      
                  {/* Menu wysuwane z prawej strony */}
                  <div 
                    className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                      showMoreCategories ? 'translate-x-0' : 'translate-x-full'
                    }`}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Więcej kategorii</h3>
                    </div>
                    <div className="py-2">
                      {categories
                        .filter(cat => !mainCategories.includes(cat))
                        .map((category) => (
                          <Link
                            key={category}
                            to={`/?kategoria=${encodeURIComponent(category)}`}
                            className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMoreCategories(false);
                            }}
                          >
                            <span className="text-2xl">{categoryIcons[category] || '📦'}</span>
                            <span className="font-medium">{category}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal panelu - tylko Moderator/Admin */}
      {isLoggedIn && (userRole === 'Moderator' || userRole === 'Admin') && (
        <WybieraczPanelu
          userRole={userRole || 'User'}
          isVisible={showPanelSelector}
          onSelect={handlePanelSelect}
        />
      )}

      {/* Modal typu oferty */}
      {isLoggedIn && (
        <ModalTypuOferty
          isVisible={showOfferTypeModal}
          onClose={handleCloseOfferTypeModal}
        />
      )}
    </>
  );
};

export default PasekNawigacji;
