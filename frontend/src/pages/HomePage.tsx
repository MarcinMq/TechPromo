import { Link } from 'react-router-dom';
import CouponCode from '../components/CouponCode';
import { Flame, Snowflake, MessageCircle, Star, Zap, Users, Search, Flag, Share2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAuthToken } from '../utils/auth';
import ReportOfferModal from '../components/modals/ReportOfferModal';

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
  const date = new Date(dateString);
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
  const [reportingOfferId, setReportingOfferId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccessFlash, setReportSuccessFlash] = useState<string | null>(null);
  const [savedOffers, setSavedOffers] = useState<Set<number>>(new Set());
  const [saveLoading, setSaveLoading] = useState<Set<number>>(new Set());
  const pageSize = 30;
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const skipRef = useRef(0);

  // Top 3 ofert z największą liczbą HOT (malejąco)
  const topHotOffers = useMemo(() => {
    return [...offers]
      .sort((a, b) => (b.votes.hot - a.votes.hot))
      .slice(0, 3);
  }, [offers]);

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

  // Stała lista kategorii (spójna z formularzami dodawania)
  const categories = useMemo(() => {
    const base = [
      { name: 'Telefony', icon: '📱' },
      { name: 'Laptopy', icon: '💻' },
      { name: 'Audio', icon: '🎧' },
      { name: 'TV', icon: '📺' },
      { name: 'Gaming', icon: '🎮' },
      { name: 'Foto', icon: '📷' },
      { name: 'Smartwatche', icon: '⌚' },
      { name: 'Tablety', icon: '📱' },
      { name: 'PC', icon: '🖥️' },
      { name: 'Akcesoria', icon: '🔌' }
    ];
    const withCounts = base.map(c => ({ ...c, count: offers.filter(o => o.kategoria.toLowerCase() === c.name.toLowerCase()).length }));
    return [{ name: 'Wszystkie', icon: '🔥', count: offers.length }, ...withCounts];
  }, [offers]);

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

  const getTemperatureColor = (temp: number) => {
    if (temp >= 100) return 'text-red-600 bg-red-50 border-red-200';
    if (temp >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (temp >= 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top banner jak pepper.pl */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
        <div className="px-2 text-center">
          <p className="text-sm font-medium">
            <Star className="inline w-4 h-4 mr-2" />
            Prawdziwi ludzie, prawdziwe oszczędności
          </p>
        </div>
      </div>

      {/* Main hero - jak pepper.pl */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-2 py-8">
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
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="px-2">
          <div className="flex flex-col sm:flex-row sm:items-center py-4 gap-4">
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
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeFilter === f.key ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1" />
            <div className="relative w-full sm:w-80">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj ofert, sklepów, marek..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar lewy - kategorie na mobile jako poziome przyciski */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4 lg:sticky lg:top-32">
              <div className="text-lg font-bold text-gray-900 mb-4 lg:block hidden">📂 Kategorie</div>
              
              {/* Na mobile - poziome przewijanie kategorii */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory.toLowerCase() === category.name.toLowerCase()
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                      <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Na desktop - pionowa lista */}
              <div className="hidden lg:block space-y-1">
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all duration-200 ${
                      selectedCategory.toLowerCase() === category.name.toLowerCase()
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{category.count}</span>
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
              <div className="space-y-4">
                {filteredOffers.map(offer => {
                  const temperatura = offer.votes.hot - offer.votes.cold;
                  const gradient = temperatura > 100 ? 'from-red-500/5 to-orange-500/5' : temperatura > 50 ? 'from-orange-500/5 to-yellow-500/5' : temperatura > 20 ? 'from-yellow-400/5 to-amber-400/5' : temperatura < -10 ? 'from-blue-500/5 to-cyan-500/5' : 'from-gray-100/5 to-gray-50/5';
                  return (
                    <div key={offer.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 bg-gradient-to-r ${gradient} group`}>
                      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-shrink-0 self-start">
                          <OfferImage offer={offer} />
                          <div className={`absolute -top-2 -left-2 flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold border shadow-sm ${getTemperatureColor(temperatura)}`}>
                            {temperatura}°
                          </div>
                          <div className="absolute bottom-2 left-2 flex space-x-1">
                            <button onClick={() => handleVote(offer.id, 'hot')} className="flex items-center space-x-1 bg-red-600/90 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-colors">
                              <Flame className="w-3 h-3" />
                              <span>{offer.votes.hot}</span>
                            </button>
                            <button onClick={() => handleVote(offer.id, 'cold')} className="flex items-center space-x-1 bg-blue-600/90 hover:bg-blue-600 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-colors">
                              <Snowflake className="w-3 h-3" />
                              <span>{offer.votes.cold}</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col">
                          <Link to={`/okazja/${offer.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight mb-2 line-clamp-2 group-hover:text-blue-600">{offer.tytul}</Link>
                          
                          <div className="mb-3">
                            {offer.typ === 'kupon' ? (
                              <div className="flex items-center flex-wrap gap-3">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">🎫 KUPON</span>
                                <CouponCode code={offer.kod} size="sm" />
                                {offer.cena && <span className="text-2xl font-black text-purple-600">{offer.cena} zł</span>}
                                {!offer.cena && <span className="text-base text-gray-600 font-medium">Sprawdź cenę</span>}
                              </div>
                            ) : (
                              <div className="flex items-center flex-wrap gap-3">
                                {offer.cenaPoprzednia && <span className="text-base line-through text-gray-400 font-medium" title="Stara cena">{offer.cenaPoprzednia} zł</span>}
                                {offer.cena ? <span className="text-3xl font-black text-red-600">{offer.cena} zł</span> : <span className="text-xl text-gray-600 font-bold">Sprawdź cenę</span>}
                                {offer.cenaPoprzednia && offer.cena && offer.cenaPoprzednia > offer.cena && (
                                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-lg shadow-sm">-{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-base text-gray-600 line-clamp-2 mb-4 leading-relaxed">{offer.opis}</div>
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <img
                                  src={offer.autorAvatarUrl || '/default-avatar.svg'}
                                  alt={offer.autor}
                                  className="w-7 h-7 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e)=>{ const img=e.target as HTMLImageElement; img.onerror=null; img.src='/default-avatar.svg'; }}
                                />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                  <span className="font-medium text-gray-700">{offer.autor}</span>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="hidden sm:inline text-gray-400">•</span>
                                    <span>{formatDate(offer.dataUtworzenia)}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-purple-600 font-medium">{offer.kategoria}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 text-sm transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{offer.liczbaKomentarzy}</span>
                              </button>
                            </div>
                            
                            {/* Przyciski akcji - responsywny layout */}
                            <div className="flex flex-col gap-3">
                              {/* Pierwsza linia - małe przyciski akcji */}
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleShare(offer.id)}
                                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span className="hidden sm:inline font-medium">Udostępnij</span>
                                </button>
                                
                                <button 
                                  onClick={() => handleSave(offer.id)}
                                  disabled={saveLoading.has(offer.id)}
                                  className={`flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                                    savedOffers.has(offer.id) 
                                      ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100' 
                                      : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                                  }`}
                                >
                                  <span className={`text-lg ${savedOffers.has(offer.id) ? 'text-yellow-500' : 'text-gray-400'}`}>⭐</span>
                                  <span className="hidden sm:inline font-medium">{saveLoading.has(offer.id) ? 'Zapisywanie...' : (savedOffers.has(offer.id) ? 'Zapisane' : 'Zapisz')}</span>
                                </button>
                                
                                <button 
                                  onClick={() => setReportingOfferId(offer.id)} 
                                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all" 
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
                                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                                >
                                  Szczegóły
                                </Link>
                                
                                <a
                                  href={offer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center space-x-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Przejdź do sklepu</span>
                                </a>
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
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="bg-white rounded border p-4 sticky top-32">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">🔥 Najgorętsze dziś</h3>
              <div className="space-y-3">
                {topHotOffers.map(offer => (
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
      {reportSuccessFlash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 text-sm">
          {reportSuccessFlash}
        </div>
      )}

      {reportingOfferId !== null && (
        <ReportOfferModal
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

export default HomePage;
