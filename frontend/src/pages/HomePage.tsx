import { Link } from 'react-router-dom';
import { Flame, Snowflake, MessageCircle, Filter, Star, Zap, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/auth';

// Typy dla prawdziwych danych z API
interface OfertaDto {
  id: number;
  tytul: string;
  opis: string;
  cena?: number;
  cenaPoprzednia?: number;
  kod?: string; // Kod kuponu dla kuponów
  typ: string; // "okazja" lub "kupon"
  sklep: string;
  kategoria: string;
  tagi: string[];
  autor: string;
  dataUtworzenia: string;
  votes: {
    hot: number;
    cold: number;
  };
  komentarze: number;
  userVote?: string;
  zdjecia: string[];
}

function HomePage() {
  const [activeFilter, setActiveFilter] = useState('popularne');
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [offers, setOffers] = useState<OfertaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pobierz oferty z API
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5023/api/oferta');
        if (response.ok) {
          const data = await response.json();
          setOffers(data);
        } else {
          setError('Błąd podczas pobierania ofert');
        }
      } catch (err) {
        setError('Błąd połączenia z serwerem');
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Funkcja głosowania
  const handleVote = async (offerId: number, voteType: 'hot' | 'cold') => {
    try {
      const token = getAuthToken(); // Użycie funkcji z auth.ts
      console.log('Token z localStorage:', token ? 'Znaleziony' : 'Brak');
      
      if (!token) {
        alert('Musisz być zalogowany, aby głosować');
        return;
      }

      console.log(`Wysyłanie głosu ${voteType} dla oferty ${offerId}`);
      
      const response = await fetch(`http://localhost:5023/api/uzytkownik/oferta/${offerId}/glos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ typ: voteType })
      });

      console.log('Status odpowiedzi:', response.status);
      
      if (response.ok) {
        console.log('Głosowanie udane');
        // Odśwież listę ofert po głosowaniu
        const refreshResponse = await fetch('http://localhost:5023/api/oferta');
        if (refreshResponse.ok) {
          const updatedData = await refreshResponse.json();
          setOffers(updatedData);
        }
      } else {
        const errorText = await response.text();
        console.error('Błąd podczas głosowania:', response.status, errorText);
        alert(`Błąd podczas głosowania: ${errorText || 'Nieznany błąd'}`);
      }
    } catch (error) {
      console.error('Błąd sieci podczas głosowania:', error);
      alert('Błąd połączenia z serwerem');
    }
  };

  // Przykładowe kategorie - można będzie później pobrać z API
  const categories = [
    { name: 'Wszystkie', count: offers.length, icon: '🔥' },
    { name: 'Telefony', count: 0, icon: '📱' },
    { name: 'Laptopy', count: 0, icon: '💻' },
    { name: 'Audio', count: 0, icon: '🎧' },
    { name: 'TV', count: 0, icon: '📺' },
    { name: 'Gaming', count: 0, icon: '🎮' },
    { name: 'Foto', count: 0, icon: '📷' },
    { name: 'Smartwatche', count: 0, icon: '⌚' },
    { name: 'Tablety', count: 0, icon: '📱' },
    { name: 'PC', count: 0, icon: '🖥️' },
    { name: 'Akcesoria', count: 0, icon: '🔌' },
  ];

  const getTemperatureColor = (temp: number) => {
    if (temp >= 100) return 'text-red-600 bg-red-50 border-red-200';
    if (temp >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (temp >= 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top banner jak pepper.pl */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
        <div className="w-full px-4 text-center">
          <p className="text-sm font-medium">
            <Star className="inline w-4 h-4 mr-2" />
            Prawdziwi ludzie, prawdziwe oszczędności
          </p>
        </div>
      </div>

      {/* Main hero - jak pepper.pl */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              <span className="text-blue-600">Tech</span>Promo
            </h1>
            <h2 className="text-xl text-gray-700 font-medium">
              Odkrywaj setki okazji publikowanych przez łowców okazji, takich jak Ty!
            </h2>
          </div>
        </div>
      </div>

      {/* Filtry główne - jak na pepper.pl */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="w-full px-4">
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b gap-3">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { key: 'popularne', label: 'Popularne' },
                { key: 'najgoretsze', label: 'Najgorętsze' },
                { key: 'gorace', label: 'Gorące' },
                { key: 'wszystkie', label: 'Wszystkie' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              <span className="hidden sm:inline">Filtruj</span>
              <Filter className="inline w-4 h-4 ml-1" />
            </div>
          </div>
          
          <div className="py-2 text-lg font-bold text-gray-900">
            Popularne okazje
          </div>
          <div className="pb-2 text-sm text-gray-600">
            Okazje cieszące się największym zainteresowaniem
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar lewy - kategorie na mobile jako poziome przyciski */}
          <div className="w-full lg:w-48 flex-shrink-0">
            <div className="bg-white rounded border p-3 lg:sticky lg:top-32">
              <div className="text-sm font-semibold text-gray-900 mb-3 lg:block hidden">Kategorie</div>
              
              {/* Na mobile - poziome przewijanie kategorii */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name.toLowerCase())}
                      className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                        selectedCategory === category.name.toLowerCase()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Na desktop - pionowa lista */}
              <div className="hidden lg:block space-y-1">
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name.toLowerCase())}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm transition-colors ${
                      selectedCategory === category.name.toLowerCase()
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Główna lista ofert - responsywna */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Ładowanie ofert...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-lg text-red-600">{error}</div>
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Brak ofert do wyświetlenia</div>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map(offer => (
                  <div key={offer.id} className="bg-white rounded border hover:shadow-md transition-shadow">
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row">
                        {/* Sekcja temperatury i zdjęcia - na mobile poziomo */}
                        <div className="flex items-center sm:flex-col sm:items-center sm:mr-4 mb-3 sm:mb-0">
                          {/* Temperatura */}
                          <div className="flex flex-col items-center mr-3 sm:mr-0">
                            <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg border font-bold text-sm sm:text-lg ${getTemperatureColor(offer.votes.hot - offer.votes.cold)}`}>
                              {offer.votes.hot - offer.votes.cold}°
                            </div>
                            <div className="flex sm:flex-col items-center mt-1 sm:mt-2 space-x-1 sm:space-x-0 sm:space-y-1">
                              <button 
                                onClick={() => handleVote(offer.id, 'hot')}
                                className="flex items-center space-x-1 bg-red-50 text-red-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs hover:bg-red-100 transition-colors"
                              >
                                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{offer.votes.hot}</span>
                              </button>
                              <button 
                                onClick={() => handleVote(offer.id, 'cold')}
                                className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs hover:bg-blue-100 transition-colors"
                              >
                                <Snowflake className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{offer.votes.cold}</span>
                              </button>
                            </div>
                          </div>

                          {/* Zdjęcie produktu */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-2xl sm:text-3xl overflow-hidden">
                            {offer.zdjecia && offer.zdjecia.length > 0 ? (
                              <img 
                                src={`http://localhost:5023${offer.zdjecia[0]}`} 
                                alt={offer.tytul} 
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  // Fallback do ikony gdy zdjęcie się nie załaduje
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full flex items-center justify-center text-2xl sm:text-3xl ${
                                offer.zdjecia && offer.zdjecia.length > 0 ? 'hidden' : 'flex'
                              }`}
                            >
                              {offer.typ === 'kupon' ? '🎫' : '🛍️'}
                            </div>
                          </div>
                        </div>

                        {/* Główne informacje */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/okazja/${offer.id}`}
                            className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-2 leading-tight"
                          >
                            {offer.tytul}
                          </Link>
                          
                          {/* Cena - duża i widoczna */}
                          <div className="flex flex-wrap items-baseline space-x-2 mb-2">
                            {offer.typ === 'kupon' ? (
                              // Wyświetlanie dla kuponów
                              <div className="flex items-center space-x-2">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-2 py-1 rounded">
                                  🎫 KUPON
                                </span>
                                {offer.kod && (
                                  <span className="bg-gray-100 text-gray-800 text-sm font-mono px-2 py-1 rounded border">
                                    {offer.kod}
                                  </span>
                                )}
                                {offer.cenaPoprzednia && offer.cena && (
                                  <>
                                    <span className="text-lg line-through text-gray-400">{offer.cenaPoprzednia} zł</span>
                                    <span className="text-xl font-black text-purple-600">{offer.cena} zł</span>
                                    <span className="bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                      -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              // Wyświetlanie dla okazji
                              <>
                                {offer.cena ? (
                                  <>
                                    <span className="text-xl font-black text-red-600">{offer.cena} zł</span>
                                    {offer.cenaPoprzednia && offer.cenaPoprzednia > offer.cena && (
                                      <>
                                        <span className="text-base line-through text-gray-400">{offer.cenaPoprzednia} zł</span>
                                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                          -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                                        </span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-lg text-gray-600">Sprawdź cenę</span>
                                )}
                              </>
                            )}
                          </div>
                          {/* Informacje o sklepie */}
                          <div className="flex flex-wrap items-center space-x-3 text-sm text-gray-600 mb-3">
                            <span>Sklep: {offer.sklep || 'Sprawdź online'}</span>
                            <span>Kategoria: {offer.kategoria}</span>
                          </div>

                          {/* Dolna sekcja z użytkownikiem */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">{offer.autor[0]?.toUpperCase()}</span>
                              </div>
                              <span className="text-sm text-gray-600">Dodane przez {offer.autor}</span>
                              <span className="text-sm text-gray-500">{offer.dataUtworzenia}</span>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm">
                                <MessageCircle className="w-4 h-4" />
                                <span>{offer.komentarze}</span>
                              </button>
                              
                              <Link 
                                to={`/okazja/${offer.id}`}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors font-medium"
                              >
                                Idź do okazji
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Załaduj więcej */}
            {offers.length > 0 && (
              <div className="text-center mt-6">
                <button className="bg-white border text-gray-700 px-6 py-2 rounded hover:bg-gray-50 transition-colors">
                  Załaduj więcej ofert
                </button>
              </div>
            )}
          </div>

          {/* Prawny sidebar - najgorętsze dziś, kupony, jak to działa */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded border p-4 sticky top-32">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">🔥 Najgorętsze dziś</h3>
              <div className="space-y-3">
                {offers.slice(0, 3).map(offer => (
                  <div key={offer.id} className="pb-3 border-b border-gray-100 last:border-0">
                    <Link to={`/okazja/${offer.id}`} className="text-sm text-gray-900 hover:text-blue-600 line-clamp-2 block mb-1">
                      {offer.tytul}
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-600">
                        {offer.typ === 'kupon' && offer.kod ? (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                            KUPON: {offer.kod}
                          </span>
                        ) : offer.cena ? (
                          `${offer.cena} zł`
                        ) : (
                          'Sprawdź cenę'
                        )}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getTemperatureColor(offer.votes.hot - offer.votes.cold)}`}>
                        {offer.votes.hot - offer.votes.cold}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Najlepsze kupony - sekcja dodatkowa */}
            <div className="bg-white rounded border p-4 mt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Najlepsze kupony</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <span className="text-gray-700">Media Expert</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <span className="text-gray-700">x-kom</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <span className="text-gray-700">Allegro</span>
                </div>
              </div>
            </div>

            {/* Community info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded border p-4 mt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">💡 Jak to działa?</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start space-x-2">
                  <Zap className="w-3 h-3 mt-0.5 text-blue-600" />
                  <span>Znajdź lub dodaj okazję</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Flame className="w-3 h-3 mt-0.5 text-red-600" />
                  <span>Głosuj HOT/COLD</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-3 h-3 mt-0.5 text-green-600" />
                  <span>Komentuj i dyskutuj</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-3 h-3 mt-0.5 text-purple-600" />
                  <span>Zbuduj reputację</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Link 
                  to="/auth/register"
                  className="block bg-blue-600 text-white text-center py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Dołącz za darmo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
