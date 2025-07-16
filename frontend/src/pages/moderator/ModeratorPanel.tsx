import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import './ModeratorPanel.css';

interface Komentarz {
    idKomentarz: number;
    tresc: string;
    dataDodania: string;
    autor: string;
    ofertaTytul: string;
    zgloszen: number;
}

interface Oferta {
    idOferta: number;
    tytul: string;
    opis: string;
    cena: number;
    dataDodania: string;
    autor: string;
    kategoria: string;
    aktywna: boolean;
    zatwierdzona: boolean;
}

interface Zgloszenie {
    idZgloszenie: number;
    tytul: string;
    tresc: string;
    dataDodania: string;
    zgloszonePrzez: string;
    status: string;
}

interface Statystyki {
    oczekujaceOferty: number;
    zgloszeniaOczekujace: number;
    komentarzeOstatnich24h: number;
    oferty24h: number;
}

const ModeratorPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('statystyki');
    const [komentarze, setKomentarze] = useState<Komentarz[]>([]);
    const [oferty, setOferty] = useState<Oferta[]>([]);
    const [zgloszenia, setZgloszenia] = useState<Zgloszenie[]>([]);
    const [statystyki, setStatystyki] = useState<Statystyki | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (activeTab === 'statystyki') {
            fetchStatystyki();
        } else if (activeTab === 'komentarze') {
            fetchKomentarze();
        } else if (activeTab === 'oferty') {
            fetchOferty();
        } else if (activeTab === 'zgloszenia') {
            fetchZgloszenia();
        }
    }, [activeTab]);

    const fetchStatystyki = async () => {
        setLoading(true);
        try {
            const response = await api('moderator/statystyki');
            setStatystyki(response);
        } catch (error) {
            console.error('Błąd podczas pobierania statystyk:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKomentarze = async () => {
        setLoading(true);
        try {
            const response = await api('moderator/komentarze');
            setKomentarze(response);
        } catch (error) {
            console.error('Błąd podczas pobierania komentarzy:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOferty = async () => {
        setLoading(true);
        try {
            const response = await api('moderator/oferty');
            setOferty(response);
        } catch (error) {
            console.error('Błąd podczas pobierania ofert:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchZgloszenia = async () => {
        setLoading(true);
        try {
            const response = await api('moderator/zgloszenia');
            setZgloszenia(response);
        } catch (error) {
            console.error('Błąd podczas pobierania zgłoszeń:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUsunKomentarz = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

        try {
            await api(`moderator/komentarz/${id}`, {
                method: 'DELETE'
            });
            alert('Komentarz został usunięty');
            fetchKomentarze();
        } catch (error) {
            console.error('Błąd podczas usuwania komentarza:', error);
            alert('Błąd podczas usuwania komentarza');
        }
    };

    const handleOstrzezUzytkownika = async (id: number) => {
        const powod = prompt('Podaj powód ostrzeżenia:');
        if (!powod) return;

        try {
            await api(`moderator/komentarz/${id}/ostrzez`, {
                method: 'POST',
                body: JSON.stringify({ powod })
            });
            alert('Ostrzeżenie zostało wysłane');
            fetchKomentarze();
        } catch (error) {
            console.error('Błąd podczas wysyłania ostrzeżenia:', error);
            alert('Błąd podczas wysyłania ostrzeżenia');
        }
    };

    const handleZatwierdzOferte = async (id: number) => {
        try {
            await api(`moderator/oferta/${id}/zatwierdz`, {
                method: 'PUT'
            });
            alert('Oferta została zatwierdzona');
            fetchOferty();
        } catch (error) {
            console.error('Błąd podczas zatwierdzania oferty:', error);
            alert('Błąd podczas zatwierdzania oferty');
        }
    };

    const handleOdrzucOferte = async (id: number) => {
        const powod = prompt('Podaj powód odrzucenia:');
        if (!powod) return;

        try {
            await api(`moderator/oferta/${id}/odrzuc`, {
                method: 'PUT',
                body: JSON.stringify({ powod })
            });
            alert('Oferta została odrzucona');
            fetchOferty();
        } catch (error) {
            console.error('Błąd podczas odrzucania oferty:', error);
            alert('Błąd podczas odrzucania oferty');
        }
    };

    const handleEdytujOferte = async (id: number) => {
        const nowyTytul = prompt('Nowy tytuł (lub pozostaw pusty):');
        const nowyOpis = prompt('Nowy opis (lub pozostaw pusty):');
        const powod = prompt('Powód edycji:');
        
        if (!powod) return;

        try {
            await api(`moderator/oferta/${id}/edytuj`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    nowyTytul: nowyTytul || '',
                    nowyOpis: nowyOpis || '',
                    powod 
                })
            });
            alert('Oferta została zedytowana');
            fetchOferty();
        } catch (error) {
            console.error('Błąd podczas edycji oferty:', error);
            alert('Błąd podczas edycji oferty');
        }
    };

    const handleRozpatrzZgloszenie = async (id: number) => {
        const odpowiedz = prompt('Twoja odpowiedź na zgłoszenie:');
        if (!odpowiedz) return;

        try {
            await api(`moderator/zgloszenie/${id}/rozpatrz`, {
                method: 'PUT',
                body: JSON.stringify({ odpowiedz })
            });
            alert('Zgłoszenie zostało rozpatrzone');
            fetchZgloszenia();
        } catch (error) {
            console.error('Błąd podczas rozpatrywania zgłoszenia:', error);
            alert('Błąd podczas rozpatrywania zgłoszenia');
        }
    };

    const handlePrzekazAdminowi = async (id: number) => {
        const komentarz = prompt('Komentarz dla adminów:');
        if (!komentarz) return;

        try {
            await api(`moderator/zgloszenie/${id}/przekaz-adminowi`, {
                method: 'POST',
                body: JSON.stringify({ komentarz })
            });
            alert('Zgłoszenie zostało przekazane do adminów');
            fetchZgloszenia();
        } catch (error) {
            console.error('Błąd podczas przekazywania zgłoszenia:', error);
            alert('Błąd podczas przekazywania zgłoszenia');
        }
    };

    const renderStatystyki = () => {
        if (!statystyki) return <div>Brak danych statystycznych</div>;

        return (
            <div className="moderator-stats">
                <h3>Statystyki moderatora</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Oczekujące oferty</h4>
                        <div className="stat-number">{statystyki.oczekujaceOferty}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Zgłoszenia do rozpatrzenia</h4>
                        <div className="stat-number">{statystyki.zgloszeniaOczekujace}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Komentarze (24h)</h4>
                        <div className="stat-number">{statystyki.komentarzeOstatnich24h}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Oferty (24h)</h4>
                        <div className="stat-number">{statystyki.oferty24h}</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderKomentarze = () => (
        <div className="moderator-comments">
            <h3>Moderacja komentarzy</h3>
            {komentarze.length === 0 ? (
                <p>Brak komentarzy do moderacji</p>
            ) : (
                <div className="comments-grid">
                    {komentarze.map((komentarz) => (
                        <div key={komentarz.idKomentarz} className="comment-card">
                            <div className="comment-header">
                                <strong>{komentarz.autor}</strong>
                                <span className="comment-date">{komentarz.dataDodania}</span>
                            </div>
                            <div className="comment-content">
                                <p>{komentarz.tresc}</p>
                                <small>Oferta: {komentarz.ofertaTytul}</small>
                                {komentarz.zgloszen > 0 && (
                                    <div className="report-badge">
                                        Zgłoszeń: {komentarz.zgloszen}
                                    </div>
                                )}
                            </div>
                            <div className="comment-actions">
                                <button 
                                    className="warn-btn"
                                    onClick={() => handleOstrzezUzytkownika(komentarz.idKomentarz)}
                                >
                                    Ostrzeż
                                </button>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleUsunKomentarz(komentarz.idKomentarz)}
                                >
                                    Usuń
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderOferty = () => (
        <div className="moderator-offers">
            <h3>Moderacja ofert</h3>
            {oferty.length === 0 ? (
                <p>Brak ofert do moderacji</p>
            ) : (
                <div className="offers-grid">
                    {oferty.map((oferta) => (
                        <div key={oferta.idOferta} className="offer-card">
                            <div className="offer-header">
                                <h4>{oferta.tytul}</h4>
                                <div className="offer-status">
                                    {oferta.zatwierdzona ? '✅ Zatwierdzona' : '⏳ Oczekuje'}
                                </div>
                            </div>
                            <div className="offer-content">
                                <p>{oferta.opis}</p>
                                <div className="offer-meta">
                                    <span>Cena: {oferta.cena} zł</span>
                                    <span>Autor: {oferta.autor}</span>
                                    <span>Kategoria: {oferta.kategoria}</span>
                                    <span>Data: {oferta.dataDodania}</span>
                                </div>
                            </div>
                            <div className="offer-actions">
                                {!oferta.zatwierdzona && (
                                    <button 
                                        className="approve-btn"
                                        onClick={() => handleZatwierdzOferte(oferta.idOferta)}
                                    >
                                        Zatwierdź
                                    </button>
                                )}
                                <button 
                                    className="edit-btn"
                                    onClick={() => handleEdytujOferte(oferta.idOferta)}
                                >
                                    Edytuj
                                </button>
                                <button 
                                    className="reject-btn"
                                    onClick={() => handleOdrzucOferte(oferta.idOferta)}
                                >
                                    Odrzuć
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderZgloszenia = () => (
        <div className="moderator-reports">
            <h3>Obsługa zgłoszeń</h3>
            {zgloszenia.length === 0 ? (
                <p>Brak zgłoszeń do rozpatrzenia</p>
            ) : (
                <div className="reports-grid">
                    {zgloszenia.map((zgloszenie) => (
                        <div key={zgloszenie.idZgloszenie} className="report-card">
                            <div className="report-header">
                                <h4>{zgloszenie.tytul}</h4>
                                <div className={`report-status ${zgloszenie.status.toLowerCase()}`}>
                                    {zgloszenie.status}
                                </div>
                            </div>
                            <div className="report-content">
                                <p>{zgloszenie.tresc}</p>
                                <div className="report-meta">
                                    <span>Zgłoszone przez: {zgloszenie.zgloszonePrzez}</span>
                                    <span>Data: {zgloszenie.dataDodania}</span>
                                </div>
                            </div>
                            {zgloszenie.status === 'Oczekujące' && (
                                <div className="report-actions">
                                    <button 
                                        className="resolve-btn"
                                        onClick={() => handleRozpatrzZgloszenie(zgloszenie.idZgloszenie)}
                                    >
                                        Rozpatrz
                                    </button>
                                    <button 
                                        className="escalate-btn"
                                        onClick={() => handlePrzekazAdminowi(zgloszenie.idZgloszenie)}
                                    >
                                        Przekaż adminowi
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="moderator-panel">
            <div className="moderator-header">
                <h2>Panel Moderatora</h2>
                <p>Zarządzaj treścią i moderuj zgłoszenia</p>
            </div>

            <nav className="moderator-nav">
                <button 
                    className={`nav-btn ${activeTab === 'statystyki' ? 'active' : ''}`}
                    onClick={() => setActiveTab('statystyki')}
                >
                    📊 Statystyki
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'komentarze' ? 'active' : ''}`}
                    onClick={() => setActiveTab('komentarze')}
                >
                    💬 Komentarze
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'oferty' ? 'active' : ''}`}
                    onClick={() => setActiveTab('oferty')}
                >
                    📝 Oferty
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'zgloszenia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('zgloszenia')}
                >
                    🚨 Zgłoszenia
                </button>
            </nav>

            <div className="moderator-content">
                {loading ? (
                    <div className="loading">Ładowanie...</div>
                ) : (
                    <>
                        {activeTab === 'statystyki' && renderStatystyki()}
                        {activeTab === 'komentarze' && renderKomentarze()}
                        {activeTab === 'oferty' && renderOferty()}
                        {activeTab === 'zgloszenia' && renderZgloszenia()}
                    </>
                )}
            </div>
        </div>
    );
};

export default ModeratorPanel;
