import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Heart, Mail, Github, Twitter, Facebook, Shield, FileText, HelpCircle } from 'lucide-react';

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
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Kategorie */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Kategorie</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/kategoria/smartwatche" className="text-gray-300 hover:text-white transition-colors">Smartwatche</Link></li>
              <li><Link to="/kategoria/tablety" className="text-gray-300 hover:text-white transition-colors">Tablety</Link></li>
              <li><Link to="/kategoria/pc" className="text-gray-300 hover:text-white transition-colors">Komputery PC</Link></li>
              <li><Link to="/kategoria/akcesoria" className="text-gray-300 hover:text-white transition-colors">Akcesoria</Link></li>
              <li><Link to="/kategoria/audio" className="text-gray-300 hover:text-white transition-colors">Audio</Link></li>
              <li><Link to="/kategoria/gaming" className="text-gray-300 hover:text-white transition-colors">Gaming</Link></li>
            </ul>
          </div>

          {/* Szybkie linki */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Szybkie linki</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/stworz-oferte/okazja" className="text-gray-300 hover:text-white transition-colors">Dodaj okazję</Link></li>
              <li><Link to="/stworz-oferte/kupon" className="text-gray-300 hover:text-white transition-colors">Dodaj kupon</Link></li>
              <li><Link to="/uzytkownik/panel" className="text-gray-300 hover:text-white transition-colors">Panel użytkownika</Link></li>
              <li><Link to="/konto/profil" className="text-gray-300 hover:text-white transition-colors">Mój profil</Link></li>
              <li><Link to="/search" className="text-gray-300 hover:text-white transition-colors">Wyszukiwarka</Link></li>
            </ul>
          </div>

          {/* Pomoc i kontakt */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Pomoc i kontakt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Centrum pomocy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Kontakt
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Regulamin
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Polityka prywatności
                </a>
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

            {/* Dodatkowe linki */}
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">RODO</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">API</a>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
