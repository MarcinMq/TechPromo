import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, Snowflake, MessageCircle, Share2, Bookmark, ArrowLeft, ExternalLink } from 'lucide-react';
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
      <div key={c.id} className={`rounded p-3 mb-3 ${depth === 0 ? 'bg-gray-50 border' : 'bg-white border-l-2'} `} style={depth>0?{marginLeft: depth * 16}:{}}>
        <div className="text-xs text-gray-500 mb-1">{c.autor} • {c.data}</div>
        <div className="text-sm text-gray-800 whitespace-pre-line mb-2">{c.tresc}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <button onClick={()=>handleCommentVote(c.id,'up')} className={`px-2 py-0.5 rounded border ${c.userVote==='up' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-green-50 text-green-600 border-green-300'}`}>▲ {c.up ?? 0}</button>
            <button onClick={()=>handleCommentVote(c.id,'down')} className={`px-2 py-0.5 rounded border ${c.userVote==='down' ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-red-50 text-red-600 border-red-300'}`}>▼ {c.down ?? 0}</button>
          </div>
          <button onClick={() => setReplyParentId(replyParentId === c.id ? null : c.id)} className="text-xs text-blue-600 hover:underline">{replyParentId === c.id ? 'Anuluj' : 'Odpowiedz'}</button>
          <button onClick={() => openReport(c.id)} className="text-xs text-red-600 hover:underline">Zgłoś</button>
        </div>
        {replyParentId === c.id && (
          <div className="mt-2 space-y-2">
            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} className="w-full border rounded p-2 text-xs resize-y min-h-[60px]" placeholder="Twoja odpowiedź..." />
            <div className="flex gap-2">
              <button onClick={()=>handleAddReply(c.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Wyślij</button>
              <button onClick={()=>{setReplyParentId(null); setReplyText('');}} className="text-xs text-gray-500 hover:underline">Anuluj</button>
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

  if (loading) return <div className="p-4 text-center">Ładowanie...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!offer) return <div className="p-4 text-center">Brak danych</div>;

  const temp = offer.votes.hot - offer.votes.cold;
  // Rabat obliczany inline w renderze (usunieto zmienna discount)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        {reportSuccessFlash && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-green-100 text-green-700 text-sm border border-green-200 shadow">
            {reportSuccessFlash}
          </div>
        )}
        <div className="flex items-center mb-4 text-sm text-gray-600">
          <Link to="/" className="text-blue-600 hover:underline flex items-center"><ArrowLeft className="w-4 h-4 mr-1" /> Wróć</Link>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Galeria */}
              <div className="w-full md:w-80 mb-4 md:mb-0">
                {offer.zdjecia && offer.zdjecia.length > 0 ? (
                  <div className="space-y-3">
                    {/* Obraz główny / karuzela */}
                    <div className="w-full aspect-square bg-gray-100 border rounded-xl overflow-hidden relative group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                      {offer.zdjecia.map((z, idx) => {
                        const src = z.startsWith('http') ? z : `http://localhost:5023${z}`;
                        return (
                          <img
                            key={idx}
                            src={src}
                            alt={`${offer.tytul} (${idx+1}/${offer.zdjecia.length})`}
                            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 bg-white ${idx === currentImage ? 'opacity-100' : 'opacity-0'}`}
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
                              className={`relative flex-shrink-0 w-16 h-16 border rounded-lg overflow-hidden bg-white transition ring-2 ${i===currentImage ? 'ring-custom-blue' : 'ring-transparent hover:ring-gray-300'}`}
                            >
                              <img src={src} alt={`miniatura ${i+1}`} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 border rounded flex items-center justify-center text-5xl">
                    {offer.typ === 'kupon' ? '🎫' : '🛍️'}
                  </div>
                )}
              </div>

              {/* Treść */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 pr-4 leading-tight">{offer.tytul}</h1>
                  <div className="flex flex-col items-center w-20">
                    <div className="w-16 h-16 flex items-center justify-center rounded-lg border font-bold text-lg bg-red-50 text-red-600">
                      {temp}°
                    </div>
                    <div className="flex items-center space-x-1 mt-2">
                      <button onClick={() => handleVote('hot')} className={`px-2 py-1 rounded text-xs flex items-center transition-colors ${offer.userVote==='hot' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}><Flame className="w-3 h-3 mr-1" /> {offer.votes.hot}</button>
                      <button onClick={() => handleVote('cold')} className={`px-2 py-1 rounded text-xs flex items-center transition-colors ${offer.userVote==='cold' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}><Snowflake className="w-3 h-3 mr-1" /> {offer.votes.cold}</button>
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
                  {offer.cenaPoprzednia && offer.cena && offer.cenaPoprzednia > offer.cena && (
                    <span className="text-lg line-through text-gray-400">{offer.cenaPoprzednia} zł</span>
                  )}
                  {/* Nowa cena */}
                  {offer.cena && (
                    <span className="text-3xl font-black text-red-600">{offer.cena} zł</span>
                  )}
                  {/* Badge rabatu */}
                  {offer.cenaPoprzednia && offer.cena && offer.cenaPoprzednia > offer.cena && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)}%
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <span className="mr-4">Kategoria: <strong>{offer.kategoria}</strong></span>
                  <span>Dodane: {offer.dataUtworzenia}</span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line mb-6">
                  {offer.opis || 'Brak opisu.'}
                </div>

                <div className="flex items-center space-x-3 mb-6">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm"><MessageCircle className="w-4 h-4" /> <span>{offer.komentarze}</span></button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm"><Share2 className="w-4 h-4" /> <span>Udostępnij</span></button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm"><Bookmark className="w-4 h-4" /> <span>Zapisz</span></button>
                  {offer.sklep && offer.sklep.startsWith('http') && (
                    <a
                      href={offer.sklep}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-white bg-green-600 hover:bg-green-700 text-sm px-3 py-1 rounded"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Przejdź do sklepu</span>
                    </a>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h2 className="font-semibold">Komentarze ({comments.length})</h2>
                    {comments.length>0 && (
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span>sortowanie:</span>
                        <select value={commentSort} onChange={e=>setCommentSort(e.target.value as any)} className="border rounded px-2 py-1 text-xs bg-white">
                          <option value="newest">Najpierw najnowsze</option>
                          <option value="oldest">Najpierw najstarsze</option>
                          <option value="helpful">Najbardziej pomocne</option>
                          <option value="best">Najlepsze komentarze</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    {commentTree.length>0 ? renderComments(commentTree) : <div className="text-sm text-gray-500">Brak komentarzy.</div>}
                    {comments.length < commentsTotal && (
                      <div className="mt-4">
                        <button onClick={()=>fetchComments(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs">Załaduj więcej...</button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border rounded p-2 text-sm resize-y min-h-[80px]" placeholder="Dodaj komentarz..." />
                    <button onClick={handleAddComment} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 self-start">Wyślij</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
