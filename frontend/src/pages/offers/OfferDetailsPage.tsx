import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, Snowflake, ArrowLeft, ExternalLink, Share2, Gift } from 'lucide-react';
import CouponCode from '../../components/CouponCode';
import ReportCommentModal from '../../components/modals/ReportCommentModal';
import { getAuthToken } from '../../utils/auth';

interface OfertaDto {
  id: number;
  tytul: string;
  opis: string;
  typ: string;
  cena?: number;
  cenaPoprzednia?: number;
  kod?: string;
  sklep: string;
  kategoria: string;
  tagi: string[];
  autor: string;
  dataUtworzenia: string;
  votes: { hot: number; cold: number };
  komentarze: number;
  zdjecia: string[];
  userVote?: string | null;
}

interface CommentDto {
  id: number;
  tresc: string;
  autor: string;
  data: string;
  parentId?: number | null;
  up?: number;
  down?: number;
  userVote?: string | null;
}

interface CommentNode extends CommentDto {
  children: CommentNode[];
}

export default function OfferDetailsPage() {
  const { id } = useParams();
  const [offer, setOffer] = useState<OfertaDto | null>(null);
  const [currentImage, setCurrentImage] = useState(0); // index aktywnego zdjęcia
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsSkip, setCommentsSkip] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const pageSize = 20;
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [commentSort, setCommentSort] = useState<'newest'|'oldest'|'helpful'|'best'>('newest');
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccessFlash, setReportSuccessFlash] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [similarOffers, setSimilarOffers] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Funkcja udostępniania - kopiuje link do schowka
  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      alert('Link do oferty został skopiowany do schowka!');
    } catch (err) {
      alert('Nie udało się skopiować linku do schowka');
      console.error('Share error:', err);
    }
  };

  // Funkcja zapisywania oferty
  const handleSave = async () => {
    if (!id) return;
    
    try {
      setSaveLoading(true);
      const token = getAuthToken();
      if (!token) {
        alert('Musisz być zalogowany aby zapisać ofertę');
        return;
      }

      if (isSaved) {
        // Usuń z zapisanych
        const response = await fetch(`/api/uzytkownik/zapisane/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsSaved(false);
          alert('Oferta została usunięta z zapisanych!');
        } else {
          const errorText = await response.text();
          alert('Błąd podczas usuwania: ' + errorText);
        }
      } else {
        // Dodaj do zapisanych
        const response = await fetch(`/api/uzytkownik/zapisane/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsSaved(true);
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
      setSaveLoading(false);
    }
  };

  // Funkcja sprawdzania czy oferta jest zapisana
  const checkIfSaved = async () => {
    if (!id) return;
    
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
        const savedOffers = data.items || data.Items || [];
        const isOfferSaved = savedOffers.some((savedOffer: any) => savedOffer.id === parseInt(id));
        setIsSaved(isOfferSaved);
      }
    } catch (error) {
      console.error('Error checking if saved:', error);
    }
  };

  const fetchComments = async (reset: boolean) => {
    if (!id) return;
    const currentSkip = reset ? 0 : commentsSkip;
    const res = await fetch(`/api/oferta/${id}/komentarze?skip=${currentSkip}&take=${pageSize}&sort=${commentSort}`);
    if (res.ok) {
      const data = await res.json();
      if (reset) {
        setComments(data.items || data.Items || []);
      } else {
        setComments(prev => [...prev, ...(data.items || data.Items || [])]);
      }
      setCommentsTotal(data.total ?? data.Total ?? 0);
      setCommentsSkip(currentSkip + (data.take ?? data.Take ?? pageSize));
    }
  };

  const fetchSimilarOffers = async () => {
    if (!id) return;
    try {
      setLoadingSimilar(true);
      const res = await fetch(`/api/wyszukiwarka/podobne/${id}?liczba=5`);
      if (res.ok) {
        const data = await res.json();
        setSimilarOffers(data || []);
      }
    } catch (error) {
      console.error('Error fetching similar offers:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/oferta/${id}`);
        if (!res.ok) throw new Error('Nie znaleziono oferty');
        const data = await res.json();
        setOffer(data);
        setCurrentImage(0);
        await fetchComments(true);
        await checkIfSaved(); // Sprawdź czy oferta jest zapisana
        await fetchSimilarOffers(); // Pobierz podobne oferty
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Obsługa klawiatury dla zmiany zdjęć
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!offer?.zdjecia || offer.zdjecia.length < 2) return;
      if (e.key === 'ArrowRight') {
        setCurrentImage(ci => (ci + 1) % offer.zdjecia.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImage(ci => (ci - 1 + offer.zdjecia.length) % offer.zdjecia.length);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [offer?.zdjecia]);

  // Lightbox klawiatura
  useEffect(() => {
    if (!lightboxOpen) return;
    const kb = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (!offer?.zdjecia || offer.zdjecia.length < 2) return;
      if (e.key === 'ArrowRight') setCurrentImage(ci => (ci + 1) % offer.zdjecia.length);
      if (e.key === 'ArrowLeft') setCurrentImage(ci => (ci - 1 + offer.zdjecia.length) % offer.zdjecia.length);
    };
    window.addEventListener('keydown', kb);
    return () => window.removeEventListener('keydown', kb);
  }, [lightboxOpen, offer?.zdjecia]);

  useEffect(() => {
    // reload comments on sort change
    setCommentsSkip(0);
    fetchComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentSort]);

  const handleVote = async (vote: 'hot' | 'cold') => {
    if (!offer) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby głosować'); return; }
    const res = await fetch(`/api/uzytkownik/oferta/${offer.id}/glos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ typ: vote })
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/oferta/${offer.id}`);
      if (refreshed.ok) setOffer(await refreshed.json());
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !offer) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby komentować'); return; }
    const text = commentText.trim();
    setCommentText('');
    const tempComment: CommentDto = { id: Date.now(), tresc: text, autor: 'Ty', data: new Date().toLocaleString(), parentId: null };
    setComments(prev => [tempComment, ...prev]);
    const res = await fetch(`/api/oferta/${offer.id}/komentarze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tresc: text })
    });
    if (res.ok) {
      setCommentsSkip(0);
      fetchComments(true);
    } else {
      // Revert on failure
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
      alert('Błąd podczas dodawania komentarza');
    }
  };

  const handleAddReply = async (parentId: number) => {
    if (!replyText.trim() || !offer) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby komentować'); return; }
    const text = replyText.trim();
    setReplyText('');
    setReplyParentId(null);
    const tempReply: CommentDto = { id: Date.now(), tresc: text, autor: 'Ty', data: new Date().toLocaleString(), parentId };
    setComments(prev => [tempReply, ...prev]);
    const res = await fetch(`/api/oferta/${offer.id}/komentarze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tresc: text, parentId })
    });
    if (res.ok) {
      setCommentsSkip(0);
      fetchComments(true);
    } else {
      setComments(prev => prev.filter(c => c.id !== tempReply.id));
      alert('Błąd podczas dodawania odpowiedzi');
    }
  };

  const buildTree = (flat: CommentDto[]): CommentNode[] => {
    const map = new Map<number, CommentNode>();
    const roots: CommentNode[] = [];
    flat.forEach(c => { map.set(c.id, { ...c, children: [] }); });
    map.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    const score = (c: CommentNode) => (c.up ?? 0) - (c.down ?? 0);
    const compare = (a: CommentNode, b: CommentNode): number => {
      switch (commentSort) {
        case 'oldest':
          return new Date(a.data).getTime() - new Date(b.data).getTime();
        case 'helpful': // net score desc then newest
          return score(b) - score(a) || new Date(b.data).getTime() - new Date(a.data).getTime();
        case 'best': // up desc then net desc then newest
          return (b.up ?? 0) - (a.up ?? 0) || (score(b) - score(a)) || new Date(b.data).getTime() - new Date(a.data).getTime();
        case 'newest':
        default:
          return new Date(b.data).getTime() - new Date(a.data).getTime();
      }
    };
    const sortNodes = (arr: CommentNode[]) => {
      arr.sort(compare);
      arr.forEach(n => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  };

  const commentTree = buildTree(comments);

  const handleCommentVote = async (commentId: number, vote: 'up' | 'down') => {
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby głosować'); return; }
    // optimistic update
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      let up = c.up || 0; let down = c.down || 0; let userVote = c.userVote || null;
      if (userVote === vote) { // remove vote
        if (vote === 'up') up--; else down--;
        userVote = null;
      } else {
        if (userVote === 'up') up--; else if (userVote === 'down') down--;
        if (vote === 'up') up++; else down++;
        userVote = vote;
      }
      return { ...c, up, down, userVote };
    }));
    const res = await fetch(`/api/oferta/komentarz/${commentId}/glos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ typ: vote })
    });
    if (!res.ok) {
      // revert by refetch
      if (offer) {
        setCommentsSkip(0);
        fetchComments(true);
      }
    } else {
      const data = await res.json();
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, up: data.liczbaUp ?? data.LiczbaUp ?? c.up, down: data.liczbaDown ?? data.LiczbaDown ?? c.down, userVote: data.userVote } : c));
    }
  };

  // Start zgłaszania
  const openReport = (commentId: number) => {
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby zgłosić komentarz'); return; }
    setReportingCommentId(commentId);
  };

  const submitReport = async (reason: string) => {
    if (reportingCommentId === null) return;
    const token = getAuthToken();
    if (!token) { alert('Sesja wygasła – zaloguj się ponownie'); return; }
    setReportLoading(true);
    try {
  const res = await fetch('/api/uzytkownik/zgloszenie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ typ: 'comment', idTresci: reportingCommentId, powod: reason })
      });
      if (res.ok) {
        setReportSuccessFlash('Zgłoszenie wysłane do moderacji');
        setTimeout(()=> setReportSuccessFlash(null), 4000);
        setReportingCommentId(null);
      } else {
        const txt = await res.text();
        alert('Błąd zgłaszania: ' + txt);
      }
    } catch {
      alert('Nie udało się wysłać zgłoszenia');
    } finally {
      setReportLoading(false);
    }
  };

  const renderComments = (nodes: CommentNode[], depth = 0) => (
    nodes.map(c => (
      <div key={c.id} className={`rounded p-3 mb-3 transition-colors ${depth === 0 ? 'bg-gray-50 dark:bg-gray-800 border dark:border-gray-700' : 'bg-white dark:bg-gray-900 border-l-2 dark:border-l-gray-600'} `} style={depth>0?{marginLeft: depth * 16}:{}}>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">{c.autor} • {c.data}</div>
        <div className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line mb-2 transition-colors">{c.tresc}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <button onClick={()=>handleCommentVote(c.id,'up')} className={`px-2 py-0.5 rounded border transition-colors ${c.userVote==='up' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700'}`}>▲ {c.up ?? 0}</button>
            <button onClick={()=>handleCommentVote(c.id,'down')} className={`px-2 py-0.5 rounded border transition-colors ${c.userVote==='down' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700'}`}>▼ {c.down ?? 0}</button>
          </div>
          <button onClick={() => setReplyParentId(replyParentId === c.id ? null : c.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors">{replyParentId === c.id ? 'Anuluj' : 'Odpowiedz'}</button>
          <button onClick={() => openReport(c.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline transition-colors">Zgłoś</button>
        </div>
        {replyParentId === c.id && (
          <div className="mt-2 space-y-2">
            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 text-xs resize-y min-h-[60px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" placeholder="Twoja odpowiedź..." />
            <div className="flex gap-2">
              <button onClick={()=>handleAddReply(c.id)} className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">Wyślij</button>
              <button onClick={()=>{setReplyParentId(null); setReplyText('');}} className="text-xs text-gray-500 dark:text-gray-400 hover:underline transition-colors">Anuluj</button>
            </div>
          </div>
        )}
        {c.children.length>0 && (
          <div className="mt-2">
            {renderComments(c.children, depth+1)}
          </div>
        )}
      </div>
    ))
  );

  if (loading) return <div className="p-4 text-center text-gray-900 dark:text-gray-100">Ładowanie...</div>;
  if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;
  if (!offer) return <div className="p-4 text-center text-gray-900 dark:text-gray-100">Brak danych</div>;

  const temp = offer.votes.hot - offer.votes.cold;
  // Rabat obliczany inline w renderze (usunieto zmienna discount)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        {reportSuccessFlash && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm border border-green-200 dark:border-green-800 shadow">
            {reportSuccessFlash}
          </div>
        )}
        <div className="flex items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"><ArrowLeft className="w-4 h-4 mr-1" /> Wróć</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-colors">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Galeria */}
              <div className="w-full md:w-80 mb-4 md:mb-0">
                {offer.zdjecia && offer.zdjecia.length > 0 ? (
                  <div className="space-y-3">
                    {/* Obraz główny / karuzela */}
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-xl overflow-hidden relative group cursor-zoom-in transition-colors" onClick={() => setLightboxOpen(true)}>
                      {offer.zdjecia.map((z, idx) => {
                        const src = z.startsWith('http') ? z : `http://localhost:5023${z}`;
                        return (
                          <img
                            key={idx}
                            src={src}
                            alt={`${offer.tytul} (${idx+1}/${offer.zdjecia.length})`}
                            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 bg-white dark:bg-gray-800 ${idx === currentImage ? 'opacity-100' : 'opacity-0'}`}
                            draggable={false}
                          />
                        );
                      })}
                      {offer.zdjecia.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCurrentImage(ci => (ci - 1 + offer.zdjecia.length) % offer.zdjecia.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            aria-label="Poprzednie zdjęcie"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentImage(ci => (ci + 1) % offer.zdjecia.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            aria-label="Następne zdjęcie"
                          >
                            ›
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {offer.zdjecia.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentImage(i)}
                                aria-label={`Pokaż zdjęcie ${i+1}`}
                                className={`w-2.5 h-2.5 rounded-full border border-white transition ${i===currentImage ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Miniatury scrollowane */}
                    {offer.zdjecia.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-300">
                        {offer.zdjecia.map((z, i) => {
                          const src = z.startsWith('http') ? z : `http://localhost:5023${z}`;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCurrentImage(i)}
                              className={`relative flex-shrink-0 w-16 h-16 border dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 transition ring-2 ${i===currentImage ? 'ring-custom-blue dark:ring-blue-500' : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'}`}
                            >
                              <img src={src} alt={`miniatura ${i+1}`} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded flex items-center justify-center text-5xl transition-colors">
                    {offer.typ === 'kupon' ? '🎫' : '🛍️'}
                  </div>
                )}
              </div>

              {/* Treść */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 pr-4 leading-tight">{offer.tytul}</h1>
                  <div className="flex flex-col items-center w-20">
                    <div className="w-16 h-16 flex items-center justify-center rounded-lg border dark:border-gray-600 font-bold text-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      {temp}°
                    </div>
                    <div className="flex items-center space-x-1 mt-2">
                      <button onClick={() => handleVote('hot')} className={`px-2 py-1 rounded text-xs flex items-center transition-colors ${offer.userVote==='hot' ? 'bg-red-600 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'}`}><Flame className="w-3 h-3 mr-1" /> {offer.votes.hot}</button>
                      <button onClick={() => handleVote('cold')} className={`px-2 py-1 rounded text-xs flex items-center transition-colors ${offer.userVote==='cold' ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}><Snowflake className="w-3 h-3 mr-1" /> {offer.votes.cold}</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-3 mb-4">
                  {offer.typ === 'kupon' && (
                    <>
                      <span className="bg-purple-600 text-white text-sm font-semibold px-2 py-1 rounded">Kupon</span>
                      <CouponCode code={offer.kod} size="sm" />
                    </>
                  )}
                  {/* Stara cena (jeśli występuje i > aktualnej) */}
                  {offer.cenaPoprzednia && offer.cena && offer.cena > 0 && offer.cenaPoprzednia > offer.cena && (
                    <span className="text-lg line-through text-gray-400 dark:text-gray-500">{offer.cenaPoprzednia} zł</span>
                  )}
                  {/* Nowa cena lub za darmo */}
                  {offer.cena === 0 ? (
                    <span className="text-4xl font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg flex items-center gap-2"><Gift className="w-8 h-8" /> ZA DARMO!</span>
                  ) : offer.cena ? (
                    <span className="text-3xl font-black text-red-600 dark:text-red-400">{offer.cena} zł</span>
                  ) : null}
                  {/* Badge rabatu */}
                  {offer.cenaPoprzednia && offer.cena && offer.cena > 0 && offer.cenaPoprzednia > offer.cena && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                    </span>
                  )}
                </div>

                {/* Duży przycisk do sklepu */}
                {offer.sklep && offer.sklep.trim() ? (
                  <div className="mb-4">
                    <a
                      href={offer.sklep.startsWith('http') ? offer.sklep : `https://${offer.sklep}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Przejdź do sklepu</span>
                    </a>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Brak linku do sklepu.</strong> Ta oferta nie zawiera linku do sklepu.
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors">
                  <span className="mr-4">Kategoria: <strong>{offer.kategoria}</strong></span>
                  <span>Dodane: {offer.dataUtworzenia}</span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-300 whitespace-pre-line mb-6 transition-colors">
                  {offer.opis || 'Brak opisu.'}
                </div>

                {/* Przyciski akcji */}
                <div className="flex items-center space-x-3 mb-6">
                  <button 
                    onClick={handleShare}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> 
                    <span>Udostępnij</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`flex items-center space-x-1 text-sm disabled:opacity-50 transition-colors ${
                      isSaved 
                        ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
                    }`}
                  >
                    <span className={`text-lg ${isSaved ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>⭐</span>
                    <span>{saveLoading ? 'Zapisywanie...' : (isSaved ? 'Zapisane' : 'Zapisz')}</span>
                  </button>
                </div>

                <div className="border-t dark:border-gray-700 pt-4 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Komentarze ({comments.length})</h2>
                    {comments.length>0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 transition-colors">
                        <span>sortowanie:</span>
                        <select value={commentSort} onChange={e=>setCommentSort(e.target.value as any)} className="border dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                          <option value="newest">Najpierw najnowsze</option>
                          <option value="oldest">Najpierw najstarsze</option>
                          <option value="helpful">Najbardziej pomocne</option>
                          <option value="best">Najlepsze komentarze</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    {commentTree.length>0 ? renderComments(commentTree) : <div className="text-sm text-gray-500 dark:text-gray-400">Brak komentarzy.</div>}
                    {comments.length < commentsTotal && (
                      <div className="mt-4">
                        <button onClick={()=>fetchComments(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs text-gray-900 dark:text-gray-100 transition-colors">Załaduj więcej...</button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border dark:border-gray-600 rounded p-2 text-sm resize-y min-h-[80px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" placeholder="Dodaj komentarz..." />
                    <button onClick={handleAddComment} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 self-start transition-colors">Wyślij</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sekcja z podobnymi ofertami */}
        {similarOffers.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 transition-colors">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Podobne oferty
              </h2>
              
              {loadingSimilar ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  Ładowanie podobnych ofert...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {similarOffers.map((similar: any) => {
                    const temperatura = similar.liczbaHot - similar.liczbaCold;
                    return (
                      <Link
                        key={similar.ofertaId}
                        to={`/okazja/${similar.ofertaId}`}
                        className="group bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:shadow-md transition-all border border-gray-200 dark:border-gray-600"
                      >
                        {/* Zdjęcie */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 mb-3">
                          {similar.zdjecia && similar.zdjecia.length > 0 ? (
                            <img
                              src={similar.zdjecia[0]}
                              alt={similar.nazwa}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {similar.typ === 'kupon' ? '🎫' : '🛍️'}
                            </div>
                          )}
                          {/* Badge temperatury */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold ${
                            temperatura > 0 
                              ? 'bg-red-600 text-white' 
                              : temperatura < 0 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }`}>
                            {temperatura > 0 ? '+' : ''}{temperatura}°
                          </div>
                        </div>

                        {/* Tytuł */}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {similar.nazwa}
                        </h3>

                        {/* Cena */}
                        <div className="flex items-center gap-2">
                          {similar.cena !== undefined && (
                            <>
                              {similar.cena === 0 ? (
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">GRATIS</span>
                              ) : (
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {similar.cena} zł
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Sklep */}
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {similar.sklep}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      {/* Modal zgłoszenia komentarza */}
      <ReportCommentModal
        isVisible={reportingCommentId !== null}
        commentId={reportingCommentId}
        onClose={() => !reportLoading && setReportingCommentId(null)}
        onSubmit={submitReport}
        loading={reportLoading}
      />

      {/* Lightbox */}
      {lightboxOpen && offer?.zdjecia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="text-white/80 hover:text-white text-2xl leading-none px-3 py-1"
              aria-label="Zamknij podgląd"
            >×</button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-6 relative select-none">
            {offer.zdjecia.map((z, i) => {
              const src = z.startsWith('http') ? z : `http://localhost:5023${z}`;
              return (
                <img
                  key={i}
                  src={src}
                  alt={offer.tytul + ' powiększone'}
                  className={`max-h-[80vh] max-w-[90vw] object-contain transition-opacity duration-300 ${i===currentImage?'opacity-100':'opacity-0 absolute'}`}
                  draggable={false}
                />
              );
            })}
            {offer.zdjecia.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage(ci => (ci - 1 + offer.zdjecia.length) % offer.zdjecia.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-3xl flex items-center justify-center"
                  aria-label="Poprzednie"
                >‹</button>
                <button
                  onClick={() => setCurrentImage(ci => (ci + 1) % offer.zdjecia.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-3xl flex items-center justify-center"
                  aria-label="Następne"
                >›</button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {offer.zdjecia.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-3 h-3 rounded-full border border-white ${i===currentImage?'bg-white':'bg-white/40 hover:bg-white/70'}`}
                      aria-label={`Zdjęcie ${i+1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

{/* Modal zgłoszenia komentarza */}
{/* Umieszczony poza komponentem eksportowanym? Musi być wewnątrz return głównego komponentu - przeniesiono niżej */}
