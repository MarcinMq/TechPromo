import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Snowflake, MessageCircle, Sparkles } from 'lucide-react';
import { getAuthToken } from '../utils/auth';
import { authorizedFetch } from '../utils/api';

interface OfertaRekomendacja {
    id: number;
    tytul: string;
    opis: string;
    cena?: number;
    cenaPoprzednia?: number;
    typ: string;
    kategoria: string;
    autor: string;
    votes: { hot: number; cold: number };
    komentarze: number;
    zdjecia: string[];
}

interface SekcjaRekomendacjiProps {
    limit?: number;
    className?: string;
}

const API_BASE = 'http://localhost:5023';

/**
 * Sekcja "Rekomendacje dopasowane dla Ciebie"
 * Wyświetla hybrydowe rekomendacje (Collaborative Filtering + Content-Based)
 */
const SekcjaRekomendacji: React.FC<SekcjaRekomendacjiProps> = ({ limit = 6, className = '' }) => {
    const [rekomendacje, setRekomendacje] = useState<OfertaRekomendacja[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isLoggedIn = !!getAuthToken();

    useEffect(() => {
        const fetchRekomendacje = async () => {
            if (!isLoggedIn) {
                setLoading(false);
                return;
            }

            try {
                const res = await authorizedFetch(`${API_BASE}/api/rekomendacje?limit=${limit}`);
                if (res.ok) {
                    const data = await res.json();
                    setRekomendacje(data);
                } else {
                    // Silent fail - just don't show recommendations
                    setRekomendacje([]);
                }
            } catch (e) {
                setError('Błąd pobierania rekomendacji');
            } finally {
                setLoading(false);
            }
        };

        fetchRekomendacje();
    }, [isLoggedIn, limit]);

    // Nie pokazuj sekcji jeśli użytkownik nie jest zalogowany lub nie ma rekomendacji
    if (!isLoggedIn || (rekomendacje.length === 0 && !loading)) {
        return null;
    }

    if (loading) {
        return (
            <div className={`mb-8 ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Rekomendacje dopasowane dla Ciebie
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse border border-gray-200 dark:border-gray-700">
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || rekomendacje.length === 0) {
        return null;
    }

    return (
        <div className={`mb-8 ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Rekomendacje dopasowane dla Ciebie
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    Na podstawie Twoich preferencji
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rekomendacje.map((oferta) => (
                    <Link
                        key={oferta.id}
                        to={`/okazja/${oferta.id}`}
                        className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                    >
                        {/* Zdjęcie */}
                        <div className="relative h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            {oferta.zdjecia && oferta.zdjecia.length > 0 ? (
                                <img
                                    src={`${API_BASE}${oferta.zdjecia[0]}`}
                                    alt={oferta.tytul}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                    {oferta.typ === 'kupon' ? '🎫' : '🛍️'}
                                </div>
                            )}

                            {/* Badge kategorii */}
                            <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                                {oferta.kategoria}
                            </span>

                            {/* Badge "Dla Ciebie" */}
                            <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Dla Ciebie
                            </span>
                        </div>

                        {/* Treść */}
                        <div className="p-3">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {oferta.tytul}
                            </h3>

                            {/* Cena */}
                            {oferta.cena && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {oferta.cena} zł
                                    </span>
                                    {oferta.cenaPoprzednia && oferta.cenaPoprzednia > oferta.cena && (
                                        <span className="text-sm line-through text-gray-400">
                                            {oferta.cenaPoprzednia} zł
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Statystyki */}
                            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Flame className="w-4 h-4 text-red-500" />
                                    {oferta.votes.hot}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Snowflake className="w-4 h-4 text-blue-500" />
                                    {oferta.votes.cold}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    {oferta.komentarze}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SekcjaRekomendacji;
