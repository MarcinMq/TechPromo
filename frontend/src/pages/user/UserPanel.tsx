import { useEffect, useState } from 'react';
import { User, Flame, Snowflake, MessageCircle, ShoppingBag, Vote, Trophy, BarChart3, Flag, Filter } from 'lucide-react';
import { authorizedFetch, apiPost } from '../../utils/api';

type Oferta = {
  id: number;
  tytul: string;
  opis: string;
  typ: string; // "okazja" lub "kupon"
  cena?: number;
  cenaPoprzednia?: number;
  kod?: string; // Kod promocyjny dla kuponów
  sklep: string;
  kategoria: string;
  tagi: string[];
  autor: string;
  dataUtworzenia: string;
  votes: { hot: number; cold: number };
  komentarze: number;
  userVote?: 'hot' | 'cold' | null;
  zdjecia: string[];
};

type Aktywnosc = {
  id: number;
  typ: 'oferta' | 'komentarz' | 'glos' | 'odznaka';
  opis: string;
  data: string;
  punkty?: number;
};

type Odznaka = {
  id: number;
  nazwa: string;
  opis: string;
  ikona: string;
  dataOtrzymania: string;
};

type Komentarz = {
  id: number;
  tresc: string;
  oferta: string;
  data: string;
  autor: string;
};

