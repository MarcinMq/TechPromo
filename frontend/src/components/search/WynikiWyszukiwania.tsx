import React, { useState, useEffect } from 'react';
import { Flame, Snowflake, Search, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  shop: string;
  votes: { hot: number; cold: number };
  image?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onSuggestionClick?: (suggestionId: number) => void;
}

interface Suggestion {
  id: number;
  tekst: string;
}

const WynikiWyszukiwania: React.FC<SearchResultsProps> = ({ results, query, loading = false, onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Pobierz sugestie gdy brak wyników
  useEffect(() => {
    if (results.length === 0 && query && query.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          setLoadingSuggestions(true);
          const response = await fetch(`/api/wyszukiwarka/sugestie?q=${encodeURIComponent(query)}&liczba=5`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data || []);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [results.length, query]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center transition-colors">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">Wyszukuję najlepsze okazje...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center transition-colors">
        <div className="flex flex-col items-center space-y-6">
          <Search className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Brak wyników dla "{query}"
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md transition-colors">
            Spróbuj użyć innych słów kluczowych lub zmienić filtry wyszukiwania.
          </p>

          {/* Sugestie alternatywne */}
          {loadingSuggestions ? (
            <div className="mt-6">
              <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : suggestions.length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Czy chodziło Ci o:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick && onSuggestionClick(suggestion.id)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    {suggestion.tekst}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nagłówek z wynikami */}
      {query && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              Wyniki dla: <span className="text-blue-600 dark:text-blue-400">"{query}"</span>
            </h2>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
              {results.length} {results.length === 1 ? 'oferta' : results.length < 5 ? 'oferty' : 'ofert'}
            </span>
          </div>
        </div>
      )}
      
      {/* Siatka wyników */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map(result => {
          const temperature = result.votes.hot - result.votes.cold;
          const discount = result.originalPrice && result.price > 0 
            ? Math.round((1 - result.price / result.originalPrice) * 100) 
            : 0;

          return (
            <Link 
              key={result.id} 
              to={`/okazja/${result.id}`}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
            >
              {/* Obraz */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-colors overflow-hidden">
                {result.image ? (
                  <img 
                    src={result.image} 
                    alt={result.title} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="text-6xl opacity-30">📦</div>
                )}
                
                {/* Badge z rabatem */}
                {discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-600 dark:bg-red-700 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    -{discount}%
                  </div>
                )}

                {/* Badge z temperaturą */}
                <div className={`absolute top-2 left-2 ${
                  temperature > 100 ? 'bg-gradient-to-r from-red-600 to-orange-600' :
                  temperature > 50 ? 'bg-orange-500' :
                  temperature > 0 ? 'bg-blue-500' :
                  'bg-gray-500'
                } text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1`}>
                  {temperature > 0 ? <Flame className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
                  {temperature > 0 ? '+' : ''}{temperature}°
                </div>
              </div>
              
              {/* Treść */}
              <div className="p-4">
                {/* Kategoria */}
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 transition-colors">
                  {result.category}
                </p>
                
                {/* Tytuł */}
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[2.5rem]">
                  {result.title}
                </h3>
                
                {/* Cena */}
                <div className="mb-3">
                  {result.price === 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-md font-bold text-sm transition-colors">
                      <Gift className="w-4 h-4" />
                      GRATIS
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors">
                        {result.price.toFixed(2)} zł
                      </span>
                      {result.originalPrice && (
                        <span className="text-sm line-through text-gray-400 dark:text-gray-500 transition-colors">
                          {result.originalPrice.toFixed(2)} zł
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Sklep */}
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium transition-colors truncate">
                    🏪 {result.shop}
                  </p>
                </div>
                
                {/* Głosy */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-md text-xs font-bold transition-colors">
                    <Flame className="w-3 h-3" />
                    {result.votes.hot}
                  </div>
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-bold transition-colors">
                    <Snowflake className="w-3 h-3" />
                    {result.votes.cold}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WynikiWyszukiwania;
