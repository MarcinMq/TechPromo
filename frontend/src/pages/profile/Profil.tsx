import { useEffect, useState } from 'react';
import { getAuthHeaders, isAuthenticated, logout, saveUserSession, getAuthToken } from '../../utils/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { authorizedFetch, apiPost, apiPut, apiDelete } from '../../utils/api';
import { MessageCircle, ShoppingBag, BarChart3, Flag, Flame, Snowflake, Trash2, Zap, Check, Shield, Settings, AlertTriangle, BookmarkCheck, Eye, UserCog, Award, FileText } from 'lucide-react';

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
  const location = useLocation();

  // Sekcje przeniesione z Panelu Użytkownika
  const [activeTab, setActiveTab] = useState<'offers' | 'activity' | 'comments' | 'zapisane' | 'modComments' | 'modOffers' | 'modReports' | 'adminUsers' | 'adminBadges' | 'adminOffers'>('offers');
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
  const [savedOffers, setSavedOffers] = useState<Oferta[]>([]);
  const [savedOffersSkip, setSavedOffersSkip] = useState(0);
  const [savedOffersHasMore, setSavedOffersHasMore] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [loadingList, setLoadingList] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
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

  const fetchSavedOffers = async (reset: boolean = true) => {
    try {
      const url = `${API_BASE}/api/uzytkownik/zapisane?skip=${reset ? 0 : savedOffersSkip}&take=${pageSize}`;
      const res = await authorizedFetch(url);
      if (res.ok) {
        const data = await res.json();
        const items: Oferta[] = data.items ?? data.Items ?? [];
        const total: number = data.total ?? data.Total ?? 0;
        const skip: number = data.skip ?? data.Skip ?? 0;
        if (reset) {
          setSavedOffers(items);
          setSavedOffersSkip(skip + items.length);
        } else {
          setSavedOffers(prev => [...prev, ...items]);
          setSavedOffersSkip(skip + items.length);
        }
        setSavedOffersHasMore(skip + items.length < total);
      } else setMessage('Błąd pobierania zapisanych ofert');
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

  const recalcPointsForAll = async () => {
    if (!confirm('Przeliczyć punkty dla wszystkich użytkowników?\n\nPunkty będą obliczone na podstawie:\n- 10 pkt za ofertę\n- 2 pkt za komentarz\n- 1 pkt za głos\n- 50 pkt za odznakę')) return;
    setLoadingList(true);
    try { 
      const res = await apiPost(`/admin/punkty/przelicz-wszystkich`, {}); 
      const data = await res.json();
      setMessage(`Przeliczono punkty dla ${data.przeliczono} użytkowników`);
      // Odśwież listę użytkowników
      fetchAdminUsers();
    }
    catch { setMessage('Błąd przeliczania punktów'); } finally { setLoadingList(false); }
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

  // Obsługa navigation state dla automatycznego przełączenia zakładki
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      const tab = (location.state as any).activeTab;
      setActiveTab(tab);
      // Załaduj dane dla odpowiedniej zakładki
      if (tab === 'zapisane') {
        fetchSavedOffers();
      }
    }
  }, [location.state]);

  // Re-load offers when filters change
  useEffect(() => {
    resetAndLoadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, sortBy]);

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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-center transition-colors">
        <div className="text-4xl mb-4 animate-pulse">🔄</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Ładowanie profilu...</div>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 text-center transition-colors">
        <div className="text-4xl mb-4">❌</div>
        <div className="text-xl font-bold text-red-600 dark:text-red-400">{err}</div>
      </div>
    </div>
  );

  return (
    <div className="py-10 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-20 lg:pb-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Header */}
        <div className="overflow-hidden rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-blue-600 dark:bg-blue-700 border-2 border-gray-300 dark:border-gray-600 shadow-md flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                    {(data?.nick?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleAvatarChange(f);}} />
                  <span className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 dark:bg-blue-700 text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-105 transition-all font-bold">
                    {uploadingAvatar? '⏳' : '📷'}
                  </span>
                </label>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{data?.nick || 'Użytkownik'}</h1>
                  {data?.rola && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 dark:bg-blue-700 text-white shadow-sm transition-colors">
                      {data.rola}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">Dołączył: {data?.dataRejestracji}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-5 py-2.5 rounded-lg bg-green-600 dark:bg-green-700 text-white font-bold shadow-sm text-lg transition-colors">
                <Zap className="inline w-5 h-5 mr-1" />
                {data?.punkty ?? 0} pkt
              </div>
              <button 
                onClick={startEdit} 
                className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border dark:border-gray-600 text-gray-900 dark:text-gray-100 font-bold shadow-sm hover:shadow-md transition-all"
              >
                ⚙️ Edytuj
              </button>
            </div>
          </div>
        </div>

  {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Account data / form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">📋 Dane konta</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">Nick</label>
                    <input value={nickEdit} onChange={e=>setNickEdit(e.target.value)} className="mt-1 w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">Email</label>
                    <input value={emailEdit} onChange={e=>setEmailEdit(e.target.value)} className="mt-1 w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">Aktualne hasło (jeśli zmieniasz)</label>
                    <input type="password" value={pwdCurrent} onChange={e=>setPwdCurrent(e.target.value)} className="mt-1 w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">Nowe hasło</label>
                    <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="mt-1 w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelEdit} type="button" className="flex-1 p-3 rounded-lg border dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-semibold">Anuluj</button>
                    <button onClick={saveProfile} disabled={saving} className="flex-1 p-3 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-bold disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm hover:shadow-md transition-all">{saving? 'Zapisywanie...' : '💾 Zapisz'}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors"><span className="text-gray-600 dark:text-gray-400">Nick</span><span className="font-semibold text-gray-900 dark:text-gray-100">{data?.nick}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors"><span className="text-gray-600 dark:text-gray-400">Email</span><span className="text-gray-900 dark:text-gray-100">{data?.email}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors"><span className="text-gray-600 dark:text-gray-400">Rola</span><span className="font-semibold text-blue-600 dark:text-blue-400">{data?.rola}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors"><span className="text-gray-600 dark:text-gray-400">Punkty</span><span className="font-bold text-green-600 dark:text-green-400 text-lg">{data?.punkty}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors"><span className="text-gray-600 dark:text-gray-400">Data rejestracji</span><span className="text-gray-900 dark:text-gray-100">{data?.dataRejestracji}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Badges */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">🏆 Odznaki ({data?.odznaki?.length || 0})</h2>
              </div>
              {data?.odznaki && data.odznaki.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.odznaki.map((odznaka) => (
                    <div
                      key={odznaka.idOdznaka}
                      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{odznaka.ikona || '🏆'}</div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-gray-100 transition-colors">{odznaka.nazwa}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors">{odznaka.dataPrzyznania}</div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 transition-colors" title={odznaka.opis}>{odznaka.opis}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 transition-colors">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-gray-900 dark:text-gray-100 font-semibold transition-colors">Brak odznak</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">Głosuj i dodawaj oferty, aby je zdobywać!</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Powiadomienia */}
        {message && (
          <div className={`mt-6 p-3 rounded-lg text-center font-medium text-sm ${
            message.includes('Błąd') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Panel z nawigacją boczną */}
        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Nawigacja */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4">
              {/* Sekcja użytkownika */}
              <div className="px-4 py-3 bg-blue-200 dark:bg-blue-700 border-b border-blue-300 dark:border-blue-600">
                <span className="text-sm font-bold text-blue-900 dark:text-white uppercase">Twoje konto</span>
              </div>
              <nav>
                <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'offers' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <ShoppingBag className="w-5 h-5" /> Moje oferty <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{offers.length}</span>
                </button>
                <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'activity' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <BarChart3 className="w-5 h-5" /> Aktywność <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{userActivity.length}</span>
                </button>
                <button onClick={() => setActiveTab('comments')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'comments' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <MessageCircle className="w-5 h-5" /> Komentarze <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{userComments.length}</span>
                </button>
                <button onClick={() => { setActiveTab('zapisane'); fetchSavedOffers(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${activeTab === 'zapisane' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <BookmarkCheck className="w-5 h-5" /> Zapisane <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{savedOffers.length}</span>
                </button>
              </nav>

              {/* Sekcja moderatora */}
              {(data?.rola === 'Moderator' || data?.rola === 'Admin') && (
                <>
                  <div className="px-4 py-3 bg-yellow-300 dark:bg-yellow-700 border-y border-yellow-400 dark:border-yellow-600">
                    <span className="text-sm font-bold text-yellow-900 dark:text-white uppercase flex items-center gap-1"><Shield className="w-4 h-4" /> Moderacja</span>
                  </div>
                  <nav>
                    <button onClick={()=>{ setActiveTab('modComments'); fetchModComments(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'modComments' ? 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <MessageCircle className="w-5 h-5" /> Komentarze <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{modComments.length}</span>
                    </button>
                    <button onClick={()=>{ setActiveTab('modOffers'); fetchModOffers(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${data?.rola !== 'Admin' ? 'border-b border-gray-100 dark:border-gray-700' : ''} ${activeTab === 'modOffers' ? 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <Eye className="w-5 h-5" /> Oferty <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{modOffers.filter(o => !o.zatwierdzona).length}</span>
                    </button>
                    {data?.rola !== 'Admin' && (
                      <button onClick={()=>{ setActiveTab('modReports'); fetchModReports(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${activeTab === 'modReports' ? 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        <AlertTriangle className="w-5 h-5" /> Zgłoszenia {modReports.length > 0 && <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">{modReports.length}</span>}
                      </button>
                    )}
                  </nav>
                </>
              )}

              {/* Sekcja admina */}
              {data?.rola === 'Admin' && (
                <>
                  <div className="px-4 py-3 bg-red-300 dark:bg-red-700 border-y border-red-400 dark:border-red-600">
                    <span className="text-sm font-bold text-red-900 dark:text-white uppercase flex items-center gap-1"><Settings className="w-4 h-4" /> Administracja</span>
                  </div>
                  <nav>
                    <button onClick={()=>{ setActiveTab('adminUsers'); fetchAdminUsers(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'adminUsers' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <UserCog className="w-5 h-5" /> Użytkownicy <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{adminUsers.length}</span>
                    </button>
                    <button onClick={()=>{ setActiveTab('adminBadges'); fetchAdminBadges(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'adminBadges' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <Award className="w-5 h-5" /> Odznaki <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{adminBadges.length}</span>
                    </button>
                    <button onClick={()=>{ setActiveTab('adminOffers'); fetchAdminOffers(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 ${activeTab === 'adminOffers' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <FileText className="w-5 h-5" /> Oferty <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{adminOffers.length}</span>
                    </button>
                    <button onClick={()=>{ setActiveTab('modReports'); fetchAdminReports(); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${activeTab === 'modReports' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <AlertTriangle className="w-5 h-5" /> Zgłoszenia {modReports.length > 0 && <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">{modReports.length}</span>}
                    </button>
                  </nav>
                </>
              )}
            </div>
          </div>

          {/* Główna zawartość */}
          <div className="flex-1 min-w-0">
            <div className={`rounded-lg border p-6 ${
              activeTab.startsWith('admin') || (activeTab === 'modReports' && data?.rola === 'Admin') 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                : (activeTab === 'modComments' || activeTab === 'modOffers' || (activeTab === 'modReports' && data?.rola !== 'Admin'))
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>

          {activeTab === 'offers' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Moje oferty</h3>
              
              <div className="mb-4 flex flex-wrap gap-2">
                <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
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
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <option value="newest">Najnowsze</option>
                  <option value="hot">Najgorętsze</option>
                  <option value="price">Najtańsze</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                  <div key={offer.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-2 flex justify-between items-start">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">{offer.tytul}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-600 dark:bg-blue-700 text-white transition-colors">{offer.kategoria}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 transition-colors">{offer.opis}</p>
                    <div className="mb-3">
                      {offer.zdjecia?.length ? (
                        <div className="flex gap-2">
                          {offer.zdjecia.slice(0,3).map((img,i)=>(
                            <img key={i} src={`${API_BASE}${img}`} alt="zdjęcie" className="w-16 h-16 object-cover rounded border dark:border-gray-600 transition-colors" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                          ))}
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center transition-colors">{offer.typ==='kupon'?'🎫':'🛍️'}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <button className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${offer.userVote==='hot'?'bg-red-600 dark:bg-red-700 text-white shadow-sm':'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'}`} onClick={()=>voteOffer(offer.id,'hot')} disabled={loadingList}><Flame className="w-4 h-4 inline mr-1" />{offer.votes.hot}</button>
                        <button className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${offer.userVote==='cold'?'bg-blue-600 dark:bg-blue-700 text-white shadow-sm':'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`} onClick={()=>voteOffer(offer.id,'cold')} disabled={loadingList}><Snowflake className="w-4 h-4 inline mr-1" />{offer.votes.cold}</button>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center transition-colors"><MessageCircle className="w-4 h-4 inline mr-1" /> {offer.komentarze}</span>
                      <button className="text-red-500 dark:text-red-400 text-sm hover:text-red-700 dark:hover:text-red-300 transition-colors" onClick={()=>{const r=prompt('Powód zgłoszenia:'); if(r) reportContent('offer', offer.id, r);}}>
                        <Flag className="w-4 h-4 inline mr-1" />Zgłoś
                      </button>
                    </div>
                    <input className="w-full p-2 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="Dodaj komentarz..." onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; addComment(offer.id, v); (e.target as HTMLInputElement).value=''; } }} />
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Dodane: {offer.dataUtworzenia}</div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="px-3 py-1 rounded-lg bg-red-600 dark:bg-red-700 text-white text-sm hover:bg-red-700 dark:hover:bg-red-600 shadow-sm transition-all" onClick={()=>deleteOffer(offer.id)} disabled={loadingList}>Usuń</button>
                      <button className="px-3 py-1 rounded-lg bg-blue-600 dark:bg-blue-700 text-white text-sm hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm transition-all" onClick={()=>{const base=offer.typ==='kupon'?'/stworz-oferte/kupon':'/stworz-oferte/okazja'; window.location.href = `${base}?edit=${offer.id}`;}}>Edytuj</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                {offersHasMore ? (
                  <button onClick={loadMoreOffers} disabled={loadingList} className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm transition-all">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">To już wszystkie Twoje oferty</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Historia aktywności</h3>
              {userActivity.map(a => (
                <div key={a.id} className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-3">
                  <div className="text-2xl">
                    {a.typ==='oferta' && '🛍️'}
                    {a.typ==='komentarz' && '💬'}
                    {a.typ==='glos' && '🔥'}
                    {a.typ==='odznaka' && '🏆'}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 dark:text-gray-100 transition-colors">{a.opis}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 transition-colors">{a.data} {a.punkty ? (<span className="text-green-600 dark:text-green-400 font-semibold transition-colors">+{a.punkty} pkt</span>) : null}</div>
                  </div>
                </div>
              ))}
              {userActivity.length === 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400 transition-colors">Brak aktywności</div>
              )}
              <div className="mt-6 flex justify-center">
                {activityHasMore ? (
                  <button onClick={()=>fetchUserActivity(false)} disabled={loadingList} className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm transition-all">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">To już wszystko</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Twoje komentarze</h3>
              {userComments.map(c => (
                <div key={c.id} className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between">
                  <div>
                    <div className="text-gray-900 dark:text-gray-100 mb-1 transition-colors">{c.tresc}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">W ofercie: <strong className="text-gray-700 dark:text-gray-300">{c.oferta}</strong> • {c.data}</div>
                  </div>
                  <button className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition" onClick={()=>{const r=prompt('Powód zgłoszenia komentarza:'); if(r) reportContent('comment', c.id, r);}}>🚩</button>
                </div>
              ))}
              {userComments.length === 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400 transition-colors">Brak komentarzy</div>
              )}
              <div className="mt-6 flex justify-center">
                {commentsHasMore ? (
                  <button onClick={()=>fetchUserComments(false)} disabled={loadingList} className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm transition-all">Załaduj kolejne</button>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">To już wszystko</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'zapisane' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Zapisane oferty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedOffers.map(offer => (
                  <div key={offer.id} className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-2 flex justify-between items-start">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">{offer.tytul}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-600 dark:bg-blue-700 text-white transition-colors">{offer.kategoria}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 transition-colors">{offer.opis}</p>
                    
                    {offer.cena && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl font-bold text-green-600 dark:text-green-400 transition-colors">{offer.cena}zł</span>
                        {offer.cenaPoprzednia && (
                          <span className="text-sm line-through text-gray-500 dark:text-gray-400 transition-colors">{offer.cenaPoprzednia}zł</span>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      {offer.zdjecia?.length ? (
                        <div className="flex gap-2">
                          {offer.zdjecia.slice(0,3).map((img,i)=>(
                            <img key={i} src={`${API_BASE}${img}`} alt="zdjęcie" className="w-16 h-16 object-cover rounded border dark:border-gray-600 transition-colors" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                          ))}
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center transition-colors">{offer.typ==='kupon'?'🎫':'🛍️'}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors"><Flame className="w-4 h-4 inline mr-1" />{offer.votes.hot}</span>
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-colors"><Snowflake className="w-4 h-4 inline mr-1" />{offer.votes.cold}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center transition-colors"><MessageCircle className="w-4 h-4 inline mr-1" /> {offer.komentarze}</span>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 transition-colors">Autor: {offer.autor} • {offer.dataUtworzenia}</div>
                    
                    <div className="mt-3 flex justify-between gap-2">
                      <button 
                        className="px-4 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white text-sm flex-1 hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        onClick={() => {
                          const link = offer.sklep;
                          const url = link.startsWith('http') ? link : `https://${link}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Przejdź do sklepu
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 text-white text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                        onClick={async () => {
                          try {
                            const res = await authorizedFetch(`${API_BASE}/api/uzytkownik/zapisane/${offer.id}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) {
                              setSavedOffers(prev => prev.filter(o => o.id !== offer.id));
                            } else {
                              setMessage('Błąd podczas usuwania z zapisanych');
                            }
                          } catch {
                            setMessage('Błąd połączenia z serwerem');
                          }
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {savedOffers.length === 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400 py-8 transition-colors">
                  <Check className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors">Brak zapisanych ofert</h3>
                  <p className="text-sm">Zapisane oferty będą wyświetlane tutaj</p>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                {savedOffersHasMore ? (
                  <button onClick={() => fetchSavedOffers(false)} disabled={loadingList} className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm transition-all">Załaduj kolejne</button>
                ) : savedOffers.length > 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">To już wszystkie zapisane oferty</div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === 'modComments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Komentarze do moderacji</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{modComments.length} komentarzy</span>
              </div>
              <div className="space-y-3">
                {modComments.map(c => (
                  <div key={c.idKomentarz} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{c.autor}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{c.dataDodania}</span>
                          {c.zgloszen > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{c.zgloszen} zgł.</span>}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{c.tresc}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Oferta: {c.ofertaTytul || '-'}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600" onClick={()=>warnComment(c.idKomentarz)} disabled={loadingList}>Ostrzeż</button>
                        <button className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>deleteCommentMod(c.idKomentarz)} disabled={loadingList}>Usuń</button>
                      </div>
                    </div>
                  </div>
                ))}
                {modComments.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak komentarzy do moderacji</div>}
              </div>
            </div>
          )}

          {activeTab === 'modOffers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Oferty do zatwierdzenia</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{modOffers.filter(o => !o.zatwierdzona).length} oczekujących</span>
              </div>
              <div className="space-y-3">
                {modOffers.map(o => (
                  <div key={o.idOferta} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{o.tytul}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${o.zatwierdzona ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>{o.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{o.opis}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Autor: {o.autor} • {o.dataDodania}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        {!o.zatwierdzona && <button className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" onClick={()=>approveOfferMod(o.idOferta)} disabled={loadingList}>Zatwierdź</button>}
                        <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" onClick={()=>{const isKupon=o.typ==='kupon'; window.location.href = isKupon?`/stworz-oferte/kupon?edit=${o.idOferta}`:`/stworz-oferte/okazja?edit=${o.idOferta}`;}} disabled={loadingList}>Edytuj</button>
                        <button className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600" onClick={()=>rejectOfferMod(o.idOferta)} disabled={loadingList}>Odrzuć</button>
                        <button className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>deleteOfferMod(o.idOferta)} disabled={loadingList}>Usuń</button>
                      </div>
                    </div>
                  </div>
                ))}
                {modOffers.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak ofert do moderacji</div>}
              </div>
            </div>
          )}

          {activeTab === 'modReports' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Zgłoszenia</h3>
                {modReports.length > 0 && <span className="text-sm text-red-500 font-medium">{modReports.length} do rozpatrzenia</span>}
              </div>
              <div className="space-y-3">
                {modReports.map((r:any) => (
                  <div key={r.idZgloszenie || r.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">#{r.idZgloszenie || r.id}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{r.dataZgloszenia}</span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">{r.tresc}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Zgłosił: {r.zgloszonePrzez}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {(data?.rola==='Admin' || data?.rola==='Moderator') ? (
                          <>
                            {r.idKomentarz && <button className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>deleteReportedCommentAdmin(r.idKomentarz, r.idZgloszenie || r.id)} disabled={loadingList}>Usuń kom.</button>}
                            {r.idOferta && <button className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>deleteOfferMod(r.idOferta)} disabled={loadingList}>Usuń ofertę</button>}
                            <button className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" onClick={()=>approveReportAdmin(r.idZgloszenie || r.id)} disabled={loadingList}>Zatwierdź</button>
                            <button className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700" onClick={()=>rejectReportAdmin(r.idZgloszenie || r.id)} disabled={loadingList}>Odrzuć</button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Brak akcji</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {modReports.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak zgłoszeń</div>}
              </div>
            </div>
          )}

          {activeTab === 'adminUsers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Zarządzanie użytkownikami</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{adminUsers.length} użytkowników</span>
              </div>
              <div className="space-y-3">
                {adminUsers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{u.nick}</span>
                          <span className={`text-xs ${u.emailConfirmed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{u.emailConfirmed ? '✓' : '✗'}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={u.rola} onChange={(e)=>changeUserRole(u.id, e.target.value)} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded">
                          <option value="Uzytkownik">Użytkownik</option>
                          <option value="Moderator">Moderator</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Pkt:</span>
                          <input type="number" defaultValue={u.punkty} className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=parseInt((e.target as HTMLInputElement).value); if(!isNaN(v)) updateUserPoints(u.id, v); } }} />
                        </div>
                        <button className="px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/40" onClick={()=>recalcBadgesForUser(u.id)} disabled={loadingList}>Przelicz</button>
                      </div>
                    </div>
                  </div>
                ))}
                {adminUsers.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak użytkowników</div>}
              </div>
            </div>
          )}

          {activeTab === 'adminBadges' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Zarządzanie odznakami</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700" onClick={recalcPointsForAll}>Przelicz punkty</button>
                  <button className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={recalcBadgesForAll}>Przelicz odznaki</button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Nowa odznaka</h4>
                <form onSubmit={createBadge} className="flex flex-wrap gap-2">
                  <input value={newBadge.nazwa} onChange={e=>setNewBadge({...newBadge, nazwa:e.target.value})} placeholder="Nazwa" className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" required />
                  <input value={newBadge.opis} onChange={e=>setNewBadge({...newBadge, opis:e.target.value})} placeholder="Opis" className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" required />
                  <input value={newBadge.ikona} onChange={e=>setNewBadge({...newBadge, ikona:e.target.value})} placeholder="🏆" className="w-16 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-center" />
                  <button type="submit" className="px-4 py-2 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600">Utwórz</button>
                </form>
              </div>
              
              <div className="space-y-2">
                {adminBadges.map(b => (
                  <div key={b.idOdznaka} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <span className="text-2xl">{b.ikona}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{b.nazwa}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{b.opis}</p>
                    </div>
                    <button className="p-1.5 rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={()=>deleteBadge(b.idOdznaka)}><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
                {adminBadges.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak odznak</div>}
              </div>
            </div>
          )}

          {activeTab === 'adminOffers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wszystkie oferty</h3>
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600 dark:text-green-400">{adminOffers.filter(o => o.zatwierdzona).length} zatwierdzonych</span>
                  <span className="text-yellow-600 dark:text-yellow-400">{adminOffers.filter(o => !o.zatwierdzona).length} oczekujących</span>
                </div>
              </div>
              <div className="space-y-3">
                {adminOffers.map(offer => (
                  <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{offer.tytul}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${offer.zatwierdzona ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>{offer.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{offer.opis}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Autor: {offer.autor} • {offer.dataUtworzenia}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        {!offer.zatwierdzona && <button className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" onClick={()=>approveOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}>Zatwierdź</button>}
                        <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" onClick={()=>editOfferAdmin(offer.idOferta ?? offer.id, offer.typ)} disabled={loadingList}>Edytuj</button>
                        <button className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600" onClick={()=>rejectOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}>Odrzuć</button>
                        <button className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>deleteOfferAdmin(offer.idOferta ?? offer.id)} disabled={loadingList}>Usuń</button>
                      </div>
                    </div>
                  </div>
                ))}
                {adminOffers.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">Brak ofert w systemie</div>}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