const UserPanel = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'activity' | 'badges' | 'comments' | 'votes'>('offers');
  const [offers, setOffers] = useState<Oferta[]>([]);
  const [userActivity, setUserActivity] = useState<Aktywnosc[]>([]);
  const [userBadges, setUserBadges] = useState<Odznaka[]>([]);
  const [userComments, setUserComments] = useState<Komentarz[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Obsługa anchor linkow z navbara
  // Filtry
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'hot' | 'price'>('newest');

  const API_BASE = 'http://localhost:5023';

  // === POBIERANIE DANYCH ===
  
  const fetchOffers = async () => {
    try {
      // Zmieniony endpoint na oferty użytkownika
      let url = `${API_BASE}/api/uzytkownik/oferty`;
      const params = new URLSearchParams();
      
      if (categoryFilter) params.append('kategoria', categoryFilter);
      if (tagFilter) params.append('tag', tagFilter);
      params.append('sortBy', sortBy);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await authorizedFetch(url);
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      } else {
        setMessage('Błąd pobierania ofert');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchUserActivity = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/aktywnosc`);
      if (res.ok) {
        const data = await res.json();
        // Obsługa obu formatów odpowiedzi - paginowana (Items) lub zwykła tablica
        const items = data.items || data.Items || data;
        setUserActivity(Array.isArray(items) ? items : []);
      } else {
        setMessage('Błąd pobierania historii aktywności');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchUserBadges = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/odznaki`);
      if (res.ok) {
        const data = await res.json();
        setUserBadges(data);
      } else {
        setMessage('Błąd pobierania odznak');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchUserComments = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/komentarze`);
      if (res.ok) {
        const data = await res.json();
        setUserComments(data);
      } else {
        setMessage('Błąd pobierania komentarzy');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  // === AKCJE UŻYTKOWNIKA ===

  const voteOffer = async (offerId: number, voteType: 'hot' | 'cold') => {
    setLoading(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/glos`, { typ: voteType });
      const text = await res.text();
      setMessage(text);
      
      if (res.ok) {
        fetchOffers();
        // Odśwież aktywność po zagłosowaniu
        if (activeTab === 'activity') {
          fetchUserActivity();
        }
      }
    } catch {
      setMessage('Błąd oddawania głosu');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (offerId: number, commentText: string) => {
    if (!commentText.trim()) return;
    
    setLoading(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/komentarz`, { tresc: commentText });
      const text = await res.text();
      setMessage(text);
      
      if (res.ok) {
        fetchOffers();
        // Odśwież aktywność po dodaniu komentarza
        if (activeTab === 'activity') {
          fetchUserActivity();
        }
      }
    } catch {
      setMessage('Błąd dodawania komentarza');
    } finally {
      setLoading(false);
    }
  };

  const reportContent = async (type: 'offer' | 'comment', contentId: number, reason: string) => {
    setLoading(true);
    try {
      const res = await apiPost('/zgloszenia', {
        typ: type,
        idTresci: contentId,
        powod: reason
      });
      const text = await res.text();
      setMessage(text);
    } catch {
      setMessage('Błąd zgłaszania treści');
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (offerId: number) => {
    if (!confirm('Na pewno usunąć ofertę? Tej operacji nie można cofnąć.')) return;
    setLoading(true);
    try {
      const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/oferta/${offerId}`, { method: 'DELETE' });
      const text = await res.text();
      setMessage(text || (res.ok ? 'Oferta usunięta' : 'Nie udało się usunąć oferty'));
      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== offerId));
        // Odśwież aktywność po usunięciu oferty
        if (activeTab === 'activity') {
          fetchUserActivity();
        }
      }
    } catch {
      setMessage('Błąd usuwania oferty');
    } finally {
      setLoading(false);
    }
  };

  // === FILTRY I SORTOWANIE ===

  const filteredOffers = offers.filter(offer => {
    const categoryMatch = !categoryFilter || offer.kategoria === categoryFilter;
    const tagMatch = !tagFilter || offer.tagi.some(tag => 
      tag.toLowerCase().includes(tagFilter.toLowerCase())
    );
    return categoryMatch && tagMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return (b.votes.hot - b.votes.cold) - (a.votes.hot - a.votes.cold);
      case 'price':
        return (a.cena || 0) - (b.cena || 0);
      case 'newest':
      default:
        return new Date(b.dataUtworzenia).getTime() - new Date(a.dataUtworzenia).getTime();
    }
  });

  useEffect(() => {
    fetchOffers();
    fetchUserActivity();
    fetchUserBadges();
    fetchUserComments();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 text-center flex items-center justify-center">
            <User className="w-10 h-10 mr-3 text-custom-blue" />
            Panel Użytkownika
          </h1>
          <p className="text-gray-600 text-center text-lg">Zarządzaj swoimi ofertami, komentarzami i profilem</p>
        </div>
        
        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-center font-semibold backdrop-blur-sm ${
            message.includes('Błąd') 
              ? 'bg-red-100/80 text-red-700 border border-red-200/50' 
              : 'bg-green-100/80 text-green-700 border border-green-200/50'
          }`}>
            {message}
          </div>
        )}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'offers' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('offers')}
            >
              <ShoppingBag className="w-5 h-5 inline mr-1" />
              Dodane Oferty ({offers.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'activity' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              <BarChart3 className="w-5 h-5 inline mr-1" />
              Historia Aktywności ({userActivity.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'badges' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('badges')}
            >
              <Trophy className="w-5 h-5 inline mr-1" />
              Moje Odznaki ({userBadges.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'comments' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('comments')}
            >
              <MessageCircle className="w-5 h-5 inline mr-1" />
              Moje Komentarze ({userComments.length})
            </button>
          </div>
        </div>

      {activeTab === 'offers' && (
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
              <Filter className="w-6 h-6 mr-2 text-blue-600" />
              Filtruj i Sortuj Oferty
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-3 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              >
                <option value="">Wszystkie kategorie</option>
                <option value="Elektronika">📱 Elektronika</option>
                <option value="Moda">👕 Moda</option>
                <option value="Dom i Ogród">🏠 Dom i Ogród</option>
                <option value="Sport">⚽ Sport</option>
                <option value="Książki">📚 Książki</option>
                <option value="Gry">🎮 Gry</option>
                <option value="Kosmetyki">💄 Kosmetyki</option>
                <option value="Jedzenie">🍕 Jedzenie</option>
                <option value="Podróże">✈️ Podróże</option>
                <option value="Inne">🔧 Inne</option>
              </select>
              
              <input
                type="text"
                placeholder="Filtruj po tagach..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="p-3 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              />
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-3 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              >
                <option value="newest">Najnowsze</option>
                <option value="hot">Najgorętsze</option>
                <option value="price">Najtańsze</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map(offer => (
              <div key={offer.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all">
                <div className="mb-4">
                  <h4 className="text-lg font-bold mb-2 text-gray-900">{offer.tytul}</h4>
                  <span className="bg-custom-blue/20 text-custom-blue px-2 py-1 rounded-full text-xs font-semibold">{offer.kategoria}</span>
                </div>
                
                <p className="text-gray-600 mb-4">{offer.opis}</p>
                
                {/* Zdjęcia lub ikona fallback */}
                <div className="mb-4">
                  {offer.zdjecia && offer.zdjecia.length > 0 ? (
                    <div className="flex space-x-2 mb-2">
                      {offer.zdjecia.slice(0, 3).map((image, index) => (
                        <img 
                          key={index} 
                          src={`${API_BASE}${image}`} 
                          alt={`${offer.tytul} - zdjęcie ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200/50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                      {offer.zdjecia.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100/80 backdrop-blur-sm rounded-lg border border-gray-200/50 flex items-center justify-center text-xs text-gray-600 font-semibold">
                          +{offer.zdjecia.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-2xl mb-2">
                      {offer.typ === 'kupon' ? '🎫' : '🛍️'}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  {offer.typ === 'kupon' ? (
                    // Wyświetlanie dla kuponów (tylko nowa cena)
                    <div className="flex flex-wrap items-center space-x-2 mb-2">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-2 py-1 rounded">
                        🎫 KUPON
                      </span>
                      {offer.kod && (
                        <span className="bg-gray-100 text-gray-800 text-sm font-mono px-2 py-1 rounded border">
                          {offer.kod}
                        </span>
                      )}
                      {offer.cena && (
                        <span className="text-xl font-bold text-purple-600">{offer.cena} PLN</span>
                      )}
                    </div>
                  ) : (
                    // Wyświetlanie dla okazji
                    offer.cena && (
                      <div className="flex items-baseline space-x-2 mb-2">
                        {offer.cenaPoprzednia && offer.cenaPoprzednia > offer.cena && (
                          <span className="text-sm line-through text-gray-400">{offer.cenaPoprzednia} PLN</span>
                        )}
                        <span className="text-xl font-bold text-red-600">{offer.cena} PLN</span>
                        {offer.cenaPoprzednia && offer.cenaPoprzednia > offer.cena && (
                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                          </span>
                        )}
                      </div>
                    )
                  )}
                  
                </div>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {offer.tagi.map(tag => (
                    <span key={tag} className="bg-gray-100/80 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs">#{tag}</span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <button 
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                        offer.userVote === 'hot' 
                          ? 'bg-red-500/80 backdrop-blur-sm text-white' 
                          : 'bg-red-100/80 backdrop-blur-sm text-red-600 hover:bg-red-200/80'
                      }`}
                      onClick={() => voteOffer(offer.id, 'hot')}
                      disabled={loading}
                    >
                      <Flame className="w-4 h-4 inline mr-1" />
                      {offer.votes.hot}
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                        offer.userVote === 'cold' 
                          ? 'bg-blue-500/80 backdrop-blur-sm text-white' 
                          : 'bg-blue-100/80 backdrop-blur-sm text-blue-600 hover:bg-blue-200/80'
                      }`}
                      onClick={() => voteOffer(offer.id, 'cold')}
                      disabled={loading}
                    >
                      <Snowflake className="w-4 h-4 inline mr-1" />
                      {offer.votes.cold}
                    </button>
                  </div>
                  
                  <span className="text-sm text-gray-600 flex items-center">
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    {offer.komentarze}
                  </span>
                  
                  <button 
                    className="text-red-500 hover:text-red-700 transition-colors text-sm"
                    onClick={() => {
                      const reason = prompt('Powód zgłoszenia:');
                      if (reason) reportContent('offer', offer.id, reason);
                    }}
                  >
                    <Flag className="w-4 h-4 inline mr-1" />
                    Zgłoś
                  </button>
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Dodaj komentarz..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addComment(offer.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="w-full p-3 border border-gray-300/50 rounded-xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  Dodane przez: {offer.autor} | {offer.dataUtworzenia}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    onClick={() => deleteOffer(offer.id)}
                    disabled={loading}
                  >
                    Usuń
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-custom-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      const base = offer.typ === 'kupon' ? '/stworz-oferte/kupon' : '/stworz-oferte/okazja';
                      window.location.href = `${base}?edit=${offer.id}`;
                    }}
                  >
                    Edytuj
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Historia Twojej Aktywności
          </h2>
          
          <div className="space-y-4">
            {userActivity.map(activity => (
              <div key={activity.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {activity.typ === 'oferta' && <ShoppingBag className="w-6 h-6 text-green-600" />}
                    {activity.typ === 'komentarz' && <MessageCircle className="w-6 h-6 text-blue-600" />}
                    {activity.typ === 'glos' && <Vote className="w-6 h-6 text-purple-600" />}
                    {activity.typ === 'odznaka' && <Trophy className="w-6 h-6 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{activity.opis}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{activity.data}</span>
                      {activity.punkty && (
                        <span className="text-green-600 font-semibold">+{activity.punkty} pkt</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
            Twoje Zdobyte Odznaki
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBadges.map(badge => (
              <div key={badge.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
                <div className="text-4xl mb-4">{badge.ikona}</div>
                <h4 className="text-lg font-bold mb-2 text-gray-900">{badge.nazwa}</h4>
                <p className="text-gray-600 mb-4">{badge.opis}</p>
                <small className="text-gray-500">Zdobyta: {badge.dataOtrzymania}</small>
              </div>
            ))}
            
            {userBadges.length === 0 && (
              <div className="col-span-full text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300/50">
                <p className="text-gray-600 mb-2">Nie masz jeszcze żadnych odznak! 🎯</p>
                <p className="text-sm text-gray-500">Bądź aktywny na platformie, aby zdobywać odznaki za swoje osiągnięcia.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
            <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
            Twoje Komentarze
          </h2>
          
          <div className="space-y-4">
            {userComments.map(comment => (
              <div key={comment.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{comment.tresc}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>W ofercie: <strong>{comment.oferta}</strong></span>
                      <span>{comment.data}</span>
                    </div>
                  </div>
                  <button 
                    className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => {
                      const reason = prompt('Powód zgłoszenia komentarza:');
                      if (reason) reportContent('comment', comment.id, reason);
                    }}
                  >
                    🚩
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserPanel;
