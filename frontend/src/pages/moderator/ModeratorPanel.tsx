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
            <div className="tab-content">
                <h2>Statystyki Moderatora</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>{statystyki.oczekujaceOferty}</h3>
                        <p>Oczekujące oferty</p>
                    </div>
                    <div className="stat-card">
                        <h3>{statystyki.zgloszeniaOczekujace}</h3>
                        <p>Zgłoszenia do rozpatrzenia</p>
                    </div>
                    <div className="stat-card">
                        <h3>{statystyki.komentarzeOstatnich24h}</h3>
                        <p>Komentarze (24h)</p>
                    </div>
                    <div className="stat-card">
                        <h3>{statystyki.oferty24h}</h3>
                        <p>Oferty (24h)</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderKomentarze = () => (
        <div className="tab-content">
            <h2>Moderacja komentarzy</h2>
            {komentarze.length === 0 ? (
                <p>Brak komentarzy do moderacji</p>
            ) : (
                <div className="komentarze-grid">
                    {komentarze.map((komentarz) => (
                        <div key={komentarz.idKomentarz} className="komentarz-card">
                            <h4>{komentarz.autor}</h4>
                            <p><strong>Treść:</strong> {komentarz.tresc}</p>
                            <p><strong>Oferta:</strong> {komentarz.ofertaTytul}</p>
                            <p><strong>Data:</strong> {komentarz.dataDodania}</p>
                            {komentarz.zgloszen > 0 && (
                                <p><strong>Zgłoszeń:</strong> <span className="status-badge pending">{komentarz.zgloszen}</span></p>
                            )}
                            <div className="item-actions">
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
        <div className="tab-content">
            <h2>Moderacja ofert</h2>
            {oferty.length === 0 ? (
                <p>Brak ofert do moderacji</p>
            ) : (
                <div className="oferty-grid">
                    {oferty.map((oferta) => (
                        <div key={oferta.idOferta} className="oferta-card">
                            <h4>{oferta.tytul}</h4>
                            <p><strong>Opis:</strong> {oferta.opis}</p>
                            <p><strong>Cena:</strong> {oferta.cena} zł</p>
                            <p><strong>Autor:</strong> {oferta.autor}</p>
                            <p><strong>Kategoria:</strong> {oferta.kategoria}</p>
                            <p><strong>Data:</strong> {oferta.dataDodania}</p>
                            <p><strong>Status:</strong> 
                                <span className={`status-badge ${oferta.zatwierdzona ? 'approved' : 'pending'}`}>
                                    {oferta.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}
                                </span>
                            </p>
                            <div className="item-actions">
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
        <div className="tab-content">
            <h2>Obsługa zgłoszeń</h2>
            {zgloszenia.length === 0 ? (
                <p>Brak zgłoszeń do rozpatrzenia</p>
            ) : (
                <div className="zgloszenia-grid">
                    {zgloszenia.map((zgloszenie) => (
                        <div key={zgloszenie.idZgloszenie} className="zgloszenie-card">
                            <h4>{zgloszenie.tytul}</h4>
                            <p><strong>Treść:</strong> {zgloszenie.tresc}</p>
                            <p><strong>Zgłoszone przez:</strong> {zgloszenie.zgloszonePrzez}</p>
                            <p><strong>Data:</strong> {zgloszenie.dataDodania}</p>
                            <p><strong>Status:</strong> 
                                <span className={`status-badge ${zgloszenie.status === 'Oczekujące' ? 'waiting' : 'processed'}`}>
                                    {zgloszenie.status}
                                </span>
                            </p>
                            {zgloszenie.status === 'Oczekujące' && (
                                <div className="item-actions">
                                    <button 
                                        className="respond-btn"
                                        onClick={() => handleRozpatrzZgloszenie(zgloszenie.idZgloszenie)}
                                    >
                                        Rozpatrz
                                    </button>
                                    <button 
                                        className="edit-btn"
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
            <h1>⚖️ Panel Moderatora</h1>

            <div className="tabs">
                <button 
                    className={activeTab === 'statystyki' ? 'active' : ''}
                    onClick={() => setActiveTab('statystyki')}
                >
                    📊 Statystyki
                </button>
                <button 
                    className={activeTab === 'komentarze' ? 'active' : ''}
                    onClick={() => setActiveTab('komentarze')}
                >
                    💬 Komentarze ({komentarze.length})
                </button>
                <button 
                    className={activeTab === 'oferty' ? 'active' : ''}
                    onClick={() => setActiveTab('oferty')}
                >
                    📝 Oferty ({oferty.length})
                </button>
                <button 
                    className={activeTab === 'zgloszenia' ? 'active' : ''}
                    onClick={() => setActiveTab('zgloszenia')}
                >
                    🚨 Zgłoszenia ({zgloszenia.length})
                </button>
            </div>

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
    );
};

export default ModeratorPanel;
