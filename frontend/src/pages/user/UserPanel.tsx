import { useEffect, useState } from 'react';
import { authorizedFetch, apiPost } from '../../utils/api';

type Oferta = {
  id: number;
  tytul: string;
  opis: string;
  cena?: number;
  cenaPoprzednia?: number;
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

type Odznaka = {
  id: number;
  nazwa: string;
  opis: string;
  ikona: string;
  dataOtrzymania: string;
};

type Komentarz = {
  id: number;
  tresc: string;
  oferta: string;
  data: string;
  autor: string;
};

const UserPanel = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'activity' | 'badges' | 'comments' | 'votes'>('offers');
  const [offers, setOffers] = useState<Oferta[]>([]);
  const [userActivity, setUserActivity] = useState<Aktywnosc[]>([]);
  const [userBadges, setUserBadges] = useState<Odznaka[]>([]);
  const [userComments, setUserComments] = useState<Komentarz[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Obsługa anchor linkow z navbara
  // Filtry
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'hot' | 'price'>('newest');

  const API_BASE = 'http://localhost:5023';

  // === POBIERANIE DANYCH ===
  
  const fetchOffers = async () => {
    try {
      let url = `${API_BASE}/oferta`;
      const params = new URLSearchParams();
      
      if (categoryFilter) params.append('kategoria', categoryFilter);
      if (tagFilter) params.append('tag', tagFilter);
      params.append('sortBy', sortBy);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await authorizedFetch(url);
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

  const fetchUserActivity = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/uzytkownik/aktywnosc`);
      if (res.ok) {
        const data = await res.json();
        setUserActivity(data);
      } else {
        setMessage('Błąd pobierania historii aktywności');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchUserBadges = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/uzytkownik/odznaki`);
      if (res.ok) {
        const data = await res.json();
        setUserBadges(data);
      } else {
        setMessage('Błąd pobierania odznak');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  const fetchUserComments = async () => {
    try {
      const res = await authorizedFetch(`${API_BASE}/uzytkownik/komentarze`);
      if (res.ok) {
        const data = await res.json();
        setUserComments(data);
      } else {
        setMessage('Błąd pobierania komentarzy');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  // === AKCJE UŻYTKOWNIKA ===

  const voteOffer = async (offerId: number, voteType: 'hot' | 'cold') => {
    setLoading(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/glos`, { typ: voteType });
      const text = await res.text();
      setMessage(text);
      
      if (res.ok) {
        fetchOffers();
      }
    } catch {
      setMessage('Błąd oddawania głosu');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (offerId: number, commentText: string) => {
    if (!commentText.trim()) return;
    
    setLoading(true);
    try {
      const res = await apiPost(`/uzytkownik/oferta/${offerId}/komentarz`, { tresc: commentText });
      const text = await res.text();
      setMessage(text);
      
      if (res.ok) {
        fetchOffers();
      }
    } catch {
      setMessage('Błąd dodawania komentarza');
    } finally {
      setLoading(false);
    }
  };

  const reportContent = async (type: 'offer' | 'comment', contentId: number, reason: string) => {
    setLoading(true);
    try {
      const res = await apiPost('/zgloszenia', {
        typ: type,
        idTresci: contentId,
        powod: reason
      });
      const text = await res.text();
      setMessage(text);
    } catch {
      setMessage('Błąd zgłaszania treści');
    } finally {
      setLoading(false);
    }
  };

  // === FILTRY I SORTOWANIE ===

  const filteredOffers = offers.filter(offer => {
    const categoryMatch = !categoryFilter || offer.kategoria === categoryFilter;
    const tagMatch = !tagFilter || offer.tagi.some(tag => 
      tag.toLowerCase().includes(tagFilter.toLowerCase())
    );
    return categoryMatch && tagMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return (b.votes.hot - b.votes.cold) - (a.votes.hot - a.votes.cold);
      case 'price':
        return (a.cena || 0) - (b.cena || 0);
      case 'newest':
      default:
        return new Date(b.dataUtworzenia).getTime() - new Date(a.dataUtworzenia).getTime();
    }
  });

  useEffect(() => {
    fetchOffers();
    fetchUserActivity();
    fetchUserBadges();
    fetchUserComments();
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
          Panel Użytkownika
        </h1>
        <p className="panel-subtitle">Zarządzaj swoimi ofertami, komentarzami i profilem</p>
      </div>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          🛍️ Dodane Oferty ({offers.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📊 Historia Aktywności ({userActivity.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          🏆 Moje Odznaki ({userBadges.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          💬 Moje Komentarze ({userComments.length})
        </button>
      </div>

      {activeTab === 'offers' && (
        <div className="tab-content">
          <div className="filters-section">
            <h3>🔍 Filtruj i Sortuj Oferty</h3>
            <div className="filters">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Wszystkie kategorie</option>
                <option value="Elektronika">📱 Elektronika</option>
                <option value="Moda">👕 Moda</option>
                <option value="Dom i Ogród">🏠 Dom i Ogród</option>
                <option value="Sport">⚽ Sport</option>
                <option value="Książki">📚 Książki</option>
                <option value="Gry">🎮 Gry</option>
                <option value="Kosmetyki">💄 Kosmetyki</option>
                <option value="Jedzenie">🍕 Jedzenie</option>
                <option value="Podróże">✈️ Podróże</option>
                <option value="Inne">🔧 Inne</option>
              </select>
              
              <input
                type="text"
                placeholder="Filtruj po tagach..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="filter-input"
              />
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="filter-select"
              >
                <option value="newest">Najnowsze</option>
                <option value="hot">Najgorętsze</option>
                <option value="price">Najtańsze</option>
              </select>
            </div>
          </div>

          <div className="offers-grid">
            {filteredOffers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-header">
                  <h4>{offer.tytul}</h4>
                  <span className="category-badge">{offer.kategoria}</span>
                </div>
                
                <p className="offer-description">{offer.opis}</p>
                
                {offer.zdjecia && offer.zdjecia.length > 0 && (
                  <div className="offer-images">
                    {offer.zdjecia.slice(0, 3).map((image, index) => (
                      <img 
                        key={index} 
                        src={`${API_BASE}${image}`} 
                        alt={`${offer.tytul} - zdjęcie ${index + 1}`}
                        className="offer-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                    {offer.zdjecia.length > 3 && (
                      <div className="more-images">
                        +{offer.zdjecia.length - 3} więcej
                      </div>
                    )}
                  </div>
                )}
                
                <div className="price-section">
                  {offer.cena && (
                    <>
                      <span className="current-price">{offer.cena} PLN</span>
                      {offer.cenaPoprzednia && (
                        <span className="old-price">{offer.cenaPoprzednia} PLN</span>
                      )}
                    </>
                  )}
                  <span className="shop">📍 {offer.sklep}</span>
                </div>
                
                <div className="tags">
                  {offer.tagi.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
                
                <div className="offer-actions">
                  <div className="vote-section">
                    <button 
                      className={`vote-btn hot ${offer.userVote === 'hot' ? 'active' : ''}`}
                      onClick={() => voteOffer(offer.id, 'hot')}
                      disabled={loading}
                    >
                      🔥 {offer.votes.hot}
                    </button>
                    <button 
                      className={`vote-btn cold ${offer.userVote === 'cold' ? 'active' : ''}`}
                      onClick={() => voteOffer(offer.id, 'cold')}
                      disabled={loading}
                    >
                      🧊 {offer.votes.cold}
                    </button>
                  </div>
                  
                  <span className="comments-count">💬 {offer.komentarze}</span>
                  
                  <button 
                    className="report-btn"
                    onClick={() => {
                      const reason = prompt('Powód zgłoszenia:');
                      if (reason) reportContent('offer', offer.id, reason);
                    }}
                  >
                    🚩 Zgłoś
                  </button>
                </div>
                
                <div className="comment-section">
                  <input
                    type="text"
                    placeholder="Dodaj komentarz..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addComment(offer.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="comment-input"
                  />
                </div>
                
                <div className="offer-meta">
                  <small>Dodane przez: {offer.autor} | {offer.dataUtworzenia}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="tab-content">
          <h2>📊 Historia Twojej Aktywności</h2>
          
          <div className="activity-timeline">
            {userActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.typ === 'oferta' && '🛍️'}
                  {activity.typ === 'komentarz' && '💬'}
                  {activity.typ === 'glos' && '🗳️'}
                  {activity.typ === 'odznaka' && '🏆'}
                </div>
                <div className="activity-content">
                  <p>{activity.opis}</p>
                  <div className="activity-meta">
                    <span className="activity-date">{activity.data}</span>
                    {activity.punkty && (
                      <span className="activity-points">+{activity.punkty} pkt</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="tab-content">
          <h2>🏆 Twoje Zdobyte Odznaki</h2>
          
          <div className="badges-grid">
            {userBadges.map(badge => (
              <div key={badge.id} className="badge-card earned">
                <div className="badge-icon">{badge.ikona}</div>
                <h4>{badge.nazwa}</h4>
                <p>{badge.opis}</p>
                <small>Zdobyta: {badge.dataOtrzymania}</small>
              </div>
            ))}
            
            {userBadges.length === 0 && (
              <div className="no-badges">
                <p>Nie masz jeszcze żadnych odznak! 🎯</p>
                <p>Bądź aktywny na platformie, aby zdobywać odznaki za swoje osiągnięcia.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="tab-content">
          <h2>💬 Twoje Komentarze</h2>
          
          <div className="comments-list">
            {userComments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-content">
                  <p>{comment.tresc}</p>
                  <div className="comment-meta">
                    <span>W ofercie: <strong>{comment.oferta}</strong></span>
                    <span>{comment.data}</span>
                  </div>
                </div>
                <button 
                  className="report-btn small"
                  onClick={() => {
                    const reason = prompt('Powód zgłoszenia komentarza:');
                    if (reason) reportContent('comment', comment.id, reason);
                  }}
                >
                  🚩
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPanel;
