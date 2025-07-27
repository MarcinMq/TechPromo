import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PanelSelectorProps {
  userRole: string;
  isVisible: boolean;
  onSelect: () => void;
}

const PanelSelector: React.FC<PanelSelectorProps> = ({ userRole, isVisible, onSelect }) => {
  const navigate = useNavigate();

  const handlePanelClick = (path: string) => {
    navigate(path);
    onSelect(); // Zamknij selector po wyborze
  };

  if (!isVisible) return null;

  return (
    <div className="panel-selector">
      <div className="panel-selector-overlay" onClick={onSelect} />
      <div className="panel-selector-content">
        <h3>📊 Wybierz Panel</h3>
        
        {/* Panel Użytkownika - zawsze dostępny dla zalogowanych */}
        <button 
          className="panel-option user-panel-option"
          onClick={() => handlePanelClick('/user/panel')}
        >
          <span className="panel-icon">👤</span>
          <div className="panel-info">
            <span className="panel-name">Panel Użytkownika</span>
            <span className="panel-desc">Zarządzaj swoimi ofertami i profilem</span>
          </div>
        </button>

        {/* Panel Moderatora - dla moderatorów i adminów */}
        {(userRole === 'Moderator' || userRole === 'Admin') && (
          <button 
            className="panel-option moderator-panel-option"
            onClick={() => handlePanelClick('/moderator')}
          >
            <span className="panel-icon">⚖️</span>
            <div className="panel-info">
              <span className="panel-name">Panel Moderatora</span>
              <span className="panel-desc">Moderuj komentarze, oferty i zgłoszenia</span>
            </div>
          </button>
        )}

        {/* Panel Administratora - tylko dla adminów */}
        {userRole === 'Admin' && (
          <button 
            className="panel-option admin-panel-option"
            onClick={() => handlePanelClick('/admin')}
          >
            <span className="panel-icon">👑</span>
            <div className="panel-info">
              <span className="panel-name">Panel Administratora</span>
              <span className="panel-desc">Pełne zarządzanie systemem</span>
            </div>
          </button>
        )}

        <button className="close-selector" onClick={onSelect}>
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
};

export default PanelSelector;
