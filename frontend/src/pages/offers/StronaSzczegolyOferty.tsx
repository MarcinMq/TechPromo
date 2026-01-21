import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Flame, Snowflake, ArrowLeft, ExternalLink, Share2,
  Clock, MessageSquare, Bookmark, Star,
  ChevronRight, ChevronLeft, Flag,
  ThumbsUp, ThumbsDown, X, Check
} from 'lucide-react';
import KodKuponu from '../../components/KodKuponu';
import ModalZgloszeniaKomentarza from '../../components/modals/ModalZgloszeniaKomentarza';
import { getAuthToken } from '../../utils/auth';

// --- Interfaces ---

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
  waznoscOd?: string;
  waznoscDo?: string;
  votes: { hot: number; cold: number };
  komentarze: number;
  zdjecia: string[];
  userVote?: string | null;
  autorAvatarUrl?: string;
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
  autorAvatarUrl?: string;
}

interface CommentNode extends CommentDto {
  children: CommentNode[];
}

// --- Component ---

export default function StronaSzczegolyOferty() {
  const { id } = useParams();

  // State
  const [offer, setOffer] = useState<OfertaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Comments
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsSkip, setCommentsSkip] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'helpful' | 'best'>('newest');
  const pageSize = 20;

  // Actions
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reporting
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccessFlash, setReportSuccessFlash] = useState<string | null>(null);

  // Recommendations
  const [similarOffers, setSimilarOffers] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // --- Logic ---

  // Initial Load
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Fetch Offer (z tokenem dla userVote)
        const token = getAuthToken();
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`/api/oferta/${id}`, { headers });
        if (!res.ok) throw new Error('Nie znaleziono oferty');
        const data = await res.json();
        setOffer(data);
        setCurrentImage(0);

        // 2. Fetch Comments
        await fetchComments(true);

        // 3. Check if Saved
        await checkIfSaved();

        // 4. Fetch Similar Offers
        await fetchSimilarOffers();

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      const res = await fetch(`/api/rekomendacje/podobne/${id}?limit=5`);
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

  // Actions
  const handleVote = async (vote: 'hot' | 'cold') => {
    if (!offer) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby głosować'); return; }
    if (votingInProgress) return;

    setVotingInProgress(true);
    try {
      const res = await fetch(`/api/uzytkownik/oferta/${offer.id}/glos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ typ: vote })
      });
      if (res.ok) {
        // Odśwież ofertę z tokenem, żeby dostać aktualny userVote
        const refreshed = await fetch(`/api/oferta/${offer.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refreshed.ok) setOffer(await refreshed.json());
      }
    } finally {
      setVotingInProgress(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    const token = getAuthToken();
    if (!token) { alert('Musisz być zalogowany aby zapisać ofertę'); return; }

    try {
      setSaveLoading(true);
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/uzytkownik/zapisane/${id}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      } else {
        alert('Wystąpił błąd podczas akcji.');
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !offer) return;
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby komentować'); return; }

    const text = commentText.trim();
    setCommentText('');

    // Optimistic UI
    const tempComment: CommentDto = { id: Date.now(), tresc: text, autor: 'Ty', data: 'Teraz', parentId: null };
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

    const tempReply: CommentDto = { id: Date.now(), tresc: text, autor: 'Ty', data: 'Teraz', parentId };
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

  const handleCommentVote = async (commentId: number, vote: 'up' | 'down') => {
    const token = getAuthToken();
    if (!token) { alert('Zaloguj się aby głosować'); return; }

    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      let up = c.up || 0, down = c.down || 0, userVote = c.userVote || null;
      if (userVote === vote) {
        if (vote === 'up') up--; else down--;
        userVote = null;
      } else {
        if (userVote === 'up') up--; else if (userVote === 'down') down--;
        if (vote === 'up') up++; else down++;
        userVote = vote;
      }
      return { ...c, up, down, userVote };
    }));

    await fetch(`/api/oferta/komentarz/${commentId}/glos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ typ: vote })
    });
  };

  const submitReport = async (reason: string) => {
    if (reportingCommentId === null) return;
    const token = getAuthToken();
    if (!token) return;

    setReportLoading(true);
    try {
      const res = await fetch('/api/uzytkownik/zgloszenie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ typ: 'comment', idTresci: reportingCommentId, powod: reason })
      });
      if (res.ok) {
        setReportSuccessFlash('Zgłoszenie wysłane');
        setTimeout(() => setReportSuccessFlash(null), 3000);
        setReportingCommentId(null);
      } else {
        alert('Błąd zgłaszania');
      }
    } finally {
      setReportLoading(false);
    }
  };

  // --- Render Helpers ---

  // Build comment tree
  const buildTree = (flat: CommentDto[]): CommentNode[] => {
    const map = new Map<number, CommentNode>();
    const roots: CommentNode[] = [];
    flat.forEach(c => map.set(c.id, { ...c, children: [] }));
    map.forEach(node => {
      if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
      else roots.push(node);
    });

    // Sorting logic here (simplified for brevity)
    return roots.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  };

  const commentTree = buildTree(comments);

  // --- Render ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !offer) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <h2 className="text-2xl font-bold mb-2">Ups, coś poszło nie tak</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">{error || 'Nie znaleziono oferty'}</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Wróć na stronę główną</Link>
    </div>
  );

  const discount = offer.cenaPoprzednia && offer.cena && offer.cenaPoprzednia > offer.cena
    ? Math.round((1 - offer.cena / offer.cenaPoprzednia) * 100)
    : 0;

  const temperature = offer.votes.hot - offer.votes.cold;

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 pb-20">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-blue-600 to-purple-800 dark:from-blue-900 dark:to-purple-900 z-0" />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-8">

        {/* Breadcrumbs / Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Wróć
          </Link>

          {reportSuccessFlash && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
              <Check className="w-4 h-4" /> {reportSuccessFlash}
            </div>
          )}
        </div>

        {/* Offer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

            {/* Left Column: Gallery (5/12) */}
            <div className="lg:col-span-5 bg-gray-50 dark:bg-gray-800/50 p-6 lg:p-8 flex flex-col">

              <div className="relative aspect-square bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-inner mb-4 group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                {offer.zdjecia && offer.zdjecia.length > 0 ? (
                  <img
                    src={offer.zdjecia[currentImage].startsWith('http') ? offer.zdjecia[currentImage] : `http://localhost:5023${offer.zdjecia[currentImage]}`}
                    alt={offer.tytul}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300 dark:text-gray-600">
                    {offer.typ === 'kupon' ? '🎫' : '🛍️'}
                  </div>
                )}

                {/* Image Navigation Overlay (Desktop hover) */}
                {offer.zdjecia && offer.zdjecia.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((c) => (c - 1 + offer.zdjecia.length) % offer.zdjecia.length); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((c) => (c + 1) % offer.zdjecia.length); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {offer.zdjecia && offer.zdjecia.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {offer.zdjecia.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImage ? 'border-blue-500 shadow-lg scale-105 z-10' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={src.startsWith('http') ? src : `http://localhost:5023${src}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Info users (7/12) */}
            <div className="lg:col-span-7 p-6 lg:p-10 flex flex-col">

              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                      {offer.kategoria}
                    </span>
                    {offer.typ === 'kupon' && (
                      <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                        Kupon
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                    {offer.tytul}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <Link to={`/uzytkownik/${offer.autor}`} className="flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold border border-gray-200 dark:border-gray-600">
                        {offer.autorAvatarUrl ? (
                          <img src={offer.autorAvatarUrl.startsWith('http') ? offer.autorAvatarUrl : `http://localhost:5023${offer.autorAvatarUrl}`} alt={offer.autor} className="w-full h-full object-cover" />
                        ) : (
                          offer.autor.charAt(0)
                        )}
                      </div>
                      <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{offer.autor}</span>
                    </Link>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {offer.dataUtworzenia}
                    </span>
                  </div>
                </div>

                {/* Score Big Display */}
                <div className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border-2 ${temperature > 0
                  ? 'border-red-100 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400'
                  : temperature < 0
                    ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400'
                    : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  <span className="text-xs font-bold uppercase tracking-wide opacity-70">Ocena</span>
                  <span className="text-3xl font-black">{temperature}°</span>
                </div>
              </div>

              {/* Pricing & Actions Main Block */}
              <div className="mt-6 mb-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

                  {/* Price */}
                  <div className="flex items-end gap-3">
                    {offer.cena !== undefined && offer.cena !== null ? (
                      <span className={`text-4xl font-black ${offer.cena === 0 ? 'text-green-500' : 'text-red-600 dark:text-red-400'}`}>
                        {offer.cena} zł
                      </span>
                    ) : null}

                    {offer.cenaPoprzednia && (
                      <span className="text-xl text-gray-400 line-through font-medium mb-1">
                        {offer.cenaPoprzednia} zł
                      </span>
                    )}

                    {discount > 0 && (
                      <span className="mb-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs font-bold rounded">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* CTA Button */}
                  {offer.sklep && (
                    <a
                      href={offer.sklep.startsWith('http') ? offer.sklep : `https://${offer.sklep}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      Idź do okazji <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Coupon Code optional */}
                {offer.typ === 'kupon' && offer.kod && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Kod rabatowy:</span>
                      <KodKuponu code={offer.kod} size="md" />
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Actions Bar */}
              <div className="flex flex-wrap items-center gap-4 mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">

                {/* Voting */}
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => handleVote('hot')}
                    disabled={votingInProgress}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 font-bold ${offer.userVote === 'hot'
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                  >
                    <Flame className={offer.userVote === 'hot' ? 'fill-current text-red-600' : 'text-red-500'} size={20} />
                    <span>{offer.votes.hot}</span>
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
                  <button
                    onClick={() => handleVote('cold')}
                    disabled={votingInProgress}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 font-bold ${offer.userVote === 'cold'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                  >
                    <Snowflake className={offer.userVote === 'cold' ? 'fill-current text-blue-600' : 'text-blue-500'} size={20} />
                    <span>{offer.votes.cold}</span>
                  </button>
                </div>

                {/* Save & Share */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-all ${isSaved
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Bookmark className={isSaved ? 'fill-current' : ''} size={18} />
                    <span className="hidden sm:inline">{isSaved ? 'Zapisano' : 'Zapisz'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 font-medium transition-all"
                  >
                    {copiedLink ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
                    <span className="hidden sm:inline">{copiedLink ? 'Skopiowano!' : 'Udostępnij'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Section: Description */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-6 lg:p-10 bg-gray-50/50 dark:bg-gray-800/30">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-1 h-6 bg-blue-500 rounded-full" /> Opis oferty
            </h3>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {offer.opis || 'Brak opisu dla tej oferty.'}
            </div>

            {/* Tags footer */}
            {offer.tagi && offer.tagi.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {offer.tagi.map(tag => (
                  <span key={tag} className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Similar Offers + Comments Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

          {/* Main Column: Comments (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="text-blue-500" />
                  Komentarze <span className="text-gray-400 font-normal">({commentsTotal})</span>
                </h3>
                <select
                  value={commentSort}
                  onChange={e => setCommentSort(e.target.value as any)}
                  className="text-sm border-none bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer"
                >
                  <option value="newest">Najnowsze</option>
                  <option value="oldest">Najstarsze</option>
                  <option value="helpful">Pomocne</option>
                </select>
              </div>

              <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30">
                {/* Add Comment Input */}
                <div className="flex gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    Ty
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Dodaj komentarz..."
                      className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] p-3 transition-all shadow-sm"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Opublikuj
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {commentTree.length > 0 ? commentTree.map(node => (
                    <CommentItem
                      key={node.id}
                      node={node}
                      onVote={handleCommentVote}
                      onReply={handleAddReply}
                      onReport={(id) => setReportingCommentId(id)}
                      replyParentId={replyParentId}
                      setReplyParentId={setReplyParentId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                    />
                  )) : (
                    <div className="text-center py-10 text-gray-500">
                      Brak komentarzy. Bądź pierwszy!
                    </div>
                  )}
                </div>

                {comments.length < commentsTotal && (
                  <button
                    onClick={() => fetchComments(false)}
                    className="w-full mt-6 py-3 text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                  >
                    Załaduj więcej komentarzy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Similar Offers (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Star className="text-yellow-500 fill-current" size={20} />
                Podobne oferty
              </h3>

              {loadingSimilar ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl" />)}
                </div>
              ) : similarOffers.length > 0 ? (
                <div className="space-y-4">
                  {similarOffers.map(sim => (
                    <Link key={sim.id} to={`/okazja/${sim.id}`} className="flex gap-3 group">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {sim.zdjecia?.[0] ? (
                          <img
                            src={sim.zdjecia[0].startsWith('http') ? sim.zdjecia[0] : `http://localhost:5023${sim.zdjecia[0]}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition">
                          {sim.tytul}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {sim.cena ? `${sim.cena} zł` : 'Za darmo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Flame size={12} className="text-gray-400" /> {(sim.votes?.hot || 0) + (sim.votes?.cold || 0)}
                          </span>
                          <span>•</span>
                          <span>{sim.autor}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Brak podobnych ofert.</p>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Lightbox Overlay */}
      {lightboxOpen && offer && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition" onClick={() => setLightboxOpen(false)}>
            <X size={32} />
          </button>

          <img
            src={offer.zdjecia[currentImage].startsWith('http') ? offer.zdjecia[currentImage] : `http://localhost:5023${offer.zdjecia[currentImage]}`}
            className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-sm"
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-8 text-white/50 text-sm">
            Zdjęcie {currentImage + 1} z {offer.zdjecia.length} • Użyj strzałek klawiatury
          </p>

          {/* Lightbox Nav */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition"
            onClick={(e) => { e.stopPropagation(); setCurrentImage((c) => (c - 1 + offer.zdjecia.length) % offer.zdjecia.length); }}
          >
            <ChevronLeft size={48} />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition"
            onClick={(e) => { e.stopPropagation(); setCurrentImage((c) => (c + 1) % offer.zdjecia.length); }}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}

      {/* Modals */}
      <ModalZgloszeniaKomentarza
        isVisible={reportingCommentId !== null}
        commentId={reportingCommentId}
        onClose={() => setReportingCommentId(null)}
        onSubmit={submitReport}
        loading={reportLoading}
      />
    </div>
  );
}

// --- Subcomponent: Recursive Comment Item ---

interface CommentItemProps {
  node: CommentNode;
  onVote: (commentId: number, vote: 'up' | 'down') => Promise<void>;
  onReply: (parentId: number) => Promise<void>;
  onReport: (id: number) => void;
  replyParentId: number | null;
  setReplyParentId: (id: number | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  depth?: number;
}

function CommentItem({ node, onVote, onReply, onReport, replyParentId, setReplyParentId, replyText, setReplyText, depth = 0 }: CommentItemProps) {
  const isReplying = replyParentId === node.id;

  return (
    <div className={`relative ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-gray-700' : ''}`}>
      <div className="flex gap-3 group">
        <Link to={`/uzytkownik/${node.autor}`} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 overflow-hidden ring-2 ring-transparent hover:ring-blue-400 transition-all">
            {node.autorAvatarUrl ? (
              <img src={node.autorAvatarUrl.startsWith('http') ? node.autorAvatarUrl : `http://localhost:5023${node.autorAvatarUrl}`} alt={node.autor} className="w-full h-full object-cover" />
            ) : (
              node.autor.charAt(0)
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-700/50 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700/50 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <Link to={`/uzytkownik/${node.autor}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {node.autor}
              </Link>
              <span className="text-xs text-gray-400">{node.data}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {node.tresc}
            </p>

            {/* Hover Actions Trigger */}
            <button onClick={() => onReport(node.id)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition p-1" title="Zgłoś">
              <Flag size={14} />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-4 mt-1 ml-1 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onVote(node.id, 'up')}
                className={`hover:text-blue-600 flex items-center gap-1 ${node.userVote === 'up' ? 'text-blue-600' : ''}`}
              >
                <ThumbsUp size={12} /> {node.up || 0}
              </button>
              <button
                onClick={() => onVote(node.id, 'down')}
                className={`hover:text-red-600 flex items-center gap-1 ${node.userVote === 'down' ? 'text-red-600' : ''}`}
              >
                <ThumbsDown size={12} /> {node.down || 0}
              </button>
            </div>
            <button onClick={() => setReplyParentId(isReplying ? null : node.id)} className="hover:text-blue-600 transition">
              Odpowiedz
            </button>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 animate-fade-in">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Odpowiedź do @${node.autor}...`}
                className="w-full text-sm p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setReplyParentId(null)} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xs">Anuluj</button>
                <button onClick={() => onReply(node.id)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">Wyślij</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {
        node.children && node.children.length > 0 && (
          <div className="mt-4 space-y-4">
            {node.children.map((child: any) => (
              <CommentItem
                key={child.id}
                node={child}
                depth={depth + 1}
                onVote={onVote}
                onReply={onReply}
                onReport={onReport}
                replyParentId={replyParentId}
                setReplyParentId={setReplyParentId}
                replyText={replyText}
                setReplyText={setReplyText}
              />
            ))}
          </div>
        )
      }
    </div >
  );
}
