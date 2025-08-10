import { Link } from 'react-router-dom';
import { Flame, Snowflake, MessageCircle, Star, Zap, Users, Search } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// Komponent odpowiedzialny za wyświetlanie miejsca na zdjęcie (zawsze rezerwuje przestrzeń)
function OfferImage({ offer }: { offer: OfertaDto }) {
  const imageUrl = offer.zdjecia && offer.zdjecia.length > 0 ? `http://localhost:5023${offer.zdjecia[0]}` : null;
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded border border-gray-200 overflow-hidden group bg-gray-50">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={offer.tytul}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 select-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.classList.remove('hidden');
          }}
          draggable={false}
        />
      )}
      <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${imageUrl ? 'hidden' : 'flex'}`}>
        <span className="text-2xl">{offer.typ === 'kupon' ? '🎫' : '🛍️'}</span>
      </div>
    </div>
  );
}

function HomePage() {
  // Proste filtry obsługiwane przez backend (hot/newest/price)
  const [activeFilter, setActiveFilter] = useState<'gorace' | 'najnowsze' | 'cena' | 'wszystkie'>('gorace');
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [offers, setOffers] = useState<OfertaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [total, setTotal] = useState(0);
  const pageSize = 30;
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const skipRef = useRef(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Pobierz oferty z API
  const fetchOffers = useCallback(async (reset = false) => {
    try {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      if (reset) {
  skipRef.current = 0;
        setLoading(true);
      }
      const currentSkip = reset ? 0 : skipRef.current;
      const sortMap: Record<typeof activeFilter, string> = {
        gorace: 'hot',
        najnowsze: 'newest',
        cena: 'price',
        wszystkie: 'newest'
      };
      const sortBy = sortMap[activeFilter];
      const categoryParam = selectedCategory !== 'wszystkie' ? `&kategoria=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`/api/oferta?skip=${currentSkip}&take=${pageSize}&sortBy=${sortBy}${categoryParam}`);
      if (!response.ok) throw new Error('Błąd podczas pobierania ofert');
      const data = await response.json();
      const items: OfertaDto[] = data.items || data.Items || data;
      const newTotal = data.total ?? data.Total ?? items.length;
      setTotal(newTotal);
      setOffers(prev => reset ? items : [...prev, ...items]);
  skipRef.current = currentSkip + items.length;
    } catch (err) {
      if (!error) setError('Błąd połączenia z serwerem');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [activeFilter, selectedCategory]);

  useEffect(() => { fetchOffers(true); }, [activeFilter, selectedCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && offers.length < total && !loading) {
          fetchOffers();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [offers, total, loading, fetchOffers]);

  // Funkcja głosowania
  const handleVote = async (offerId: number, voteType: 'hot' | 'cold') => {
    const token = getAuthToken();
    if (!token) { alert('Musisz być zalogowany, aby głosować'); return; }
    // Optymistyczna aktualizacja
    setOffers(prev => prev.map(o => {
      if (o.id !== offerId) return o;
      const already = o.userVote === voteType;
      let hot = o.votes.hot;
      let cold = o.votes.cold;
      if (voteType === 'hot') {
        if (already) hot -= 1; else { hot += 1; if (o.userVote === 'cold') cold -= 1; }
      } else {
        if (already) cold -= 1; else { cold += 1; if (o.userVote === 'hot') hot -= 1; }
      }
      return { ...o, votes: { hot, cold }, userVote: already ? undefined : voteType };
    }));
    try {
      const res = await fetch(`/api/uzytkownik/oferta/${offerId}/glos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ typ: voteType })
      });
      if (!res.ok) {
        // Revert if failed
        setOffers(prev => prev); // minimal revert (could refetch single)
        const t = await res.text();
        console.error('Vote error', t);
      }
    } catch (e) {
      console.error('Network vote error', e);
    }
  };

  // Przykładowe kategorie - można będzie później pobrać z API
  const categories = useMemo(() => {
    const base = [
      { name: 'Wszystkie', icon: '🔥' },
      { name: 'Telefony', icon: '📱' },
      { name: 'Laptopy', icon: '💻' },
      { name: 'Audio', icon: '🎧' },
      { name: 'TV', icon: '📺' },
      { name: 'Gaming', icon: '🎮' },
      { name: 'Foto', icon: '📷' },
      { name: 'Smartwatche', icon: '⌚' },
      { name: 'Tablety', icon: '📱' },
      { name: 'PC', icon: '🖥️' },
      { name: 'Akcesoria', icon: '�' },
    ];
    return base.map(c => ({ ...c, count: c.name === 'Wszystkie' ? offers.length : offers.filter(o => o.kategoria.toLowerCase() === c.name.toLowerCase()).length }));
  }, [offers]);

  const filteredOffers = useMemo(() => {
    let list = [...offers];
    if (selectedCategory !== 'wszystkie') {
      list = list.filter(o => o.kategoria.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchDebounced) {
      list = list.filter(o => o.tytul.toLowerCase().includes(searchDebounced) || o.opis.toLowerCase().includes(searchDebounced) || o.tagi.some(t => t.toLowerCase().includes(searchDebounced)));
    }
    return list;
  }, [offers, selectedCategory, searchDebounced]);

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
                { key: 'gorace', label: 'Gorące' },
                { key: 'najnowsze', label: 'Najnowsze' },
                { key: 'cena', label: 'Cena' },
                { key: 'wszystkie', label: 'Wszystkie' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeFilter === f.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1" />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              />
            </div>
          </div>
          
          <div className="py-2 text-lg font-bold text-gray-900">
            {activeFilter === 'gorace' && 'Gorące'}
            {activeFilter === 'najnowsze' && 'Najnowsze'}
            {activeFilter === 'cena' && 'Według ceny'}
            {activeFilter === 'wszystkie' && 'Wszystkie'}
          </div>
          <div className="pb-2 text-sm text-gray-600">
            {activeFilter === 'gorace' && 'Sortowanie wg (hot - cold)'}
            {activeFilter === 'najnowsze' && 'Najświeższe dodane oferty'}
            {activeFilter === 'cena' && 'Rosnąco według ceny'}
            {activeFilter === 'wszystkie' && 'Domyślnie najnowsze'}
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
      ) : filteredOffers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Brak ofert do wyświetlenia</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOffers.map(offer => {
                  const temperatura = offer.votes.hot - offer.votes.cold;
                  const gradient = temperatura > 100 ? 'from-red-500/10 to-orange-500/10' : temperatura > 50 ? 'from-orange-500/10 to-yellow-500/10' : temperatura > 20 ? 'from-yellow-400/10 to-amber-400/10' : temperatura < -10 ? 'from-blue-500/10 to-cyan-500/10' : 'from-gray-200/5 to-gray-100/5';
                  return (
                  <div key={offer.id} className={`bg-white rounded border hover:shadow-md transition-shadow bg-gradient-to-r ${gradient}`}>
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

                          {/* Zdjęcie produktu / placeholder (zawsze rezerwuje miejsce) */}
                          <OfferImage offer={offer} />
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
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-2 py-1 rounded">🎫 KUPON</span>
                                {offer.kod && (
                                  <span className="bg-gray-100 text-gray-800 text-sm font-mono px-2 py-1 rounded border">{offer.kod}</span>
                                )}
                                {offer.cena && (
                                  <span className="text-xl font-black text-purple-600">{offer.cena} zł</span>
                                )}
                                {!offer.cena && <span className="text-sm text-gray-600">Sprawdź cenę</span>}
                              </div>
                            ) : (
                              <>
                                {offer.cena ? (
                                  <div className="flex items-center flex-wrap gap-2">
                                    {offer.cenaPoprzednia && (
                                      <span className="text-sm line-through text-gray-400" title="Stara cena">{offer.cenaPoprzednia} zł</span>
                                    )}
                                    <span className="text-xl font-black text-red-600">{offer.cena} zł</span>
                                    {offer.cenaPoprzednia && offer.cenaPoprzednia > offer.cena && (
                                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                        -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-lg text-gray-600">Sprawdź cenę</span>
                                )}
                              </>
                            )}
                          </div>
                          {/* Informacje: ukryty sklep (link pokazujemy tylko w przycisku na stronie szczegółowej) */}
                          <div className="flex flex-wrap items-center space-x-3 text-sm text-gray-600 mb-3">
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
                              {/* Usunięto bezpośredni link do sklepu z listy */}
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
                 )})}
                {loading && (
                  <div className="space-y-3" aria-hidden>
                    {Array.from({length: 3}).map((_,i)=>(
                      <div key={i} className="animate-pulse bg-white rounded border p-4 flex">
                        <div className="w-28 h-28 bg-gray-200 rounded mr-4" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                          <div className="flex space-x-2 pt-2">
                            <div className="h-6 w-16 bg-gray-200 rounded" />
                            <div className="h-6 w-20 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Załaduj więcej */}
            <div ref={sentinelRef} className="h-4" />
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
