import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Search, Edit3, Settings, User, LogOut } from 'lucide-react';
import PanelSelector from '../ui/PanelSelector';
import OfferTypeModal from '../modals/OfferTypeModal';
import SearchBar from '../search/SearchBar';
import UserInfo from './UserInfo';

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
        <div className="w-full max-w-none px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 text-2xl font-extrabold text-gray-900 flex-shrink-0">
              <Rocket className="w-8 h-8 text-custom-blue" />
              <span className="font-bold">TechPromo</span>
            </Link>

            {/* Wyszukiwarka - centrum */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} />
            </div>

            {/* Akcje - prawa strona */}
            <div className="flex items-center space-x-6 flex-shrink-0">
              {isLoggedIn ? (
                <>
                  {/* Przycisk publikuj */}
                  <button 
                    className="flex items-center space-x-2 px-6 py-3 bg-custom-blue text-white rounded-xl hover:bg-custom-blue-dark transition-all duration-300 font-semibold shadow-lg hover:shadow-xl" 
                    onClick={handlePublish}
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Publikuj</span>
                  </button>

                  {/* Menu użytkownika */}
                  <div className="flex items-center space-x-4">
                    {/* Panel */}
                    <button 
                      onClick={handlePanelClick} 
                      className="p-3 rounded-xl hover:bg-gray-200 transition-all duration-300 hover:shadow-lg"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Profil */}
                    <Link 
                      to="/konto/profil" 
                      className="flex items-center space-x-2 text-gray-700 hover:text-custom-blue transition-all duration-300 font-semibold px-3 py-2 rounded-xl hover:bg-gray-100"
                    >
                      <User className="w-5 h-5" />
                      <span>{userName || 'Profil'}</span>
                    </Link>

                    {/* Wyloguj */}
                    <button 
                      onClick={onLogout} 
                      className="p-3 rounded-xl hover:bg-red-100 transition-all duration-300 hover:shadow-lg"
                    >
                      <LogOut className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </>
              ) : (
                /* Przyciski logowania */
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/auth/login" 
                    className="text-gray-600 hover:text-custom-blue font-semibold transition-all duration-300 px-4 py-2 rounded-xl hover:bg-gray-100"
                  >
                    Zaloguj się
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="bg-custom-blue text-white px-6 py-3 rounded-xl hover:bg-custom-blue-dark font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Zarejestruj się
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
