import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Heart, Mail } from 'lucide-react';

const Stopka: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
      {/* Główna sekcja stopki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo i opis */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">TechPromo</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed transition-colors">
              Najlepsze okazje i promocje technologiczne w jednym miejscu. 
              Odkrywaj, dziel się i oszczędzaj na swoich ulubionych gadżetach!
            </p>
          </div>

          {/* Kategorie */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">Popularne kategorie</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-600 dark:text-gray-400 transition-colors">📱 Smartwatche</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 transition-colors">📱 Tablety</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 transition-colors">🖥️ Komputery PC</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 transition-colors">🎧 Audio</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 transition-colors">🎮 Gaming</span></li>
            </ul>
          </div>

          {/* Szybkie linki */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">Szybkie linki</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/stworz-oferte/okazja" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dodaj okazję</Link></li>
              <li><Link to="/stworz-oferte/kupon" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dodaj kupon</Link></li>
              <li><Link to="/konto/profil" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Panel użytkownika</Link></li>
              <li><Link to="/search" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Wyszukiwarka</Link></li>
            </ul>
          </div>

          {/* Pomoc i kontakt */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">Informacje</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-600 dark:text-gray-400 flex items-center transition-colors">
                  <Mail className="w-4 h-4 mr-2" />
                  kontakt@techpromo.pl
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Dolna sekcja */}
      <div className="border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              © {currentYear} TechPromo. Wszelkie prawa zastrzeżone.
            </div>

            {/* Serce i tekst */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 transition-colors">
              <span>Stworzone z</span>
              <Heart className="w-4 h-4 mx-2 text-red-500 dark:text-red-400 transition-colors" />
              <span>dla miłośników technologii</span>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Stopka;
