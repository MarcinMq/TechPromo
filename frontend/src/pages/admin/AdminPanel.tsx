import { useEffect, useState } from 'react';
import './AdminPanel.css';

type Uzytkownik = {
  id: number;
  nick: string;
  email: string;
  punkty: number;
  dataRejestracji: string;
  emailConfirmed: boolean;
};

type Odznaka = {
  idOdznaka: number;
  nazwa: string;
  opis: string;
  ikona: string;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'badges' | 'assign'>('users');
  const [users, setUsers] = useState<Uzytkownik[]>([]);
  const [badges, setBadges] = useState<Odznaka[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Formularz nowej odznaki
  const [newBadge, setNewBadge] = useState({ nazwa: '', opis: '', ikona: '🏆' });
  
  // Formularz przyznawania odznaki
  const [assignForm, setAssignForm] = useState({ idUzytkownik: '', idOdznaka: '' });

  const API_BASE = 'http://localhost:5023';

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/uzytkownicy`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setMessage('Błąd pobierania użytkowników');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/odznaki`, {
        credentials: 'include'
      });
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
      const res = await fetch(`${API_BASE}/admin/utworz-odznake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBadge)
      });
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
      const res = await fetch(`${API_BASE}/admin/przyznaj-odznake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idUzytkownik: parseInt(assignForm.idUzytkownik),
          idOdznaka: parseInt(assignForm.idOdznaka)
        })
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
      const res = await fetch(`${API_BASE}/admin/odznaka/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
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
      const res = await fetch(`${API_BASE}/admin/uzytkownik/${userId}/punkty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nowePunkty: newPoints })
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

  useEffect(() => {
    fetchUsers();
    fetchBadges();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="admin-panel">
      <h1>🛠️ Panel Administratora</h1>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Użytkownicy ({users.length})
        </button>
        <button 
          className={activeTab === 'badges' ? 'active' : ''}
          onClick={() => setActiveTab('badges')}
        >
          🏆 Odznaki ({badges.length})
        </button>
        <button 
          className={activeTab === 'assign' ? 'active' : ''}
          onClick={() => setActiveTab('assign')}
        >
          ⚡ Przyznaj Odznakę
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
    </div>
  );
};

export default AdminPanel;
