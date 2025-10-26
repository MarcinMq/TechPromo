import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Scale, Crown, BarChart } from 'lucide-react';

interface PanelSelectorProps {
  userRole: string;
  isVisible: boolean;
  onSelect: () => void;
}

const WybieraczPanelu: React.FC<PanelSelectorProps> = ({ userRole, isVisible, onSelect }) => {
  const navigate = useNavigate();

  const handlePanelClick = (path: string) => {
    navigate(path);
    onSelect(); // Zamknij selector po wyborze
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSelect} />
      <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6 transform transition-all">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 flex items-center justify-center">
          <BarChart className="w-6 h-6 mr-2 text-custom-blue" />
          Wybierz Panel
        </h3>
        
        <div className="space-y-4">
          {/* Panel Użytkownika - zawsze dostępny dla zalogowanych */}
          <button 
            className="w-full flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all transform hover:scale-[1.02] border border-blue-200"
            onClick={() => handlePanelClick('/konto/profil')}
          >
            <User className="w-8 h-8 mr-4 text-blue-600" />
            <div className="text-left">
              <span className="block font-bold text-gray-900">Panel Użytkownika</span>
              <span className="block text-sm text-gray-600">Zarządzaj swoimi ofertami i profilem</span>
            </div>
          </button>

          {/* Panel Moderatora - dla moderatorów i adminów */}
      {(userRole === 'Moderator' || userRole === 'Admin') && (
            <button 
        className="w-full flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-xl transition-all transform hover:scale-[1.02] border border-yellow-200"
        onClick={() => handlePanelClick('/konto/profil')}
            >
              <Scale className="w-8 h-8 mr-4 text-yellow-600" />
              <div className="text-left">
                <span className="block font-bold text-gray-900">Panel Moderatora</span>
                <span className="block text-sm text-gray-600">Moderuj komentarze, oferty i zgłoszenia</span>
              </div>
            </button>
          )}

          {/* Panel Administratora - tylko dla adminów */}
      {userRole === 'Admin' && (
            <button 
        className="w-full flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all transform hover:scale-[1.02] border border-red-200"
        onClick={() => handlePanelClick('/konto/profil')}
            >
              <Crown className="w-8 h-8 mr-4 text-red-600" />
              <div className="text-left">
                <span className="block font-bold text-gray-900">Panel Administratora</span>
                <span className="block text-sm text-gray-600">Pełne zarządzanie systemem</span>
              </div>
            </button>
          )}
        </div>

        <button 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          onClick={onSelect}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default WybieraczPanelu;
