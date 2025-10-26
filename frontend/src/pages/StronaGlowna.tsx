import { Link, useLocation } from 'react-router-dom';
import KodKuponu from '../components/KodKuponu';
import { Flame, Snowflake, MessageCircle, Star, Zap, Search, Flag, Share2, Gift, Clock } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAuthToken } from '../utils/auth';
import ModalZgloszeniaOferty from '../components/modals/ModalZgloszeniaOferty';

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
  autorAvatarUrl?: string | null;
  dataUtworzenia: string;
  waznoscOd?: string;
  waznoscDo?: string;
  votes: {
    hot: number;
    cold: number;
  };
  komentarze: number;
  liczbaKomentarzy: number;
  link: string;
  userVote?: string;
  zdjecia: string[];
}

// Funkcja formatowania daty
const formatDate = (dateString: string) => {
  // Parsuj polski format daty: "dd.MM.yyyy HH:mm"
  const parsePolishDate = (str: string) => {
    const parts = str.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
    if (parts) {
      const [, day, month, year, hour, minute] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return new Date(str); // fallback do standardowego parsowania
  };

  const date = parsePolishDate(dateString);
  
  // Sprawdź czy data jest poprawna
  if (isNaN(date.getTime())) {
    return dateString; // zwróć oryginalny string jeśli parsowanie nie powiodło się
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'przed chwilą';
  if (diffHours < 24) return `${diffHours}h temu`;
  if (diffDays < 7) return `${diffDays} dni temu`;
  
  return date.toLocaleDateString('pl-PL', { 
    day: 'numeric', 
    month: 'short' 
  });
};

// Komponent odpowiedzialny za wyświetlanie miejsca na zdjęcie (zawsze rezerwuje przestrzeń)
function OfferImage({ offer }: { offer: OfertaDto }) {
  const first = offer.zdjecia && offer.zdjecia.length > 0 ? offer.zdjecia[0] : null;
  const src = first ? (first.startsWith('http') ? first : `http://localhost:5023${first}`) : null;
  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
      {src ? (
        <img
          src={src}
          alt={offer.tytul}
          loading="lazy"
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <span className="text-3xl text-gray-400">{offer.typ === 'kupon' ? '🎫' : '🛍️'}</span>
      )}
    </div>
  );
}

// Prawy sidebar - TOP okazje i aktywność użytkownika
function RightSidebar() {
  const [hotOffers, setHotOffers] = useState<OfertaDto[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const token = getAuthToken();

  // Pobierz TOP 5 ofert z największą liczbą HOT
  useEffect(() => {
    const fetchHotOffers = async () => {
      try {
        const response = await fetch('/api/oferta?sortBy=hot&skip=0&take=5');
        const data = await response.json();
        setHotOffers(data.items || data.Items || []);
      } catch (err) {
        console.error('Error fetching hot offers:', err);
      } finally {
        setLoadingHot(false);
      }
    };
    fetchHotOffers();
  }, []);

  // Pobierz aktywność użytkownika jeśli zalogowany
  useEffect(() => {
    if (!token) {
      setLoadingActivity(false);
      return;
    }

    const fetchActivity = async () => {
      try {
        const response = await fetch('/api/uzytkownik/aktywnosc?skip=0&take=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserActivity(data.items || data.Items || []);
        }
      } catch (err) {
        console.error('Error fetching user activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, [token]);

  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
        {/* TOP okazje */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 transition-colors">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-600" />
          TOP okazje
        </h3>
        
        {loadingHot ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">Ładowanie...</div>
        ) : hotOffers.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">Brak gorących okazji</div>
        ) : (
          <div className="space-y-3">
            {hotOffers.map(offer => {
              const temperatura = offer.votes.hot - offer.votes.cold;
              return (
                <Link
                  key={offer.id}
                  to={`/okazja/${offer.id}`}
                  className="block group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg border dark:border-gray-600 overflow-hidden bg-white flex items-center justify-center">
                      {offer.zdjecia && offer.zdjecia.length > 0 ? (
                        <img
                          src={offer.zdjecia[0].startsWith('http') ? offer.zdjecia[0] : `http://localhost:5023${offer.zdjecia[0]}`}
                          alt={offer.tytul}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl">{offer.typ === 'kupon' ? '🎫' : '🛍️'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {offer.tytul}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {temperatura}°
                        </span>
                        {offer.cena !== undefined && (
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {offer.cena === 0 ? 'GRATIS' : `${offer.cena} zł`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Twoja najnowsza aktywność */}
      {token && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Twoja aktywność
          </h3>
          
          {loadingActivity ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Ładowanie...</div>
          ) : userActivity.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Brak aktywności</div>
          ) : (
            <div className="space-y-3">
              {userActivity.map((activity, idx) => {
                const getActivityIcon = (typ: string) => {
                  switch (typ) {
                    case 'oferta': return '🛍️';
                    case 'komentarz': return '💬';
                    case 'glos': return '👍';
                    case 'odznaka': return '🏆';
                    default: return '•';
                  }
                };

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm border-l-2 border-gray-200 dark:border-gray-600 pl-3 py-1"
                  >
                    <span className="text-lg flex-shrink-0">{getActivityIcon(activity.typ)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{activity.opis}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{activity.data}</p>
                      {activity.punkty && (
                        <span className="inline-block mt-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          +{activity.punkty} pkt
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function StronaGlowna() {
  const location = useLocation();
  
  // Proste filtry obsługiwane przez backend (hot/newest/price)
  const [activeFilter, setActiveFilter] = useState<'gorace' | 'najnowsze' | 'cena' | 'wszystkie'>('gorace');
  const [selectedCategory, setSelectedCategory] = useState('wszystkie');
  const [offers, setOffers] = useState<OfertaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [total, setTotal] = useState(0);
  const [reportingOfferId, setReportingOfferId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccessFlash, setReportSuccessFlash] = useState<string | null>(null);
  const [savedOffers, setSavedOffers] = useState<Set<number>>(new Set());
  const [saveLoading, setSaveLoading] = useState<Set<number>>(new Set());
  const pageSize = 30;
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const skipRef = useRef(0);

  // Odczytaj kategorię z URL przy pierwszym załadowaniu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kategoriaParam = params.get('kategoria');
    if (kategoriaParam) {
      setSelectedCategory(kategoriaParam);
    } else {
      // Jeśli nie ma parametru kategoria w URL, ustaw na "wszystkie"
      setSelectedCategory('wszystkie');
    }
  }, [location]);

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
  // Zawsze pobieram pełny zestaw (bez filtrowania kategorii na backendzie) aby zachować liczniki kategorii
  const response = await fetch(`/api/oferta?skip=${currentSkip}&take=${pageSize}&sortBy=${sortBy}`);
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
  }, [activeFilter]);

  useEffect(() => { fetchOffers(true); }, [activeFilter, fetchOffers]);

  // Normalizuj selectedCategory do wersji występującej w ofertach (aby uniknąć duplikatów po case)
  useEffect(() => {
    if (selectedCategory.toLowerCase() === 'wszystkie') return;
    const match = offers.map(o => o.kategoria).find(k => k.toLowerCase() === selectedCategory.toLowerCase());
    if (match && match !== selectedCategory) {
      setSelectedCategory(match);
    }
  }, [offers, selectedCategory]);

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

  // Ładowanie zapisanych ofert
  const fetchSavedOffers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/uzytkownik/zapisane?take=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const savedOfferIds = (data.items || data.Items || []).map((offer: any) => offer.id);
        setSavedOffers(new Set(savedOfferIds));
      }
    } catch (error) {
      console.error('Error fetching saved offers:', error);
    }
  }, []);

  // Załaduj zapisane oferty przy starcie
  useEffect(() => {
    fetchSavedOffers();
  }, [fetchSavedOffers]);

  // Funkcja głosowania
  const [votingInProgress, setVotingInProgress] = useState<Set<number>>(new Set());

  const handleVote = async (offerId: number, voteType: 'hot' | 'cold') => {
    const token = getAuthToken();
    if (!token) { alert('Musisz być zalogowany, aby głosować'); return; }
    
    // Zabezpieczenie przed wielokrotnym klikaniem
    if (votingInProgress.has(offerId)) {
      return; // Ignoruj jeśli głosowanie jest w trakcie
    }
    
    setVotingInProgress(prev => new Set(prev).add(offerId));
    
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
    } finally {
      // Usuń z zestawu głosujących po zakończeniu
      setVotingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });
    }
  };

  const submitOfferReport = async (powod: string) => {
    if (reportingOfferId == null) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby zgłosić ofertę'); return; }
    setReportLoading(true);
    try {
      const res = await fetch(`/api/uzytkownik/zgloszenie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ typ: 'offer', idTresci: reportingOfferId, powod })
      });
      if (res.ok) {
        setReportSuccessFlash('Zgłoszenie wysłane. Dziękujemy!');
        setTimeout(() => setReportSuccessFlash(null), 4000);
        setReportingOfferId(null);
      } else {
        const t = await res.text();
        alert('Błąd zgłaszania: ' + t);
      }
    } finally {
      setReportLoading(false);
    }
  };

  // Funkcja udostępniania oferty
  const handleShare = async (offerId: number) => {
    const offerUrl = `${window.location.origin}/okazja/${offerId}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(offerUrl);
        alert('Link do oferty został skopiowany do schowka!');
      } catch {
        fallbackCopyTextToClipboard(offerUrl);
      }
    } else {
      fallbackCopyTextToClipboard(offerUrl);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Link do oferty został skopiowany do schowka!');
  };

  // Funkcja zapisywania/usuwania oferty z zapisanych
  const handleSave = async (offerId: number) => {
    const token = getAuthToken();
    if (!token) {
      alert('Musisz być zalogowany aby zapisać ofertę');
      return;
    }

    // Dodaj do loading
    setSaveLoading(prev => new Set([...prev, offerId]));
    
    try {
      const isSaved = savedOffers.has(offerId);
      
      if (isSaved) {
        // Usuń z zapisanych
        const response = await fetch(`/api/uzytkownik/zapisane/${offerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setSavedOffers(prev => {
            const newSet = new Set(prev);
            newSet.delete(offerId);
            return newSet;
          });
          alert('Oferta została usunięta z zapisanych!');
        } else {
          const errorText = await response.text();
          alert('Błąd podczas usuwania: ' + errorText);
        }
      } else {
        // Dodaj do zapisanych
        const response = await fetch(`/api/uzytkownik/zapisane/${offerId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setSavedOffers(prev => new Set([...prev, offerId]));
          alert('Oferta została zapisana!');
        } else {
          const errorText = await response.text();
          alert('Błąd podczas zapisywania: ' + errorText);
        }
      }
    } catch (error) {
      alert('Błąd podczas zapisywania oferty');
      console.error('Save error:', error);
    } finally {
      // Usuń z loading
      setSaveLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });
    }
  };

  const filteredOffers = useMemo(() => {
    let list = [...offers];
    // Use case-insensitive comparison for the special 'Wszystkie' category
    if (selectedCategory.toLowerCase() !== 'wszystkie') {
      list = list.filter(o => o.kategoria.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchDebounced) {
      list = list.filter(o => o.tytul.toLowerCase().includes(searchDebounced) || o.opis.toLowerCase().includes(searchDebounced) || o.tagi.some(t => t.toLowerCase().includes(searchDebounced)));
    }
    return list;
  }, [offers, selectedCategory, searchDebounced]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top banner */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white py-2.5">
        <div className="px-4 text-center">
          <p className="text-sm font-medium">
            <Star className="inline w-4 h-4 mr-1.5" />
            Prawdziwi ludzie, prawdziwe oszczędności
          </p>
        </div>
      </div>

      {/* Main hero - Clean and minimal */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="max-w-[1800px] mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            TechPromo
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Odkrywaj setki okazji publikowanych przez łowców okazji, takich jak Ty!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/auth/register"
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              <Zap className="w-5 h-5 inline mr-2" />
              Dołącz za darmo
            </Link>
            
            <Link
              to="#oferty"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('.offers-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Przeglądaj okazje
            </Link>
          </div>
        </div>
      </div>

      {/* Filtry główne */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-16 z-40 shadow-sm transition-colors">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center py-3 gap-3">
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { key: 'gorace', label: '🔥 Gorące' },
                { key: 'najnowsze', label: '⚡ Najnowsze' },
                { key: 'cena', label: '💰 Cena' },
                { key: 'wszystkie', label: '📋 Wszystkie' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeFilter === f.key ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1" />
            <div className="relative w-full sm:w-80">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Szukaj ofert, sklepów, marek..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6 offers-section">
        <div className="flex gap-6">
          {/* Główna lista ofert */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600 dark:text-gray-400">Ładowanie ofert...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600 dark:text-gray-400">Brak ofert do wyświetlenia</div>
              </div>
            ) : (
            <div className="space-y-3">
              {filteredOffers.map(offer => {
                return (
                    <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-shrink-0 self-start">
                          <OfferImage offer={offer} />
                          <div className="absolute bottom-2 left-2 flex space-x-1">
                            <button onClick={() => handleVote(offer.id, 'hot')} className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md transition-colors">
                              <Flame className="w-4 h-4" />
                              <span>{offer.votes.hot}</span>
                            </button>
                            <button onClick={() => handleVote(offer.id, 'cold')} className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md transition-colors">
                              <Snowflake className="w-4 h-4" />
                              <span>{offer.votes.cold}</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col">
                          <Link to={`/okazja/${offer.id}`} className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">{offer.tytul}</Link>
                          
                          <div className="mb-3">
                            {offer.typ === 'kupon' ? (
                              <div className="flex items-center flex-wrap gap-3">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">🎫 KUPON</span>
                                <KodKuponu code={offer.kod} size="sm" />
                                {offer.cena === 0 && <span className="text-2xl font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg flex items-center gap-1"><Gift className="w-5 h-5" /> ZA DARMO!</span>}
                                {offer.cena && offer.cena > 0 && <span className="text-2xl font-semibold text-purple-600 dark:text-purple-400">{offer.cena} zł</span>}
                                {!offer.cena && <span className="text-base text-gray-600 dark:text-gray-400 font-medium">Sprawdź cenę</span>}
                              </div>
                            ) : (
                              <div className="flex items-center flex-wrap gap-3">
                                {offer.cenaPoprzednia && <span className="text-base line-through text-gray-400 dark:text-gray-500 font-normal" title="Stara cena">{offer.cenaPoprzednia} zł</span>}
                                {offer.cena === 0 ? (
                                  <span className="text-3xl font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg flex items-center gap-2"><Gift className="w-7 h-7" /> ZA DARMO!</span>
                                ) : offer.cena ? (
                                  <span className="text-3xl font-semibold text-red-600 dark:text-red-400">{offer.cena} zł</span>
                                ) : (
                                  <span className="text-xl font-medium text-gray-600 dark:text-gray-400">Sprawdź cenę</span>
                                )}
                                {offer.cenaPoprzednia && offer.cena && offer.cena > 0 && offer.cenaPoprzednia > offer.cena && (
                                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-lg shadow-sm">-{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-base text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{offer.opis}</div>
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                                <Link to={`/uzytkownik/${offer.autor}`} className="flex-shrink-0">
                                  <img
                                    src={offer.autorAvatarUrl || '/default-avatar.svg'}
                                    alt={offer.autor}
                                    className="w-7 h-7 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                                    onError={(e)=>{ const img=e.target as HTMLImageElement; img.onerror=null; img.src='/default-avatar.svg'; }}
                                  />
                                </Link>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                  <Link to={`/uzytkownik/${offer.autor}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {offer.autor}
                                  </Link>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="hidden sm:inline text-gray-400 dark:text-gray-500">•</span>
                                    <span>{formatDate(offer.dataUtworzenia)}</span>
                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                    <span className="text-purple-600 dark:text-purple-400 font-medium">{offer.kategoria}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{offer.liczbaKomentarzy}</span>
                              </button>
                            </div>

                            {/* Ważność oferty */}
                            {(offer.waznoscOd || offer.waznoscDo) && (
                              <div className="mt-2 flex items-center text-xs text-orange-600 dark:text-orange-400">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                <span className="font-medium">
                                  Ważna: {offer.waznoscOd && offer.waznoscDo ? (
                                    <>{new Date(offer.waznoscOd).toLocaleDateString('pl-PL')} - {new Date(offer.waznoscDo).toLocaleDateString('pl-PL')}</>
                                  ) : offer.waznoscOd ? (
                                    <>od {new Date(offer.waznoscOd).toLocaleDateString('pl-PL')}</>
                                  ) : offer.waznoscDo ? (
                                    <>do {new Date(offer.waznoscDo).toLocaleDateString('pl-PL')}</>
                                  ) : null}
                                </span>
                              </div>
                            )}
                            
                            {/* Przyciski akcji - responsywny layout */}
                            <div className="flex flex-col gap-3">
                              {/* Pierwsza linia - małe przyciski akcji */}
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleShare(offer.id)}
                                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span className="hidden sm:inline font-medium">Udostępnij</span>
                                </button>
                                
                                <button 
                                  onClick={() => handleSave(offer.id)}
                                  disabled={saveLoading.has(offer.id)}
                                  className={`flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                                    savedOffers.has(offer.id) 
                                      ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50' 
                                      : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                                  }`}
                                >
                                  <span className={`text-lg ${savedOffers.has(offer.id) ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>⭐</span>
                                  <span className="hidden sm:inline font-medium">{saveLoading.has(offer.id) ? 'Zapisywanie...' : (savedOffers.has(offer.id) ? 'Zapisane' : 'Zapisz')}</span>
                                </button>
                                
                                <button 
                                  onClick={() => setReportingOfferId(offer.id)} 
                                  className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all" 
                                  title="Zgłoś ofertę"
                                >
                                  <Flag className="w-4 h-4" />
                                  <span className="hidden sm:inline font-medium">Zgłoś</span>
                                </button>
                              </div>
                              
                              {/* Druga linia - główne przyciski */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <Link 
                                  to={`/okazja/${offer.id}`} 
                                  className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center space-x-2"
                                >
                                  <span>Zobacz szczegóły</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="space-y-3" aria-hidden>
                    {Array.from({length: 3}).map((_,i)=>(
                      <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-4 flex">
                        <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded mr-4" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          <div className="flex space-x-2 pt-2">
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          {/* Załaduj więcej */}
          <div ref={sentinelRef} className="h-4" />
          </div>

          {/* Prawy sidebar */}
          <RightSidebar />
        </div>
      </div>

      {/* Modals and notifications */}
      {reportSuccessFlash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 text-sm">
          {reportSuccessFlash}
        </div>
      )}

      {reportingOfferId !== null && (
        <ModalZgloszeniaOferty
          isVisible={reportingOfferId !== null}
          offerId={reportingOfferId}
          onClose={() => !reportLoading && setReportingOfferId(null)}
          onSubmit={submitOfferReport}
          loading={reportLoading}
        />
      )}
    </div>
  );
}

export default StronaGlowna;
