import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, BarChart3, Flag, Shield } from 'lucide-react';
import { api } from '../../utils/api';

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
    typ?: string;
}

interface Zgloszenie {
    idZgloszenie: number;
    typ: string;
    tresc: string;
    dataDodania: string;
    zgloszonePrzez: string;
    status: string;
    idKomentarz?: number;
    fragmentKomentarza?: string;
    idOferta?: number;
    tytulOferty?: string;
}

interface Statystyki {
    oczekujaceOferty: number;
    zgloszeniaOczekujace: number;
    komentarzeOstatnich24h: number;
    oferty24h: number;
}

const PanelModeratora: React.FC = () => {
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

    const handleEdytujOferte = (id: number) => {
        const of = oferty.find(o => o.idOferta === id);
        if (!of) return;
        const isKupon = of.typ === 'kupon';
        window.location.href = isKupon ? `/stworz-oferte/kupon?edit=${of.idOferta}` : `/stworz-oferte/okazja?edit=${of.idOferta}`;
    };

    const handleUsunOferte = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę ofertę?')) return;
        try {
            await api(`moderator/oferta/${id}`, { method: 'DELETE' });
            alert('Oferta została usunięta');
            fetchOferty();
        } catch (error) {
            console.error('Błąd podczas usuwania oferty:', error);
            alert('Błąd podczas usuwania oferty');
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

    const handleUsunZgloszenie = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;

        try {
            await api(`moderator/zgloszenie/${id}`, {
                method: 'DELETE'
            });
            alert('Zgłoszenie zostało usunięte');
            fetchZgloszenia();
        } catch (error) {
            console.error('Błąd podczas usuwania zgłoszenia:', error);
            alert('Błąd podczas usuwania zgłoszenia');
        }
    };

    const renderStatystyki = () => {
        if (!statystyki) return <div className="text-center text-gray-600">Brak danych statystycznych</div>;

        return (
            <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                    Statystyki Moderatora
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
                        <h3 className="text-3xl font-bold text-custom-blue mb-2">{statystyki.oczekujaceOferty}</h3>
                        <p className="text-gray-600">Oczekujące oferty</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
                        <h3 className="text-3xl font-bold text-orange-600 mb-2">{statystyki.zgloszeniaOczekujace}</h3>
                        <p className="text-gray-600">Zgłoszenia do rozpatrzenia</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
                        <h3 className="text-3xl font-bold text-green-600 mb-2">{statystyki.komentarzeOstatnich24h}</h3>
                        <p className="text-gray-600">Komentarze (24h)</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
                        <h3 className="text-3xl font-bold text-purple-600 mb-2">{statystyki.oferty24h}</h3>
                        <p className="text-gray-600">Oferty (24h)</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderKomentarze = () => (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
              Moderacja komentarzy
            </h2>
            {komentarze.length === 0 ? (
                <div className="text-center text-gray-600">Brak komentarzy do moderacji</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {komentarze.map((komentarz) => (
                        <div key={komentarz.idKomentarz} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                            <h4 className="text-lg font-bold mb-3 text-gray-900">{komentarz.autor}</h4>
                            <p className="mb-2"><strong>Treść:</strong> {komentarz.tresc}</p>
                            <p className="mb-2"><strong>Oferta:</strong> {komentarz.ofertaTytul}</p>
                            <p className="mb-2"><strong>Data:</strong> {komentarz.dataDodania}</p>
                            {komentarz.zgloszen > 0 && (
                                <p className="mb-4"><strong>Zgłoszeń:</strong> <span className="bg-red-100/80 text-red-700 px-2 py-1 rounded-full text-sm font-semibold">{komentarz.zgloszen}</span></p>
                            )}
                            <div className="flex space-x-3">
                                <button 
                                    className="bg-yellow-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-yellow-600/80 transition-all font-semibold"
                                    onClick={() => handleOstrzezUzytkownika(komentarz.idKomentarz)}
                                >
                                    Ostrzeż
                                </button>
                                <button 
                                    className="bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-600/80 transition-all font-semibold"
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
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 mr-2 text-green-600" />
              Moderacja ofert
            </h2>
            {oferty.length === 0 ? (
                <div className="text-center text-gray-600">Brak ofert do moderacji</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {oferty.map((oferta) => (
                        <div key={oferta.idOferta} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                            <h4 className="text-lg font-bold mb-3 text-gray-900">{oferta.tytul}</h4>
                            <p className="mb-2"><strong>Opis:</strong> {oferta.opis}</p>
                            <p className="mb-2"><strong>Cena:</strong> {oferta.cena} zł</p>
                            <p className="mb-2"><strong>Autor:</strong> {oferta.autor}</p>
                            <p className="mb-2"><strong>Kategoria:</strong> {oferta.kategoria}</p>
                            <p className="mb-2"><strong>Data:</strong> {oferta.dataDodania}</p>
                            <p className="mb-4"><strong>Status:</strong> 
                                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                    oferta.zatwierdzona 
                                        ? 'bg-green-100/80 text-green-700' 
                                        : 'bg-yellow-100/80 text-yellow-700'
                                }`}>
                                    {oferta.zatwierdzona ? 'Zatwierdzona' : 'Oczekuje'}
                                </span>
                            </p>
                            <div className="flex space-x-3">
                                {!oferta.zatwierdzona && (
                                    <button 
                                        className="bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-green-600/80 transition-all font-semibold"
                                        onClick={() => handleZatwierdzOferte(oferta.idOferta)}
                                    >
                                        Zatwierdź
                                    </button>
                                )}
                                <button 
                                    className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-600/80 transition-all font-semibold"
                                    onClick={() => handleEdytujOferte(oferta.idOferta)}
                                >
                                    Edytuj
                                </button>
                                <button 
                                    className="bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-600/80 transition-all font-semibold"
                                    onClick={() => handleOdrzucOferte(oferta.idOferta)}
                                >
                                    Odrzuć
                                </button>
                                <button 
                                    className="bg-gray-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-gray-600/80 transition-all font-semibold"
                                    onClick={() => handleUsunOferte(oferta.idOferta)}
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

    const renderZgloszenia = () => (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center flex items-center justify-center">
                <Flag className="w-6 h-6 mr-2 text-red-600" />
                Obsługa zgłoszeń
            </h2>
            {zgloszenia.length === 0 ? (
                <div className="text-center text-gray-600">Brak zgłoszeń do rozpatrzenia</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {zgloszenia.map((zgloszenie) => (
                        <div key={zgloszenie.idZgloszenie} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                            <h4 className="text-lg font-bold mb-3 text-gray-900">
                                {zgloszenie.typ} #{zgloszenie.idZgloszenie}
                                {zgloszenie.fragmentKomentarza && <span className="text-sm text-gray-600 ml-2">(Komentarz)</span>}
                                {zgloszenie.tytulOferty && <span className="text-sm text-gray-600 ml-2">(Oferta: {zgloszenie.tytulOferty})</span>}
                            </h4>
                            <p className="mb-2"><strong>Treść:</strong> {zgloszenie.tresc}</p>
                            {zgloszenie.fragmentKomentarza && (
                                <p className="mb-2"><strong>Fragment komentarza:</strong> 
                                    <span className="bg-yellow-50 text-gray-800 p-2 rounded ml-2 text-sm">
                                        "{zgloszenie.fragmentKomentarza}..."
                                    </span>
                                </p>
                            )}
                            <p className="mb-2"><strong>Zgłoszone przez:</strong> {zgloszenie.zgloszonePrzez}</p>
                            <p className="mb-2"><strong>Data:</strong> {zgloszenie.dataDodania}</p>
                            <p className="mb-4"><strong>Status:</strong> 
                                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                    zgloszenie.status === 'Oczekujące' 
                                        ? 'bg-yellow-100/80 text-yellow-700' 
                                        : 'bg-green-100/80 text-green-700'
                                }`}>
                                    {zgloszenie.status}
                                </span>
                            </p>
                            <div className="flex space-x-3">
                                {zgloszenie.status === 'Oczekujące' && (
                                    <>
                                        <button 
                                            className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-600/80 transition-all font-semibold"
                                            onClick={() => handleRozpatrzZgloszenie(zgloszenie.idZgloszenie)}
                                        >
                                            Rozpatrz
                                        </button>
                                        <button 
                                            className="bg-purple-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-purple-600/80 transition-all font-semibold"
                                            onClick={() => handlePrzekazAdminowi(zgloszenie.idZgloszenie)}
                                        >
                                            Przekaż adminowi
                                        </button>
                                    </>
                                )}
                                <button 
                                    className="bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-600/80 transition-all font-semibold"
                                    onClick={() => handleUsunZgloszenie(zgloszenie.idZgloszenie)}
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

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8">
                    <h1 className="text-4xl font-bold mb-4 text-gray-900 text-center flex items-center justify-center">
                        <Shield className="w-10 h-10 mr-3 text-blue-600" />
                        Panel Moderatora
                    </h1>
                </div>

                <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 mb-8">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button 
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                                activeTab === 'statystyki' 
                                ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                                : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
                            }`}
                            onClick={() => setActiveTab('statystyki')}
                        >
                            <BarChart3 className="w-5 h-5 inline mr-2" />
                            Statystyki
                        </button>
                        <button 
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                                activeTab === 'komentarze' 
                                ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                                : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
                            }`}
                            onClick={() => setActiveTab('komentarze')}
                        >
                            <MessageCircle className="w-5 h-5 inline mr-2" />
                            Komentarze ({komentarze.length})
                        </button>
                        <button 
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                                activeTab === 'oferty' 
                                ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                                : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
                            }`}
                            onClick={() => setActiveTab('oferty')}
                        >
                            <ShoppingBag className="w-5 h-5 inline mr-2" />
                            Oferty ({oferty.length})
                        </button>
                        <button 
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                                activeTab === 'zgloszenia' 
                                ? 'bg-custom-blue text-white shadow-lg backdrop-blur-sm' 
                                : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-white/30'
                            }`}
                            onClick={() => setActiveTab('zgloszenia')}
                        >
                            <Flag className="w-5 h-5 inline mr-2" />
                            Zgłoszenia ({zgloszenia.length})
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 text-center">
                        <div className="text-2xl mb-4">🔄</div>
                        <div className="text-lg font-semibold">Ładowanie...</div>
                    </div>
                )}

                {!loading && (
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
                        {activeTab === 'statystyki' && renderStatystyki()}
                        {activeTab === 'komentarze' && renderKomentarze()}
                        {activeTab === 'oferty' && renderOferty()}
                        {activeTab === 'zgloszenia' && renderZgloszenia()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelModeratora;
