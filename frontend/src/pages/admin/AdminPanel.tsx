import { useEffect, useState } from 'react';
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

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'badges' | 'assign' | 'reports' | 'comments' | 'offers'>('users');
  const [users, setUsers] = useState<Uzytkownik[]>([]);
  const [badges, setBadges] = useState<Odznaka[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
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
    <div className="panel">
      <div className="panel-header">
        <h1 className="panel-title">
          �
          Panel Administratora
        </h1>
        <p className="panel-subtitle">Pełne zarządzanie systemem TechPromo</p>
      </div>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Użytkownicy ({users.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          🏆 Odznaki ({badges.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'assign' ? 'active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          ⚡ Przyznaj Odznakę
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Zgłoszenia ({reports.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          💬 Komentarze ({comments.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          🛍️ Oferty ({offers.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="tab-content">
          <h2>Zarządzanie Użytkownikami</h2>
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.nick}</h3>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Punkty:</strong> {user.punkty}</p>
                <p><strong>Rejestracja:</strong> {user.dataRejestracji}</p>
                <p><strong>Rola:</strong> <span className={`role-badge ${user.rola.toLowerCase()}`}>{user.rola}</span></p>
                <div className="user-actions">
                  <input 
                    type="number" 
                    placeholder="Nowe punkty"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseInt((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                          updateUserPoints(user.id, value);
                        }
                      }
                    }}
                  />
                  <select 
                    value={user.rola}
                    onChange={(e) => changeUserRole(user.id, e.target.value)}
                    className="role-select"
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
        <div className="tab-content">
          <h2>Zarządzanie Odznakami</h2>
          
          <form onSubmit={createBadge} className="create-badge-form">
            <h3>Utwórz Nową Odznakę</h3>
            <input
              type="text"
              placeholder="Nazwa odznaki"
              value={newBadge.nazwa}
              onChange={e => setNewBadge({...newBadge, nazwa: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Opis odznaki"
              value={newBadge.opis}
              onChange={e => setNewBadge({...newBadge, opis: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Ikona (emoji)"
              value={newBadge.ikona}
              onChange={e => setNewBadge({...newBadge, ikona: e.target.value})}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Tworzenie...' : 'Utwórz Odznakę'}
            </button>
          </form>

          <div className="badges-grid">
            {badges.map(badge => (
              <div key={badge.idOdznaka} className="badge-card">
                <div className="badge-icon">{badge.ikona}</div>
                <h4>{badge.nazwa}</h4>
                <p>{badge.opis}</p>
                <button 
                  className="delete-btn"
                  onClick={() => deleteBadge(badge.idOdznaka)}
                  disabled={loading}
                >
                  🗑️ Usuń
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="tab-content">
          <h2>Przyznaj Odznakę Użytkownikowi</h2>
          
          <form onSubmit={assignBadge} className="assign-form">
            <select
              value={assignForm.idUzytkownik}
              onChange={e => setAssignForm({...assignForm, idUzytkownik: e.target.value})}
              required
            >
              <option value="">Wybierz użytkownika</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nick} ({user.email})
                </option>
              ))}
            </select>

            <select
              value={assignForm.idOdznaka}
              onChange={e => setAssignForm({...assignForm, idOdznaka: e.target.value})}
              required
            >
              <option value="">Wybierz odznakę</option>
              {badges.map(badge => (
                <option key={badge.idOdznaka} value={badge.idOdznaka}>
                  {badge.ikona} {badge.nazwa}
                </option>
              ))}
            </select>

            <button type="submit" disabled={loading}>
              {loading ? 'Przyznawanie...' : 'Przyznaj Odznakę'}
            </button>
          </form>
        </div>
      )}

      {/* === NOWE ZAKŁADKI ZGODNIE Z DIAGRAMEM === */}
      
      {activeTab === 'reports' && (
        <div className="tab-content">
          <h2>📋 Przeglądanie Zgłoszeń</h2>
          <div className="reports-grid">
            {reports.map(report => (
              <div key={report.id} className="report-card">
                <h4>Zgłoszenie #{report.id}</h4>
                <p><strong>Treść:</strong> {report.tresc}</p>
                <p><strong>Zgłoszone przez:</strong> {report.zgloszonePrzez}</p>
                <p><strong>Data:</strong> {report.dataZgloszenia}</p>
                <p><strong>Oferta:</strong> {report.oferta}</p>
                <div className="report-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => approveReport(report.id)}
                    disabled={loading}
                  >
                    ✅ Zatwierdź
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => rejectReport(report.id)}
                    disabled={loading}
                  >
                    ❌ Odrzuć
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="tab-content">
          <h2>💬 Moderacja Komentarzy</h2>
          <div className="comments-grid">
            {comments.map(comment => (
              <div key={comment.id} className="comment-card">
                <h4>Komentarz #{comment.id}</h4>
                <p><strong>Treść:</strong> {comment.tresc}</p>
                <p><strong>Autor:</strong> {comment.autor}</p>
                <p><strong>Oferta:</strong> {comment.oferta}</p>
                <p><strong>Data:</strong> {comment.dataUtworzenia}</p>
                <p><strong>Status:</strong> {comment.status}</p>
                <div className="comment-actions">
                  <button 
                    className="delete-btn"
                    onClick={() => deleteComment(comment.id)}
                    disabled={loading}
                  >
                    🗑️ Usuń Komentarz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="tab-content">
          <h2>🛍️ Moderacja Ofert</h2>
          <div className="offers-grid">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <h4>{offer.tytul}</h4>
                <p><strong>Opis:</strong> {offer.opis}</p>
                <p><strong>Autor:</strong> {offer.autor}</p>
                <p><strong>Data:</strong> {offer.dataUtworzenia}</p>
                <p><strong>Cena:</strong> {offer.cena ? `${offer.cena} PLN` : 'Brak'}</p>
                <p><strong>Status:</strong> {offer.status}</p>
                <div className="offer-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => approveOffer(offer.id)}
                    disabled={loading}
                  >
                    ✅ Zatwierdź
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteOffer(offer.id)}
                    disabled={loading}
                  >
                    🗑️ Usuń Ofertę
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
