import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle, MessageCircle, AlertTriangle, X, Edit, Trash2, ThumbsUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../utils/auth';

interface Powiadomienie {
    id: number;
    typ: string;
    tresc: string;
    dataUtworzenia: string;
    przeczytane: boolean;
    idOferta?: number;
    idKomentarz?: number;
}

const PowiadomieniaDropdown: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [powiadomienia, setPowiadomienia] = useState<Powiadomienie[]>([]);
    const [nieprzeczytane, setNieprzeczytane] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Pobierz liczbę nieprzeczytanych
    const fetchLiczba = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const res = await fetch('/api/uzytkownik/powiadomienia/nieprzeczytane/liczba', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const count = await res.json();
                setNieprzeczytane(count);
            }
        } catch (err) {
            console.error('Błąd pobierania liczby powiadomień:', err);
        }
    };

    // Pobierz powiadomienia
    const fetchPowiadomienia = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const res = await fetch('/api/uzytkownik/powiadomienia?limit=20', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPowiadomienia(data);
            }
        } catch (err) {
            console.error('Błąd pobierania powiadomień:', err);
        } finally {
            setLoading(false);
        }
    };

    // Oznacz jako przeczytane
    const oznaczPrzeczytane = async (id: number) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            await fetch(`/api/uzytkownik/powiadomienia/${id}/przeczytane`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setPowiadomienia(prev =>
                prev.map(p => p.id === id ? { ...p, przeczytane: true } : p)
            );
            setNieprzeczytane(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Błąd oznaczania powiadomienia:', err);
        }
    };

    // Oznacz wszystkie jako przeczytane
    const oznaczWszystkie = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            await fetch('/api/uzytkownik/powiadomienia/przeczytaj-wszystkie', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setPowiadomienia(prev => prev.map(p => ({ ...p, przeczytane: true })));
            setNieprzeczytane(0);
        } catch (err) {
            console.error('Błąd oznaczania wszystkich:', err);
        }
    };

    // Pobierz liczbę przy mount i co 30 sekund
    useEffect(() => {
        fetchLiczba();
        const interval = setInterval(fetchLiczba, 30000);
        return () => clearInterval(interval);
    }, []);

    // Pobierz powiadomienia gdy dropdown się otworzy
    useEffect(() => {
        if (isOpen) {
            fetchPowiadomienia();
        }
    }, [isOpen]);

    // Zamknij dropdown po kliknięciu poza
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ikona dla typu powiadomienia
    const getIcon = (typ: string) => {
        switch (typ) {
            case 'Komentarz': return <MessageCircle className="w-4 h-4 text-blue-500" />;
            case 'Głos': return <ThumbsUp className="w-4 h-4 text-green-500" />;
            case 'Zatwierdzenie': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Zgłoszenie': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'Ostrzeżenie': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'Odrzucenie': return <X className="w-4 h-4 text-red-500" />;
            case 'Edycja': return <Edit className="w-4 h-4 text-purple-500" />;
            case 'Usunięcie': return <Trash2 className="w-4 h-4 text-red-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    // Formatuj datę
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Teraz';
        if (diffMins < 60) return `${diffMins} min temu`;
        if (diffHours < 24) return `${diffHours} godz. temu`;
        if (diffDays < 7) return `${diffDays} dni temu`;
        return date.toLocaleDateString('pl-PL');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Przycisk dzwonka */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Powiadomienia"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {nieprzeczytane > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {nieprzeczytane > 9 ? '9+' : nieprzeczytane}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Powiadomienia</h3>
                        {nieprzeczytane > 0 && (
                            <button
                                onClick={oznaczWszystkie}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Przeczytaj wszystkie
                            </button>
                        )}
                    </div>

                    {/* Lista powiadomień */}
                    <div className="overflow-y-auto max-h-72">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Ładowanie...</div>
                        ) : powiadomienia.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                Brak powiadomień
                            </div>
                        ) : (
                            powiadomienia.map(p => (
                                <div
                                    key={p.id}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${!p.przeczytane ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    onClick={() => {
                                        if (!p.przeczytane) oznaczPrzeczytane(p.id);
                                        if (p.idOferta) {
                                            navigate(`/okazja/${p.idOferta}`);
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getIcon(p.typ)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!p.przeczytane ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {p.tresc}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400">{formatDate(p.dataUtworzenia)}</span>
                                                {p.idOferta && (
                                                    <Link
                                                        to={`/okazja/${p.idOferta}`}
                                                        className="text-xs text-blue-600 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Przejdź do oferty
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {!p.przeczytane && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PowiadomieniaDropdown;
