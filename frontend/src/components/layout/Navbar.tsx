import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Edit3, Settings, User, LogOut } from 'lucide-react';
import PanelSelector from '../ui/PanelSelector';
import OfferTypeModal from '../modals/OfferTypeModal';
import SearchBar from '../search/SearchBar';

interface NavbarProps {
  isLoggedIn: boolean;
  userRole?: string;
  userName?: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, userRole, userName, onLogout }) => {
  const [showPanelSelector, setShowPanelSelector] = useState(false);
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);
  const navigate = useNavigate();

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

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 text-xl sm:text-2xl font-extrabold text-gray-900 flex-shrink-0">
              <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-custom-blue" />
              <span className="font-bold hidden sm:inline">TechPromo</span>
              <span className="font-bold sm:hidden">TP</span>
            </Link>

            {/* Wyszukiwarka - centrum */}
            <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
              <SearchBar 
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} 
                compact={true}
                className="block sm:hidden"
              />
              <SearchBar 
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
                className="hidden sm:block"
              />
            </div>

            {/* Akcje - prawa strona */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              {isLoggedIn ? (
                <>
                  {/* Przycisk publikuj - zawsze widoczny dla zalogowanych */}
                  <button 
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-custom-blue text-white rounded-xl hover:bg-custom-blue-dark transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base" 
                    onClick={handlePublish}
                  >
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline lg:hidden">+</span>
                    <span className="hidden lg:inline">Publikuj</span>
                  </button>

                  {/* Menu użytkownika */}
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {/* Panel */}
                    <button 
                      onClick={handlePanelClick} 
                      className="p-2 sm:p-3 rounded-xl hover:bg-gray-200 transition-all duration-300 hover:shadow-lg"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Profil */}
                    <Link 
                      to="/konto/profil" 
                      className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-custom-blue transition-all duration-300 font-semibold px-1 sm:px-2 lg:px-3 py-2 rounded-xl hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline text-sm sm:text-base">{userName || 'Profil'}</span>
                    </Link>

                    {/* Wyloguj */}
                    <button 
                      onClick={onLogout} 
                      className="p-2 sm:p-3 rounded-xl hover:bg-red-100 transition-all duration-300 hover:shadow-lg"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </button>
                  </div>
                </>
              ) : (
                /* Przyciski logowania */
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                  <Link 
                    to="/auth/login" 
                    className="text-gray-600 hover:text-custom-blue font-semibold transition-all duration-300 px-2 sm:px-4 py-2 rounded-xl hover:bg-gray-100 text-xs sm:text-sm lg:text-base"
                  >
                    <span className="hidden sm:inline">Zaloguj się</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="bg-custom-blue text-white px-2 sm:px-3 lg:px-6 py-2 sm:py-3 rounded-xl hover:bg-custom-blue-dark font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base"
                  >
                    <span className="hidden sm:inline">Zarejestruj się</span>
                    <span className="sm:hidden">Rejestr.</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal panelu */}
      {isLoggedIn && (
        <PanelSelector
          userRole={userRole || 'User'}
          isVisible={showPanelSelector}
          onSelect={handlePanelSelect}
        />
      )}

      {/* Modal typu oferty */}
      {isLoggedIn && (
        <OfferTypeModal
          isVisible={showOfferTypeModal}
          onClose={handleCloseOfferTypeModal}
        />
      )}
    </>
  );
};

export default Navbar;
