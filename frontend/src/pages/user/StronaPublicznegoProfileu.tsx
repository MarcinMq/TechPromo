import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, Award, MessageSquare, ShoppingBag, ThumbsUp, Trophy } from 'lucide-react';

// Interfejsy odpowiadające temu co zwraca backend (camelCase z ASP.NET Core)
interface Badge {
  idOdznaka: number;
  nazwa: string;
  opis: string;
  ikona: string;
  dataPrzyznania: string;
}

interface Activity {
  id: number;
  typ: string;
  opis: string;
  data: string;
  punkty?: number;
}

interface Offer {
  id: number;
  tytul: string;
  opis: string;
  cena: number | null;
  cenaPoprzednia?: number | null;
  kategoria: string;
  sklep: string;
  typ: string;
  dataUtworzenia: string;
  votes: {
    hot: number;
    cold: number;
  };
  komentarze: number;
  autor: string;
  autorAvatarUrl?: string;
  zdjecia?: string[];
}

interface PublicProfile {
  idUzytkownik: number;
  nick: string;
  avatarUrl?: string;
  punkty: number;
  dataRejestracji: string;
  odznaki: Badge[];
  ostatnieKomentarze: Activity[];
  dodaneOferty: Offer[];
  liczbaKomentarzy: number;
  liczbaDodanychOfert: number;
  liczbaGlosow: number;
}

const StronaPublicznegoProfileu: React.FC = () => {
  const { nick } = useParams<{ nick: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'oferty' | 'komentarze' | 'odznaki'>('oferty');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Pobieranie profilu dla:', nick);
        const response = await fetch(`/api/uzytkownicy/${nick}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Błąd odpowiedzi:', errorData);
          
          // Spróbuj sparsować JSON jeśli jest
          try {
            const errorJson = JSON.parse(errorData);
            throw new Error(errorJson.message || 'Użytkownik nie znaleziony');
          } catch {
            throw new Error('Użytkownik nie znaleziony');
          }
        }

        const data = await response.json();
        console.log('Otrzymane dane profilu:', data);
        console.log('Nick:', data.Nick, 'nick:', data.nick);
        console.log('Odznaki:', data.Odznaki, 'odznaki:', data.odznaki);
        console.log('Wszystkie klucze:', Object.keys(data));
        setProfile(data);
      } catch (err) {
        console.error('Błąd podczas ładowania profilu:', err);
        setError(err instanceof Error ? err.message : 'Błąd podczas ładowania profilu');
      } finally {
        setLoading(false);
      }
    };

    if (nick) {
      fetchProfile();
    } else {
      setError('Brak nazwy użytkownika');
      setLoading(false);
    }
  }, [nick]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nie znaleziono użytkownika</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link to="/" className="text-blue-600 hover:underline">Powrót do strony głównej</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header profilu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.nick || 'Użytkownik'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500">
                  <span className="text-3xl font-bold text-white">
                    {profile.nick ? profile.nick.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>

            {/* Informacje */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile.nick || 'Nieznany użytkownik'}</h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Dołączył {profile.dataRejestracji || 'nieznana data'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-600 dark:text-yellow-500">{profile.punkty || 0} punktów</span>
                </div>
              </div>

              {/* Statystyki */}
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Oferty</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{profile.liczbaDodanychOfert || 0}</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Komentarze</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{profile.liczbaKomentarzy || 0}</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Głosy</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{profile.liczbaGlosow || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Odznaki */}
        {profile.odznaki && profile.odznaki.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Odznaki ({profile.odznaki.length})</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.odznaki.map((badge: Badge) => (
                <div 
                  key={badge.idOdznaka}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 text-center border-2 border-yellow-200 dark:border-yellow-700"
                >
                  <div className="text-4xl mb-2">{badge.ikona}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{badge.nazwa}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{badge.opis}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{badge.dataPrzyznania}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab('oferty')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'oferty'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Dodane oferty ({profile.dodaneOferty?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('komentarze')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'komentarze'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Ostatnie komentarze ({profile.ostatnieKomentarze?.length || 0})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Oferty */}
            {activeTab === 'oferty' && (
              <div className="space-y-4">
                {!profile.dodaneOferty || profile.dodaneOferty.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Brak dodanych ofert</p>
                ) : (
                  profile.dodaneOferty.map((offer) => (
                    <Link
                      key={offer.id}
                      to={`/okazja/${offer.id}`}
                      className="block bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{offer.tytul}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{offer.opis}</p>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-purple-600 dark:text-purple-400">{offer.kategoria}</span>
                            <span>•</span>
                            <span>{offer.dataUtworzenia}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{offer.komentarze}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {offer.cena !== null && (
                            <>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{offer.cena.toFixed(2)} zł</div>
                              {offer.cenaPoprzednia && (
                                <div className="text-sm text-gray-500 line-through">{offer.cenaPoprzednia.toFixed(2)} zł</div>
                              )}
                            </>
                          )}
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">🔥 {offer.votes.hot}</span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">❄️ {offer.votes.cold}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Tab: Komentarze */}
            {activeTab === 'komentarze' && (
              <div className="space-y-4">
                {!profile.ostatnieKomentarze || profile.ostatnieKomentarze.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Brak komentarzy</p>
                ) : (
                  profile.ostatnieKomentarze.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.opis}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{comment.data}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StronaPublicznegoProfileu;
