import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Bookmark, User } from 'lucide-react';
import ModalTypuOferty from '../modals/ModalTypuOferty';

interface MobileBottomNavProps {
  isLoggedIn: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isLoggedIn }) => {
  const location = useLocation();
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleAddClick = () => {
    if (isLoggedIn) {
      setShowOfferTypeModal(true);
    }
  };

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Główna',
      show: true,
    },
    {
      path: '/search',
      icon: Search,
      label: 'Szukaj',
      show: true,
    },
    {
      path: '#add',
      icon: PlusCircle,
      label: 'Dodaj',
      show: true,
      onClick: handleAddClick,
      isSpecial: true, // Większy przycisk w środku
    },
    {
      path: '/konto/profil',
      icon: Bookmark,
      label: 'Zapisane',
      show: isLoggedIn,
      state: { activeTab: 'zapisane' },
    },
    {
      path: isLoggedIn ? '/konto/profil' : '/auth/login',
      icon: User,
      label: 'Profil',
      show: true,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - tylko mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, index) => {
            if (!item.show) return null;

            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.isSpecial) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center relative -mt-8"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mt-1">
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
                >
                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors ${
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={index}
                to={item.path}
                state={item.state}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
              >
                <Icon
                  className={`w-6 h-6 mb-1 transition-colors ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modal typu oferty */}
      {isLoggedIn && (
        <ModalTypuOferty
          isVisible={showOfferTypeModal}
          onClose={() => setShowOfferTypeModal(false)}
        />
      )}

      {/* Spacer dla bottom nav - tylko mobile */}
      <div className="h-16 lg:hidden" />
    </>
  );
};

export default MobileBottomNav;
