import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PanelSelector from './PanelSelector';
import OfferTypeModal from './OfferTypeModal';
import SearchBar from './search/SearchBar';

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
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">TechPromo</span>
          </Link>

          {/* Search Bar */}
          <div className="navbar-search">
            <SearchBar onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} />
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                {/* Publish Button */}
                <button className="publish-btn" onClick={handlePublish}>
                  <span>📝</span>
                  <span className="publish-text">Publikuj</span>
                </button>

                {/* User Menu */}
                <div className="user-menu">
                  {/* Panel Button */}
                  <button className="user-panel btn-outline" onClick={handlePanelClick}>
                    <span>⚙️</span>
                    <span className="panel-text">Panel</span>
                  </button>

                  {/* Profile Link */}
                  <Link to="/konto/profil" className="user-profile-link">
                    <span>👤</span>
                    <span className="user-name">{userName || 'Profil'}</span>
                  </Link>

                  {/* Logout Button */}
                  <button className="btn-danger" onClick={onLogout}>
                    <span>🚪</span>
                    <span className="logout-text">Wyloguj</span>
                  </button>
                </div>
              </>
            ) : (
              /* Auth Buttons */
              <div className="auth-buttons">
                <Link to="/auth/login" className="login-link">
                  Zaloguj się
                </Link>
                <Link to="/auth/register" className="btn btn-primary">
                  Zarejestruj się
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Panel Selector Modal */}
      {isLoggedIn && (
        <PanelSelector
          userRole={userRole || 'User'}
          isVisible={showPanelSelector}
          onSelect={handlePanelSelect}
        />
      )}

      {/* Offer Type Modal */}
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
