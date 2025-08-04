import { useEffect, useState } from 'react';
import { MessageCircle, Users, ShoppingBag, Trash2, Trophy, Zap, Clipboard, Settings, Check } from 'lucide-react';
import { authorizedFetch, apiPost, apiPut, apiDelete } from '../../utils/api'; // Prostsze API funkcje

type Uzytkownik = {
  id: number;
  nick: string;
  email: string;
  punkty: number;
  dataRejestracji: string;
  emailConfirmed: boolean;
  rola: string;
};

type Odznaka = {
  idOdznaka: number;
  nazwa: string;
  opis: string;
  ikona: string;
};

type Oferta = {
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
  link: string;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'badges' | 'assign' | 'reports' | 'comments' | 'offers'>('users');
  const [users, setUsers] = useState<Uzytkownik[]>([]);
  const [badges, setBadges] = useState<Odznaka[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [offers, setOffers] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Formularz nowej odznaki
  const [newBadge, setNewBadge] = useState({ nazwa: '', opis: '', ikona: '🏆' });
  
  // Formularz przyznawania odznaki
  const [assignForm, setAssignForm] = useState({ idUzytkownik: '', idOdznaka: '' });

  const API_BASE = 'http://localhost:5023';

  const fetchUsers = async () => {
    try {
      // Teraz nie muszę dodawać JWT - authorizedFetch robi to automatycznie!
      const res = await authorizedFetch(`${API_BASE}/admin/uzytkownicy`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setMessage('Błąd pobierania użytkowników - sprawdź czy masz uprawnienia Admin');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchBadges = async () => {
    try {
      // Też bez dodawania JWT - wszystko automatyczne!
      const res = await authorizedFetch(`${API_BASE}/admin/odznaki`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      } else {
        setMessage('Błąd pobierania odznak');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const createBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // apiPost automatycznie dodaje JWT i Content-Type!
      const res = await apiPost('/admin/utworz-odznake', newBadge);
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        setNewBadge({ nazwa: '', opis: '', ikona: '🏆' });
        fetchBadges();
      }
    } catch {
      setMessage('Błąd tworzenia odznaki');
    } finally {
      setLoading(false);
    }
  };

  const assignBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // apiPost obsługuje wszystko za nas
      const res = await apiPost('/admin/przyznaj-odznake', {
        idUzytkownik: parseInt(assignForm.idUzytkownik),
        idOdznaka: parseInt(assignForm.idOdznaka)
      });
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        setAssignForm({ idUzytkownik: '', idOdznaka: '' });
      }
    } catch {
      setMessage('Błąd przyznawania odznaki');
    } finally {
      setLoading(false);
    }
  };

  const deleteBadge = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę odznakę?')) return;
    
    setLoading(true);
    try {
      // apiDelete też ma wbudowany JWT
      const res = await apiDelete(`/admin/odznaka/${id}`);
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchBadges();
      }
    } catch {
      setMessage('Błąd usuwania odznaki');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPoints = async (userId: number, newPoints: number) => {
    setLoading(true);
    try {
      // apiPut też automatycznie obsługuje JWT
      const res = await apiPut(`/admin/uzytkownik/${userId}/punkty`, {
        nowePunkty: newPoints
      });
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchUsers();
      }
    } catch {
      setMessage('Błąd aktualizacji punktów');
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: number, newRole: string) => {
    if (!window.confirm(`Czy na pewno chcesz zmienić rolę użytkownika na "${newRole}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await apiPut(`/admin/uzytkownik/${userId}/rola`, {
        nowaRola: newRole
      });
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchUsers(); // Odśwież listę użytkowników
      }
    } catch {
      setMessage('Błąd zmiany roli użytkownika');
    } finally {
      setLoading(false);
    }
  };

  // === NOWE FUNKCJE ZGODNIE Z DIAGRAMEM ===
  
  // Pobieranie zgłoszeń
  const fetchReports = async () => {
    try {
      const res = await authorizedFetch('/admin/zgloszenia');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        setMessage('Błąd pobierania zgłoszeń');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  // Pobieranie komentarzy
  const fetchComments = async () => {
    try {
      const res = await authorizedFetch('/admin/komentarze');
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        setMessage('Błąd pobierania komentarzy');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  // Pobieranie ofert
  const fetchOffers = async () => {
    try {
      const res = await authorizedFetch('/admin/oferty');
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

  // Zatwierdzanie zgłoszenia
  const approveReport = async (reportId: number) => {
    setLoading(true);
    try {
      const res = await apiPut(`/admin/zgloszenie/${reportId}/zatwierdz`, {});
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchReports();
      }
    } catch {
      setMessage('Błąd zatwierdzania zgłoszenia');
    } finally {
      setLoading(false);
    }
  };

  // Odrzucanie zgłoszenia
  const rejectReport = async (reportId: number) => {
    setLoading(true);
    try {
      const res = await apiDelete(`/admin/zgloszenie/${reportId}/odrzuc`);
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchReports();
      }
    } catch {
      setMessage('Błąd odrzucania zgłoszenia');
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie komentarza
  const deleteComment = async (commentId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;
    
    setLoading(true);
    try {
      const res = await apiDelete(`/admin/komentarz/${commentId}`);
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchComments();
      }
    } catch {
      setMessage('Błąd usuwania komentarza');
    } finally {
      setLoading(false);
    }
  };

  // Zatwierdzanie oferty
  const approveOffer = async (offerId: number) => {
    setLoading(true);
    try {
      const res = await apiPut(`/admin/oferta/${offerId}/zatwierdz`, {});
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchOffers();
      }
    } catch {
      setMessage('Błąd zatwierdzania oferty');
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie oferty
  const deleteOffer = async (offerId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ofertę?')) return;
    
    setLoading(true);
    try {
      const res = await apiDelete(`/admin/oferta/${offerId}`);
      const text = await res.text();
      setMessage(text);
      if (res.ok) {
        fetchOffers();
      }
    } catch {
      setMessage('Błąd usuwania oferty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBadges();
    fetchReports();
    fetchComments();
    fetchOffers();
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
            <Settings className="w-10 h-10 mr-3 text-blue-600" />
            Panel Admina
          </h1>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'users' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Użytkownicy ({users.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'badges' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('badges')}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Odznaki ({badges.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'assign' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('assign')}
            >
              <Zap className="inline w-5 h-5 mr-2" />
              Przyznaj Odznakę
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'reports' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <Clipboard className="inline w-5 h-5 mr-2" />
              Zgłoszenia ({reports.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'comments' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('comments')}
            >
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Komentarze ({comments.length})
            </button>
            <button 
              className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === 'offers' 
                  ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
              }`}
              onClick={() => setActiveTab('offers')}
            >
              <ShoppingBag className="w-5 h-5 inline mr-2" />
              Oferty ({offers.length})
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Zarządzanie Użytkownikami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all border border-white/30">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{user.nick}</h3>
                  <p className="mb-2"><strong>Email:</strong> {user.email}</p>
                  <p className="mb-2"><strong>Punkty:</strong> <span className="text-green-600 font-bold">{user.punkty}</span></p>
                  <p className="mb-2"><strong>Rejestracja:</strong> {user.dataRejestracji}</p>
                  <p className="mb-4"><strong>Rola:</strong> <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${
                    user.rola === 'Admin' ? 'bg-red-500' : 
                    user.rola === 'Moderator' ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}>{user.rola}</span></p>
                  <div className="space-y-3 mt-4 border-t border-gray-200 pt-4">
                    <div>
                      <input 
                        type="number" 
                        placeholder="Nowe punkty"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseInt((e.target as HTMLInputElement).value);
                            if (!isNaN(value)) {
                              updateUserPoints(user.id, value);
                            }
                          }
                        }}
                      />
                    </div>
                    <select 
                      value={user.rola}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none bg-white transition-all"
                    >
                      <option value="Uzytkownik">Uzytkownik</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <Trophy className="w-7 h-7 mr-2" />
              Zarządzanie Odznakami
            </h2>
            
            <div className="bg-white/70 rounded-xl p-6 shadow-lg mb-8">
              <form onSubmit={createBadge} className="space-y-4">
                <h3 className="text-xl font-bold mb-4 text-center">✨ Utwórz Nową Odznakę</h3>
                <div>
                  <input
                    type="text"
                    placeholder="Nazwa odznaki"
                    value={newBadge.nazwa}
                    onChange={e => setNewBadge({...newBadge, nazwa: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Opis odznaki"
                    value={newBadge.opis}
                    onChange={e => setNewBadge({...newBadge, opis: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Ikona (emoji)"
                    value={newBadge.ikona}
                    onChange={e => setNewBadge({...newBadge, ikona: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none transition-all"
                  />
                </div>
                <div className="text-center">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2 bg-custom-blue text-white rounded-lg hover:bg-custom-blue-dark transition-colors font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Tworzenie...' : 'Utwórz Odznakę'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {badges.map(badge => (
                <div key={badge.idOdznaka} className="bg-white/60 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-center">
                  <div className="text-5xl mb-3">{badge.ikona}</div>
                  <h4 className="text-xl font-bold mb-2">{badge.nazwa}</h4>
                  <p className="text-gray-700 mb-4">{badge.opis}</p>
                  <button 
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                    onClick={() => deleteBadge(badge.idOdznaka)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assign' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <Zap className="w-7 h-7 mr-2" />
              Przyznaj Odznakę Użytkownikowi
            </h2>
            
            <div className="max-w-xl mx-auto bg-white/70 rounded-xl p-8 shadow-lg">
              <form onSubmit={assignBadge} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Wybierz użytkownika</label>
                  <select
                    value={assignForm.idUzytkownik}
                    onChange={e => setAssignForm({...assignForm, idUzytkownik: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none bg-white transition-all"
                  >
                    <option value="">Wybierz użytkownika</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.nick} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Wybierz odznakę</label>
                  <select
                    value={assignForm.idOdznaka}
                    onChange={e => setAssignForm({...assignForm, idOdznaka: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-custom-blue focus:border-custom-blue outline-none bg-white transition-all"
                  >
                    <option value="">Wybierz odznakę</option>
                    {badges.map(badge => (
                      <option key={badge.idOdznaka} value={badge.idOdznaka}>
                        {badge.ikona} {badge.nazwa}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-8 py-3 bg-custom-blue text-white rounded-lg hover:bg-custom-blue-dark transition-colors font-semibold text-lg disabled:opacity-50"
                  >
                    {loading ? 'Przyznawanie...' : '🏆 Przyznaj Odznakę'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Nowe zakładki */}
        
        {activeTab === 'reports' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <Clipboard className="w-7 h-7 mr-2" />
              Przeglądanie Zgłoszeń
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.map(report => (
                <div key={report.id} className="bg-white/60 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 border-yellow-500">
                  <h4 className="text-lg font-bold mb-3 flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2">#{report.id}</span>
                    Zgłoszenie
                  </h4>
                  <div className="space-y-2 mb-4">
                    <p className="bg-white/70 p-3 rounded-lg"><strong>Treść:</strong> {report.tresc}</p>
                    <p><strong>Zgłoszone przez:</strong> {report.zgloszonePrzez}</p>
                    <p><strong>Data:</strong> {report.dataZgloszenia}</p>
                    <p><strong>Oferta:</strong> {report.oferta}</p>
                  </div>
                  <div className="flex space-x-3 pt-3 border-t border-gray-200">
                    <button 
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      onClick={() => approveReport(report.id)}
                      disabled={loading}
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Zatwierdź
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      onClick={() => rejectReport(report.id)}
                      disabled={loading}
                    >
                      ❌ Odrzuć
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="col-span-full text-center p-12 bg-white/40 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-5xl mb-4">📭</div>
                  <div className="text-xl font-medium text-gray-600">Brak zgłoszeń do rozpatrzenia</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
              Moderacja Komentarzy
            </h2>
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2">#{comment.id}</span>
                      Komentarz
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      comment.status === 'Zatwierdzony' ? 'bg-green-100 text-green-800' : 
                      comment.status === 'Oczekujący' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {comment.status}
                    </span>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg mb-4">
                    <p className="text-gray-800">{comment.tresc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <p><strong>Autor:</strong> {comment.autor}</p>
                    <p><strong>Data:</strong> {comment.dataUtworzenia}</p>
                    <p className="col-span-2"><strong>Oferta:</strong> {comment.oferta}</p>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center"
                      onClick={() => deleteComment(comment.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Usuń Komentarz
                    </button>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center p-12 bg-white/40 rounded-xl border-2 border-dashed border-gray-300">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <div className="text-xl font-medium text-gray-600">Brak komentarzy do moderacji</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 mr-2 text-green-600" />
              Moderacja Ofert
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map(offer => (
                <div key={offer.id} className="bg-white/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-l-4 border-custom-blue">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold">{offer.tytul}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      offer.zatwierdzona ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {offer.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}
                    </span>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg mb-4">
                    <p className="text-gray-800">{offer.opis}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <p><strong>Autor:</strong> {offer.autor}</p>
                    <p><strong>Data:</strong> {offer.dataUtworzenia}</p>
                    <p><strong>Cena:</strong> {offer.cena ? <span className="font-bold text-green-600">{offer.cena} PLN</span> : <span className="text-gray-500">Brak</span>}</p>
                  </div>
                  <div className="flex space-x-3 pt-3 border-t border-gray-200">
                    {!offer.zatwierdzona && (
                      <button 
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                        onClick={() => approveOffer(offer.id)}
                        disabled={loading}
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Zatwierdź
                      </button>
                    )}
                    <button 
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      onClick={() => deleteOffer(offer.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="col-span-full text-center p-12 bg-white/40 rounded-xl border-2 border-dashed border-gray-300">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <div className="text-xl font-medium text-gray-600">Brak ofert do moderacji</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
