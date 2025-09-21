import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Heart, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Główna sekcja stopki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo i opis */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">TechPromo</span>
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Najlepsze okazje i promocje technologiczne w jednym miejscu. 
              Odkrywaj, dziel się i oszczędzaj na swoich ulubionych gadżetach!
            </p>
          </div>

          {/* Kategorie */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Popularne kategorie</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-300">📱 Smartwatche</span></li>
              <li><span className="text-gray-300">📱 Tablety</span></li>
              <li><span className="text-gray-300">🖥️ Komputery PC</span></li>
              <li><span className="text-gray-300">🎧 Audio</span></li>
              <li><span className="text-gray-300">🎮 Gaming</span></li>
            </ul>
          </div>

          {/* Szybkie linki */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Szybkie linki</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/stworz-oferte/okazja" className="text-gray-300 hover:text-white transition-colors">Dodaj okazję</Link></li>
              <li><Link to="/stworz-oferte/kupon" className="text-gray-300 hover:text-white transition-colors">Dodaj kupon</Link></li>
              <li><Link to="/konto/profil" className="text-gray-300 hover:text-white transition-colors">Panel użytkownika</Link></li>
              <li><Link to="/search" className="text-gray-300 hover:text-white transition-colors">Wyszukiwarka</Link></li>
            </ul>
          </div>

          {/* Pomoc i kontakt */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Informacje</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-300 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  kontakt@techpromo.pl
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Dolna sekcja */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © {currentYear} TechPromo. Wszelkie prawa zastrzeżone.
            </div>

            {/* Serce i tekst */}
            <div className="flex items-center text-sm text-gray-400">
              <span>Stworzone z</span>
              <Heart className="w-4 h-4 mx-2 text-red-400" />
              <span>dla miłośników technologii</span>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
