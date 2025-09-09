import { useEffect, useState } from 'react';
import { getAuthHeaders, isAuthenticated, logout, saveUserSession, getAuthToken } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { authorizedFetch, apiPost, apiPut, apiDelete } from '../../utils/api';
import { MessageCircle, ShoppingBag, BarChart3, Flag, Filter, Flame, Snowflake, Users, Trophy, Clipboard, Trash2, Zap, Check } from 'lucide-react';

type OdznakaData = {
  idOdznaka: number;
  nazwa: string;
  opis: string;
  ikona: string;
  dataPrzyznania: string;
};

type ProfilData = {
  nick: string;
  email: string;
  rola: string;
  punkty: number;
  dataRejestracji: string;
  avatarUrl?: string | null;
  odznaki: OdznakaData[];
};

// Typy przeniesione z Panelu Użytkownika
type Oferta = {
  id: number;
  tytul: string;
  opis: string;
  typ: string; // "okazja" lub "kupon"
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

type Komentarz = {
  id: number;
  tresc: string;
  oferta: string;
  data: string;
  autor: string;
};

const Profil = () => {
  const [data, setData] = useState<ProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nickEdit, setNickEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  // Sekcje przeniesione z Panelu Użytkownika
  const [activeTab, setActiveTab] = useState<'offers' | 'activity' | 'comments' | 'modComments' | 'modOffers' | 'modReports' | 'adminUsers' | 'adminBadges' | 'adminOffers'>('offers');
  const [offers, setOffers] = useState<Oferta[]>([]);
  const [offersSkip, setOffersSkip] = useState(0);
  const [offersHasMore, setOffersHasMore] = useState(false);
  const pageSize = 12;
  const [userActivity, setUserActivity] = useState<Aktywnosc[]>([]);
  const [activitySkip, setActivitySkip] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [userComments, setUserComments] = useState<Komentarz[]>([]);
  const [commentsSkip, setCommentsSkip] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [loadingList, setLoadingList] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'hot' | 'price'>('newest');
  const API_BASE = 'http://localhost:5023';

  // Moderator/Admin data
  type KomentarzModeracja = {
    idKomentarz: number;
    tresc: string;
    dataDodania: string;
    autor: string;
    ofertaTytul: string;
    zgloszen: number;
  };
  type AdminOferta = {
    id: number;
    idOferta: number;
    tytul: string;
    opis: string;
    autor: string;
    kategoria: string;
    dataUtworzenia: string;
    dataDodania: string;
    status: string;
    aktywna: boolean;
    zatwierdzona: boolean;
    cena: number;
    cenaPoprzednia?: number;
    link: string;
    typ?: string;
  };
  type AdminUser = { id: number; nick: string; email: string; punkty: number; dataRejestracji: string; emailConfirmed: boolean; rola: string; };
  type AdminBadge = { idOdznaka: number; nazwa: string; opis: string; ikona: string };

  const [modComments, setModComments] = useState<KomentarzModeracja[]>([]);
  const [modOffers, setModOffers] = useState<AdminOferta[]>([]);
  const [modReports, setModReports] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminBadges, setAdminBadges] = useState<AdminBadge[]>([]);
  const [adminOffers, setAdminOffers] = useState<AdminOferta[]>([]);
  const [newBadge, setNewBadge] = useState({ nazwa: '', opis: '', ikona: '🏆' });

  const handleAvatarChange = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const token = getAuthToken();
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('http://localhost:5023/konto/profil/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  setData(d => d ? { ...d, avatarUrl: json.avatarUrl as string } : d);
  window.dispatchEvent(new Event('profileChanged'));
    } catch (e:any) {
      alert(e.message || 'Nie udało się wgrać zdjęcia');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // === Funkcje i UI przeniesione z Panelu Użytkownika ===
  const fetchOffers = async (reset: boolean = true) => {
    try {
      let url = `${API_BASE}/api/uzytkownik/oferty`;
      const params = new URLSearchParams();
      if (categoryFilter) params.append('kategoria', categoryFilter);
      if (tagFilter) params.append('tag', tagFilter);
      params.append('sortBy', sortBy);
      params.append('skip', reset ? '0' : String(offersSkip));
      params.append('take', String(pageSize));
      if (params.toString()) url += `?${params.toString()}`;
      const res = await authorizedFetch(url);
      if (res.ok) {
        const data = await res.json();
        const items: Oferta[] = data.items ?? data.Items ?? [];
        const total: number = data.total ?? data.Total ?? 0;
        const skip: number = data.skip ?? data.Skip ?? 0;
  // page size from server is optional; we always request pageSize
        if (reset) {
          setOffers(items);
          setOffersSkip(skip + items.length);
        } else {
          setOffers(prev => [...prev, ...items]);
          setOffersSkip(skip + items.length);
        }
        setOffersHasMore(skip + items.length < total);
      } else {
        setMessage('Błąd pobierania ofert');
      }
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };

  const resetAndLoadOffers = () => { setOffersSkip(0); fetchOffers(true); };
  const loadMoreOffers = () => { fetchOffers(false); };

  const fetchUserActivity = async (reset: boolean = true) => {
    try {
      const url = `${API_BASE}/api/uzytkownik/aktywnosc?skip=${reset ? 0 : activitySkip}&take=${pageSize}`;
      const res = await authorizedFetch(url);
      if (res.ok) {
        const data = await res.json();
        const items: Aktywnosc[] = data.items ?? data.Items ?? [];
        const total: number = data.total ?? data.Total ?? 0;
        const skip: number = data.skip ?? data.Skip ?? 0;
        if (reset) {
          setUserActivity(items);
          setActivitySkip(skip + items.length);
        } else {
          setUserActivity(prev => [...prev, ...items]);
          setActivitySkip(skip + items.length);
        }
        setActivityHasMore(skip + items.length < total);
      } else setMessage('Błąd pobierania historii aktywności');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };

  const fetchUserComments = async (reset: boolean = true) => {
    try {
      const url = `${API_BASE}/api/uzytkownik/komentarze?skip=${reset ? 0 : commentsSkip}&take=${pageSize}`;
      const res = await authorizedFetch(url);
      if (res.ok) {
        const data = await res.json();
        const items: Komentarz[] = data.items ?? data.Items ?? [];
        const total: number = data.total ?? data.Total ?? 0;
        const skip: number = data.skip ?? data.Skip ?? 0;
        if (reset) {
          setUserComments(items);
          setCommentsSkip(skip + items.length);
        } else {
          setUserComments(prev => [...prev, ...items]);
          setCommentsSkip(skip + items.length);
        }
        setCommentsHasMore(skip + items.length < total);
      } else setMessage('Błąd pobierania komentarzy');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };

  // === Moderator/Admin fetchers ===
  const fetchModComments = async () => {
    try {
      const res = await authorizedFetch('/moderator/komentarze');
      if (res.ok) setModComments(await res.json()); else setMessage('Błąd pobierania komentarzy');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchModOffers = async () => {
    try {
      const res = await authorizedFetch('/moderator/oferty');
      if (res.ok) setModOffers(await res.json()); else setMessage('Błąd pobierania ofert');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchModReports = async () => {
    try {
      const res = await authorizedFetch('/moderator/zgloszenia');
      if (res.ok) setModReports(await res.json()); else setMessage('Błąd pobierania zgłoszeń');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchAdminUsers = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/admin/uzytkownicy`);
      if (res.ok) setAdminUsers(await res.json()); else setMessage('Błąd pobierania użytkowników');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchAdminBadges = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/admin/odznaki`);
      if (res.ok) setAdminBadges(await res.json()); else setMessage('Błąd pobierania odznak');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchAdminOffers = async () => {
    try {
      const res = await authorizedFetch('/admin/oferty');
      if (res.ok) setAdminOffers(await res.json()); else setMessage('Błąd pobierania ofert');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };
  const fetchAdminReports = async () => {
    try {
      const res = await authorizedFetch('/admin/zgloszenia');
      if (res.ok) setModReports(await res.json()); else setMessage('Błąd pobierania zgłoszeń');
    } catch { setMessage('Błąd połączenia z serwerem'); }
  };

  const voteOffer = async (offerId: number, voteType: 'hot' | 'cold') => {
    setLoadingList(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/glos`, { typ: voteType });
      const text = await res.text();
      setMessage(text);
      if (res.ok) fetchOffers();
    } catch { setMessage('Błąd oddawania głosu'); } finally { setLoadingList(false); }
  };

  const addComment = async (offerId: number, commentText: string) => {
    if (!commentText.trim()) return;
    setLoadingList(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/komentarz`, { tresc: commentText });
      const text = await res.text();
      setMessage(text);
      if (res.ok) fetchOffers();
    } catch { setMessage('Błąd dodawania komentarza'); } finally { setLoadingList(false); }
  };

  const reportContent = async (type: 'offer' | 'comment', contentId: number, reason: string) => {
    setLoadingList(true);
    try {
      const res = await apiPost('/zgloszenia', { typ: type, idTresci: contentId, powod: reason });
      const text = await res.text();
      setMessage(text);
    } catch { setMessage('Błąd zgłaszania treści'); } finally { setLoadingList(false); }
  };

  const deleteOffer = async (offerId: number) => {
    if (!confirm('Na pewno usunąć ofertę? Tej operacji nie można cofnąć.')) return;
    setLoadingList(true);
    try {
      const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/oferta/${offerId}`, { method: 'DELETE' });
      const text = await res.text();
      setMessage(text || (res.ok ? 'Oferta usunięta' : 'Nie udało się usunąć oferty'));
      if (res.ok) setOffers(prev => prev.filter(o => o.id !== offerId));
    } catch { setMessage('Błąd usuwania oferty'); } finally { setLoadingList(false); }
  };

  // === Moderator/Admin actions ===
  const warnComment = async (commentId: number) => {
    const powod = prompt('Podaj powód ostrzeżenia:');
    if (!powod) return;
    setLoadingList(true);
    try {
      const res = await apiPost(`/moderator/komentarz/${commentId}/ostrzez`, { powod });
      const text = await res.text();
      setMessage(res.ok ? 'Ostrzeżenie wysłane' : text);
      if (res.ok) fetchModComments();
    } catch { setMessage('Błąd wysyłania ostrzeżenia'); } finally { setLoadingList(false); }
  };
  const deleteCommentMod = async (commentId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;
    setLoadingList(true);
    try {
      const res = await apiDelete(`/moderator/komentarz/${commentId}`);
      const text = await res.text();
      setMessage(text);
      if (res.ok) fetchModComments();
    } catch { setMessage('Błąd usuwania komentarza'); } finally { setLoadingList(false); }
  };
  const approveOfferMod = async (offerId: number) => {
    setLoadingList(true);
    try { const res = await apiPut(`/moderator/oferta/${offerId}/zatwierdz`, {}); setMessage(await res.text()); if (res.ok) fetchModOffers(); }
    catch { setMessage('Błąd zatwierdzania oferty'); } finally { setLoadingList(false); }
  };
  const rejectOfferMod = async (offerId: number) => {
    const powod = prompt('Podaj powód odrzucenia oferty:'); if (!powod) return;
    setLoadingList(true);
    try { const res = await apiPut(`/moderator/oferta/${offerId}/odrzuc`, { powod }); setMessage(await res.text()); if (res.ok) fetchModOffers(); }
    catch { setMessage('Błąd odrzucania oferty'); } finally { setLoadingList(false); }
  };
  const deleteOfferMod = async (offerId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ofertę?')) return;
    setLoadingList(true);
    try { const res = await apiDelete(`/moderator/oferta/${offerId}`); setMessage(await res.text()); if (res.ok) fetchModOffers(); }
    catch { setMessage('Błąd usuwania oferty'); } finally { setLoadingList(false); }
  };
  const approveReportAdmin = async (reportId: number) => {
    setLoadingList(true);
    try { const res = await apiPut(`/admin/zgloszenie/${reportId}/zatwierdz`, {}); setMessage(await res.text()); if (res.ok) fetchAdminReports(); }
    catch { setMessage('Błąd zatwierdzania zgłoszenia'); } finally { setLoadingList(false); }
  };
  const deleteReportedCommentAdmin = async (commentId: number, reportId: number) => {
    if (!confirm('Usunąć zgłoszony komentarz i zamknąć zgłoszenie?')) return;
    setLoadingList(true);
    try {
      const rep = await apiPut(`/admin/zgloszenie/${reportId}/zatwierdz`, {});
      if (!rep.ok) setMessage('Nie udało się usunąć zgłoszenia');
      const del = await apiDelete(`/moderator/komentarz/${commentId}`);
      setMessage((await del.text()) || 'Komentarz usunięty');
      fetchAdminReports(); fetchModComments();
    } catch { setMessage('Błąd podczas usuwania zgłoszonego komentarza'); } finally { setLoadingList(false); }
  };
  const rejectReportAdmin = async (reportId: number) => {
    setLoadingList(true);
    try { const res = await apiDelete(`/admin/zgloszenie/${reportId}/odrzuc`); setMessage(await res.text()); if (res.ok) fetchAdminReports(); }
    catch { setMessage('Błąd odrzucania zgłoszenia'); } finally { setLoadingList(false); }
  };
  const approveOfferAdmin = async (offerId: number) => {
    setLoadingList(true);
    try { const res = await apiPut(`/admin/oferta/${offerId}/zatwierdz`, {}); setMessage(await res.text()); if (res.ok) fetchAdminOffers(); }
    catch { setMessage('Błąd zatwierdzania oferty'); } finally { setLoadingList(false); }
  };
  const rejectOfferAdmin = async (offerId: number) => {
    const powod = prompt('Podaj powód odrzucenia oferty:'); if (!powod) return;
    setLoadingList(true);
    try { const res = await apiPut(`/admin/oferta/${offerId}/odrzuc`, { powod }); setMessage(await res.text()); if (res.ok) fetchAdminOffers(); }
    catch { setMessage('Błąd odrzucania oferty'); } finally { setLoadingList(false); }
  };
  const deleteOfferAdmin = async (offerId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ofertę?')) return;
    setLoadingList(true);
    try { const res = await apiDelete(`/admin/oferta/${offerId}`); setMessage(await res.text()); if (res.ok) fetchAdminOffers(); }
    catch { setMessage('Błąd usuwania oferty'); } finally { setLoadingList(false); }
  };
  const editOfferAdmin = (offerId: number, typ?: string) => {
    const isKupon = typ === 'kupon'; window.location.href = isKupon ? `/stworz-oferte/kupon?edit=${offerId}` : `/stworz-oferte/okazja?edit=${offerId}`;
  };
  const updateUserPoints = async (userId: number, newPoints: number) => {
    setLoadingList(true);
    try { const res = await apiPut(`/admin/uzytkownik/${userId}/punkty`, { nowePunkty: newPoints }); setMessage(await res.text()); if (res.ok) fetchAdminUsers(); }
    catch { setMessage('Błąd aktualizacji punktów'); } finally { setLoadingList(false); }
  };
  const changeUserRole = async (userId: number, newRole: string) => {
    if (!window.confirm(`Zmienić rolę na "${newRole}"?`)) return;
    setLoadingList(true);
    try { const res = await apiPut(`/admin/uzytkownik/${userId}/rola`, { nowaRola: newRole }); setMessage(await res.text()); if (res.ok) fetchAdminUsers(); }
    catch { setMessage('Błąd zmiany roli użytkownika'); } finally { setLoadingList(false); }
  };
  const createBadge = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingList(true);
    try { const res = await apiPost('/admin/utworz-odznake', newBadge); setMessage(await res.text()); if (res.ok) { setNewBadge({ nazwa:'', opis:'', ikona:'🏆' }); fetchAdminBadges(); } }
    catch { setMessage('Błąd tworzenia odznaki'); } finally { setLoadingList(false); }
  };
  const deleteBadge = async (id: number) => {
    if (!confirm('Usunąć odznakę?')) return;
    setLoadingList(true);
    try { const res = await apiDelete(`/admin/odznaka/${id}`); setMessage(await res.text()); if (res.ok) fetchAdminBadges(); }
    catch { setMessage('Błąd usuwania odznaki'); } finally { setLoadingList(false); }
  };
  const recalcBadgesForUser = async (userId: number) => {
    setLoadingList(true);
    try { const res = await apiPost(`/admin/odznaki/przelicz/${userId}`, {}); setMessage(await res.text()); }
    catch { setMessage('Błąd przeliczania odznak'); } finally { setLoadingList(false); }
  };
  const recalcBadgesForAll = async () => {
    if (!confirm('Przeliczyć odznaki dla wszystkich użytkowników?')) return;
    setLoadingList(true);
    try { const res = await apiPost(`/admin/odznaki/przelicz-wszystkich`, {}); setMessage(await res.text()); }
    catch { setMessage('Błąd przeliczania odznak dla wszystkich'); } finally { setLoadingList(false); }
  };

  useEffect(() => {
    const fetchProfil = async () => {
      // Sprawdź czy użytkownik jest zalogowany
      if (!isAuthenticated()) {
        setErr('Musisz być zalogowany, aby zobaczyć profil!');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5023/konto/profil', {
          headers: getAuthHeaders()
        });
        
        if (res.status === 401) {
          // Token wygasł lub jest nieprawidłowy
          logout();
          setErr('Sesja wygasła. Zaloguj się ponownie.');
          setTimeout(() => navigate('/auth/login'), 2000);
        } else if (!res.ok) {
          setErr('Błąd pobierania danych profilu.');
        } else {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        setErr('Nie udało się połączyć z serwerem.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, [navigate]);

  useEffect(() => {
    // Załaduj sekcje panelu użytkownika
  resetAndLoadOffers();
  fetchUserActivity(true);
  fetchUserComments(true);
    // Moderator/Admin preload
    if (data?.rola === 'Moderator' || data?.rola === 'Admin') {
      fetchModComments();
      fetchModOffers();
      if (data?.rola === 'Admin') {
        fetchAdminUsers();
        fetchAdminBadges();
        fetchAdminOffers();
        fetchAdminReports();
      } else {
        fetchModReports();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.rola]);

  // Re-load offers when filters change
  useEffect(() => {
    resetAndLoadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, tagFilter, sortBy]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const startEdit = () => {
    if (!data) return;
    setNickEdit(data.nick);
    setEmailEdit(data.email);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setPwdCurrent(''); setPwdNew(''); };

  const saveProfile = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const body:any = {};
      if (nickEdit !== data.nick) body.nick = nickEdit;
      if (emailEdit !== data.email) body.email = emailEdit;
      if (pwdNew) { body.hasloAktualne = pwdCurrent; body.hasloNowe = pwdNew; }
      const token = getAuthToken();
      const res = await fetch('http://localhost:5023/konto/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // odśwież localStorage jeśli token wrócił
      if (json.token) {
        saveUserSession({ token: json.token, nick: json.nick, email: json.email, rola: json.rola, punkty: json.punkty });
      }
      setData(d => d ? { ...d, nick: json.nick, email: json.email } : d);
      setEditing(false);
    } catch(e:any) {
      alert(e.message || 'Błąd zapisu profilu');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 text-center">
        <div className="text-2xl mb-4">🔄</div>
        <div className="text-lg font-semibold">Ładowanie profilu...</div>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 text-center">
        <div className="text-2xl mb-4">❌</div>
        <div className="text-lg font-semibold text-red-600">{err}</div>
      </div>
    </div>
  );

  return (
    <div className="py-10 bg-gradient-to-br from-blue-50 to-purple-50/60">
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 backdrop-blur-md shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-2xl border shadow ring-1 ring-black/5" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-white border shadow ring-1 ring-black/5 flex items-center justify-center text-2xl sm:text-3xl font-black text-indigo-600">
                    {(data?.nick?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleAvatarChange(f);}} />
                  <span className="px-2 py-1 text-xs rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700">{uploadingAvatar? 'Wgrywam...' : 'Zmień'}</span>
                </label>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{data?.nick || 'Użytkownik'}</h1>
                  {data?.rola && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">{data.rola}</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600">Dołączył: {data?.dataRejestracji}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold shadow ring-1 ring-emerald-200">{data?.punkty ?? 0} pkt</div>
              <button onClick={startEdit} className="px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold shadow hover:-translate-y-0.5 hover:shadow-lg transition-transform">Edytuj profil</button>
            </div>
          </div>
        </div>

  {/* Quick nav by role removed – wszystko w profilu */}

  {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Account data / form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-3xl border bg-white/80 backdrop-blur-md shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dane konta</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nick</label>
                    <input value={nickEdit} onChange={e=>setNickEdit(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <input value={emailEdit} onChange={e=>setEmailEdit(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Aktualne hasło (jeśli zmieniasz)</label>
                    <input type="password" value={pwdCurrent} onChange={e=>setPwdCurrent(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nowe hasło</label>
                    <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelEdit} type="button" className="flex-1 p-3 rounded-xl border bg-white hover:bg-gray-50">Anuluj</button>
                    <button onClick={saveProfile} disabled={saving} className="flex-1 p-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 hover:shadow-lg transition">{saving? 'Zapisywanie...' : 'Zapisz'}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Nick</span><span className="font-semibold text-gray-900">{data?.nick}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Email</span><span className="text-gray-900">{data?.email}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Rola</span><span className="font-semibold text-indigo-700">{data?.rola}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Punkty</span><span className="font-extrabold text-emerald-600 text-lg">{data?.punkty}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Data rejestracji</span><span className="text-gray-700">{data?.dataRejestracji}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Badges */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-3xl border bg-white/80 backdrop-blur-md shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🏆 Odznaki ({data?.odznaki?.length || 0})</h2>
              </div>
              {data?.odznaki && data.odznaki.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.odznaki.map((odznaka) => (
                    <div
                      key={odznaka.idOdznaka}
                      className="group relative overflow-hidden rounded-2xl border bg-white/70 p-4 hover:shadow-xl transition-all">
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full blur-2xl" />
                      <div className="relative flex items-center gap-4">
                        <div className="text-3xl drop-shadow-sm">{odznaka.ikona || '🏆'}</div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{odznaka.nazwa}</div>
                          <div className="text-xs text-gray-500">{odznaka.dataPrzyznania}</div>
                          <div className="mt-1 text-xs text-gray-600 line-clamp-2" title={odznaka.opis}>{odznaka.opis}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 border-2 border-dashed rounded-2xl bg-white/60">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-gray-700 font-semibold">Brak odznak</div>
                  <div className="text-sm text-gray-500 mt-1">Głosuj i dodawaj oferty, aby je zdobywać!</div>
                </div>
              )}
            </div>
          </div>
        </div>

  {/* Sekcja: funkcje z Panelu Użytkownika */}
        <div className="mt-8 rounded-3xl border bg-white/80 backdrop-blur-md shadow p-6">
          {message && (
            <div className={`p-3 rounded-xl mb-4 text-center font-semibold ${
              message.includes('Błąd') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'offers' ? 'bg-custom-blue text-white' : 'bg-white/60 text-gray-700 border'}`}
              onClick={() => setActiveTab('offers')}
            >
              <ShoppingBag className="w-5 h-5 inline mr-1" /> Moje oferty ({offers.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'activity' ? 'bg-custom-blue text-white' : 'bg-white/60 text-gray-700 border'}`}
              onClick={() => setActiveTab('activity')}
            >
              <BarChart3 className="w-5 h-5 inline mr-1" /> Aktywność ({userActivity.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'comments' ? 'bg-custom-blue text-white' : 'bg-white/60 text-gray-700 border'}`}
              onClick={() => setActiveTab('comments')}
            >
              <MessageCircle className="w-5 h-5 inline mr-1" /> Komentarze ({userComments.length})
            </button>
          </div>

          {(data?.rola === 'Moderator' || data?.rola === 'Admin') && (
            <div className="mt-2 border-t pt-4">
              <div className="text-sm text-gray-600 font-semibold mb-3">Moderacja</div>
              <div className="flex flex-wrap gap-3 mb-6">
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='modComments'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('modComments'); fetchModComments(); }}><MessageCircle className="inline w-4 h-4 mr-1"/>Komentarze ({modComments.length})</button>
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='modOffers'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('modOffers'); fetchModOffers(); }}><ShoppingBag className="inline w-4 h-4 mr-1"/>Oferty</button>
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='modReports'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('modReports'); data?.rola==='Admin'?fetchAdminReports():fetchModReports(); }}><Clipboard className="inline w-4 h-4 mr-1"/>Zgłoszenia</button>
              </div>
            </div>
          )}

          {data?.rola === 'Admin' && (
            <div className="mt-2 border-t pt-4">
              <div className="text-sm text-gray-600 font-semibold mb-3">Administracja</div>
              <div className="flex flex-wrap gap-3 mb-6">
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='adminUsers'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('adminUsers'); fetchAdminUsers(); }}><Users className="inline w-4 h-4 mr-1"/>Użytkownicy ({adminUsers.length})</button>
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='adminBadges'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('adminBadges'); fetchAdminBadges(); }}><Trophy className="inline w-4 h-4 mr-1"/>Odznaki ({adminBadges.length})</button>
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='adminOffers'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('adminOffers'); fetchAdminOffers(); }}><ShoppingBag className="inline w-4 h-4 mr-1"/>Oferty (admin)</button>
                <button className={`px-4 py-2 rounded-2xl ${activeTab==='modReports'?'bg-custom-blue text-white':'bg-white/60 border'}`} onClick={()=>{ setActiveTab('modReports'); fetchAdminReports(); }}><Clipboard className="inline w-4 h-4 mr-1"/>Zgłoszenia</button>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 flex items-center"><Filter className="w-5 h-5 mr-2 text-blue-600" /> Filtry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="p-2 border rounded-xl">
                    <option value="">Wszystkie kategorie</option>
                    <option value="Elektronika">Elektronika</option>
                    <option value="Moda">Moda</option>
                    <option value="Dom i Ogród">Dom i Ogród</option>
                    <option value="Sport">Sport</option>
                    <option value="Książki">Książki</option>
                    <option value="Gry">Gry</option>
                    <option value="Kosmetyki">Kosmetyki</option>
                    <option value="Jedzenie">Jedzenie</option>
                    <option value="Podróże">Podróże</option>
                    <option value="Inne">Inne</option>
                  </select>
                  <input value={tagFilter} onChange={(e)=>setTagFilter(e.target.value)} placeholder="Filtruj po tagach" className="p-2 border rounded-xl" />
                  <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="p-2 border rounded-xl">
                    <option value="newest">Najnowsze</option>
                    <option value="hot">Najgorętsze</option>
                    <option value="price">Najtańsze</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers
                  .filter(offer => (!categoryFilter || offer.kategoria === categoryFilter) && (!tagFilter || offer.tagi.some(t=>t.toLowerCase().includes(tagFilter.toLowerCase()))))
                  .sort((a,b)=> sortBy==='hot' ? (b.votes.hot - b.votes.cold) - (a.votes.hot - a.votes.cold) : sortBy==='price' ? (a.cena||0)-(b.cena||0) : new Date(b.dataUtworzenia).getTime()-new Date(a.dataUtworzenia).getTime())
                  .map(offer => (
                  <div key={offer.id} className="bg-white/60 rounded-2xl p-6 shadow border">
                    <div className="mb-2 flex justify-between items-start">
                      <h4 className="text-lg font-bold text-gray-900">{offer.tytul}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{offer.kategoria}</span>
                    </div>
                    <p className="text-gray-700 mb-3 line-clamp-3">{offer.opis}</p>
                    <div className="mb-3">
                      {offer.zdjecia?.length ? (
                        <div className="flex gap-2">
                          {offer.zdjecia.slice(0,3).map((img,i)=>(
                            <img key={i} src={`${API_BASE}${img}`} alt="zdjęcie" className="w-16 h-16 object-cover rounded border" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                          ))}
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">{offer.typ==='kupon'?'🎫':'🛍️'}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <button className={`px-3 py-1 rounded-full text-sm ${offer.userVote==='hot'?'bg-red-500 text-white':'bg-red-100 text-red-700'}`} onClick={()=>voteOffer(offer.id,'hot')} disabled={loadingList}><Flame className="w-4 h-4 inline mr-1" />{offer.votes.hot}</button>
                        <button className={`px-3 py-1 rounded-full text-sm ${offer.userVote==='cold'?'bg-blue-500 text-white':'bg-blue-100 text-blue-700'}`} onClick={()=>voteOffer(offer.id,'cold')} disabled={loadingList}><Snowflake className="w-4 h-4 inline mr-1" />{offer.votes.cold}</button>
                      </div>
                      <span className="text-sm text-gray-600 flex items-center"><MessageCircle className="w-4 h-4 inline mr-1" /> {offer.komentarze}</span>
                      <button className="text-red-500 text-sm" onClick={()=>{const r=prompt('Powód zgłoszenia:'); if(r) reportContent('offer', offer.id, r);}}>
                        <Flag className="w-4 h-4 inline mr-1" />Zgłoś
                      </button>
                    </div>
                    <input className="w-full p-2 border rounded-xl mb-3" placeholder="Dodaj komentarz..." onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; addComment(offer.id, v); (e.target as HTMLInputElement).value=''; } }} />
                    <div className="text-xs text-gray-500">Dodane: {offer.dataUtworzenia}</div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="px-3 py-1 rounded-xl bg-red-600 text-white text-sm" onClick={()=>deleteOffer(offer.id)} disabled={loadingList}>Usuń</button>
                      <button className="px-3 py-1 rounded-xl bg-custom-blue text-white text-sm" onClick={()=>{const base=offer.typ==='kupon'?'/stworz-oferte/kupon':'/stworz-oferte/okazja'; window.location.href = `${base}?edit=${offer.id}`;}}>Edytuj</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                {offersHasMore ? (
                  <button onClick={loadMoreOffers} disabled={loadingList} className="px-5 py-2 rounded-2xl bg-white/70 border shadow">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-500">To już wszystkie Twoje oferty</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {userActivity.map(a => (
                <div key={a.id} className="bg-white/60 rounded-2xl p-4 shadow border flex items-start gap-3">
                  <div className="text-2xl">
                    {a.typ==='oferta' && '🛍️'}
                    {a.typ==='komentarz' && '💬'}
                    {a.typ==='glos' && '🔥'}
                    {a.typ==='odznaka' && '🏆'}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900">{a.opis}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">{a.data} {a.punkty ? (<span className="text-green-600 font-semibold">+{a.punkty} pkt</span>) : null}</div>
                  </div>
                </div>
              ))}
              {userActivity.length === 0 && (
                <div className="text-center text-gray-600">Brak aktywności</div>
              )}
              <div className="mt-6 flex justify-center">
                {activityHasMore ? (
                  <button onClick={()=>fetchUserActivity(false)} disabled={loadingList} className="px-5 py-2 rounded-2xl bg-white/70 border shadow">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-500">To już wszystko</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {userComments.map(c => (
                <div key={c.id} className="bg-white/60 rounded-2xl p-4 shadow border flex items-start justify-between">
                  <div>
                    <div className="text-gray-900 mb-1">{c.tresc}</div>
                    <div className="text-xs text-gray-500">W ofercie: <strong>{c.oferta}</strong> • {c.data}</div>
                  </div>
                  <button className="text-red-500" onClick={()=>{const r=prompt('Powód zgłoszenia komentarza:'); if(r) reportContent('comment', c.id, r);}}>🚩</button>
                </div>
              ))}
              {userComments.length === 0 && (
                <div className="text-center text-gray-600">Brak komentarzy</div>
              )}
              <div className="mt-6 flex justify-center">
                {commentsHasMore ? (
                  <button onClick={()=>fetchUserComments(false)} disabled={loadingList} className="px-5 py-2 rounded-2xl bg-white/70 border shadow">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-500">To już wszystko</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'modComments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modComments.map(c => (
                <div key={c.idKomentarz} className="bg-white/60 rounded-2xl p-6 shadow border">
                  <h4 className="font-bold mb-2">{c.autor}</h4>
                  <p className="mb-2"><strong>Treść:</strong> {c.tresc}</p>
                  <p className="mb-2"><strong>Oferta:</strong> {c.ofertaTytul}</p>
                  <p className="mb-4 text-sm text-gray-600">{c.dataDodania} {c.zgloszen>0 && (<span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Zgłoszeń: {c.zgloszen}</span>)}</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-yellow-500 text-white" onClick={()=>warnComment(c.idKomentarz)} disabled={loadingList}>Ostrzeż</button>
                    <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>deleteCommentMod(c.idKomentarz)} disabled={loadingList}>Usuń</button>
                  </div>
                </div>
              ))}
              {modComments.length===0 && (<div className="text-center text-gray-600 col-span-full">Brak komentarzy do moderacji</div>)}
            </div>
          )}

          {activeTab === 'modOffers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modOffers.map(o => (
                <div key={o.idOferta} className="bg-white/60 rounded-2xl p-6 shadow border">
                  <div className="flex justify-between items-start mb-2"><h4 className="font-bold">{o.tytul}</h4><span className={`text-xs px-2 py-1 rounded-full ${o.zatwierdzona?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{o.zatwierdzona?'Zatwierdzona':'Oczekuje'}</span></div>
                  <p className="text-sm text-gray-700 mb-2">{o.opis}</p>
                  <p className="text-sm text-gray-500 mb-3">Autor: {o.autor} • {o.dataDodania}</p>
                  <div className="flex flex-wrap gap-2">
                    {!o.zatwierdzona && <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={()=>approveOfferMod(o.idOferta)} disabled={loadingList}><Check className="inline w-4 h-4 mr-1"/>Zatwierdź</button>}
                    <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={()=>{const isKupon=o.typ==='kupon'; window.location.href = isKupon?`/stworz-oferte/kupon?edit=${o.idOferta}`:`/stworz-oferte/okazja?edit=${o.idOferta}`;}} disabled={loadingList}>Edytuj</button>
                    <button className="px-3 py-1 rounded bg-yellow-500 text-white" onClick={()=>rejectOfferMod(o.idOferta)} disabled={loadingList}>Odrzuć</button>
                    <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>deleteOfferMod(o.idOferta)} disabled={loadingList}><Trash2 className="inline w-4 h-4 mr-1"/>Usuń</button>
                  </div>
                </div>
              ))}
              {modOffers.length===0 && (<div className="text-center text-gray-600 col-span-full">Brak ofert do moderacji</div>)}
            </div>
          )}

          {activeTab === 'modReports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modReports.map((r:any) => (
                <div key={r.id} className="bg-white/60 rounded-2xl p-6 shadow border">
                  <div className="text-sm mb-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">#{r.id}</span> Zgłoszenie</div>
                  <div className="mb-3"><strong>Treść:</strong> {r.tresc}</div>
                  <div className="text-sm text-gray-600 mb-3">Zgłoszone przez: {r.zgloszonePrzez} • {r.dataZgloszenia}</div>
                  {data?.rola==='Admin' ? (
                    <div className="flex gap-2">
                      {r.idKomentarz && <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>deleteReportedCommentAdmin(r.idKomentarz, r.id)} disabled={loadingList}>Usuń komentarz i zamknij</button>}
                      <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={()=>approveReportAdmin(r.id)} disabled={loadingList}>Zatwierdź</button>
                      <button className="px-3 py-1 rounded bg-gray-600 text-white" onClick={()=>rejectReportAdmin(r.id)} disabled={loadingList}>Odrzuć</button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Szczegóły do decyzji moderatora</div>
                  )}
                </div>
              ))}
              {modReports.length===0 && (<div className="text-center text-gray-600 col-span-full">Brak zgłoszeń</div>)}
            </div>
          )}

          {activeTab === 'adminUsers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminUsers.map(u => (
                <div key={u.id} className="bg-white/60 rounded-2xl p-6 shadow border">
                  <h4 className="font-bold mb-1">{u.nick}</h4>
                  <div className="text-sm text-gray-600 mb-2">{u.email}</div>
                  <div className="text-sm mb-1">Rola: <span className="font-semibold">{u.rola}</span></div>
                  <div className="text-sm mb-3">Punkty: <span className="font-semibold text-emerald-600">{u.punkty}</span></div>
                  <div className="space-y-2">
                    <input type="number" className="w-full p-2 border rounded" placeholder="Nowe punkty" onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=parseInt((e.target as HTMLInputElement).value); if(!isNaN(v)) updateUserPoints(u.id, v); } }} />
                    <select value={u.rola} onChange={(e)=>changeUserRole(u.id, e.target.value)} className="w-full p-2 border rounded">
                      <option value="Uzytkownik">Uzytkownik</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <button className="w-full px-3 py-2 rounded bg-indigo-600 text-white" onClick={()=>recalcBadgesForUser(u.id)} disabled={loadingList}><Zap className="inline w-4 h-4 mr-1"/>Przelicz odznaki</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'adminBadges' && (
            <div>
              <form onSubmit={createBadge} className="bg-white/60 p-4 rounded-xl shadow border mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={newBadge.nazwa} onChange={e=>setNewBadge({...newBadge, nazwa:e.target.value})} placeholder="Nazwa" className="p-2 border rounded" required />
                <input value={newBadge.opis} onChange={e=>setNewBadge({...newBadge, opis:e.target.value})} placeholder="Opis" className="p-2 border rounded" required />
                <input value={newBadge.ikona} onChange={e=>setNewBadge({...newBadge, ikona:e.target.value})} placeholder="Ikona" className="p-2 border rounded" />
                <button type="submit" className="px-3 py-2 rounded bg-custom-blue text-white">Utwórz</button>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminBadges.map(b => (
                  <div key={b.idOdznaka} className="bg-white/60 p-6 rounded-2xl shadow border text-center">
                    <div className="text-4xl mb-2">{b.ikona}</div>
                    <div className="font-bold">{b.nazwa}</div>
                    <div className="text-sm text-gray-600 mb-3">{b.opis}</div>
                    <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>deleteBadge(b.idOdznaka)}><Trash2 className="inline w-4 h-4 mr-1"/>Usuń</button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={recalcBadgesForAll}><Zap className="inline w-4 h-4 mr-1"/>Przelicz wszystkim</button>
              </div>
            </div>
          )}

          {activeTab === 'adminOffers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminOffers.map(offer => (
                <div key={offer.id} className="bg-white/60 rounded-2xl p-6 shadow border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">{offer.tytul}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${offer.zatwierdzona?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{offer.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{offer.opis}</p>
                  <p className="text-sm text-gray-500 mb-3">Autor: {offer.autor} • {offer.dataUtworzenia}</p>
                  <div className="flex flex-wrap gap-2">
                    {!offer.zatwierdzona && <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={()=>approveOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}><Check className="inline w-4 h-4 mr-1"/>Zatwierdź</button>}
                    <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={()=>editOfferAdmin(offer.idOferta ?? offer.id, offer.typ)} disabled={loadingList}>Edytuj</button>
                    <button className="px-3 py-1 rounded bg-yellow-500 text-white" onClick={()=>rejectOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}>Odrzuć</button>
                    <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>deleteOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}><Trash2 className="inline w-4 h-4 mr-1"/>Usuń</button>
                  </div>
                </div>
              ))}
              {adminOffers.length===0 && (<div className="text-center text-gray-600 col-span-full">Brak ofert</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profil;
