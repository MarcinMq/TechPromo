import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import WynikiWyszukiwania from '../components/search/WynikiWyszukiwania';
import PasekWyszukiwania from '../components/search/PasekWyszukiwania';
import FallingIcons from '../components/FallingIcons';
import { parseNaturalLanguageQuery } from '../utils/queryParser.simplified';

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

interface QueryMeta {
  original: string;
  corrected: string;
  wasCorrected: boolean;
}

const StronaWyszukiwania: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [queryMeta, setQueryMeta] = useState<QueryMeta | null>(null);
  const [parsedParams, setParsedParams] = useState<{ minPrice?: number; maxPrice?: number; category?: string } | null>(null);

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    setQuery(searchQuery);

    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setQuery(searchQuery);

    try {
      // Parse zapytania w naturalnym języku TYLKO jeśli wygląda na naturalne zapytanie
      // Nie parsuj jeśli to nazwa produktu z sugestii (zawiera markę lub pełną nazwę)
      const shouldParse = /(?:do|od|max|min|szuk|potrzeb|chc)/i.test(searchQuery);

      const parsed = shouldParse ? parseNaturalLanguageQuery(searchQuery) : { keywords: searchQuery };

      // Zapisz sparsowane parametry do wyświetlenia
      if (parsed.minPrice || parsed.maxPrice || parsed.category) {
        setParsedParams({
          minPrice: parsed.minPrice,
          maxPrice: parsed.maxPrice,
          category: parsed.category
        });
      } else {
        setParsedParams(null);
      }

      // Buduj URL z parametrami
      const params = new URLSearchParams();

      // Użyj sparsowanych słów kluczowych lub oryginalnego zapytania
      // Synonimy są obsługiwane przez Azure AI Search Synonym Maps
      const finalQuery = parsed.keywords || searchQuery;
      if (finalQuery.trim()) {
        params.append('q', finalQuery);
      }

      if (parsed.minPrice) {
        params.append('MinCena', parsed.minPrice.toString());
      }
      if (parsed.maxPrice) {
        params.append('MaxCena', parsed.maxPrice.toString());
      }
      // NIE dodajemy automatycznego filtra kategorii - Azure AI Search lepiej wyszukuje
      // Uzytkownik moze recznie wybrac kategorie z filtrow
      // if (parsed.category) {
      //   params.append('Kategoria', parsed.category);
      // }

      // Wykonaj zapytanie do backendu
      const response = await fetch(`http://localhost:5023/api/wyszukiwarka?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania wyników wyszukiwania');
      }

      const data = await response.json();

      // Zapisz metadane zapytania (korekta literówek)
      if (data.queryMeta) {
        setQueryMeta(data.queryMeta);
      } else {
        setQueryMeta(null);
      }

      // Mapuj wyniki z API na interfejs SearchResult
      const mappedResults: SearchResult[] = data.items.map((item: any) => ({
        id: item.document.ofertaId,
        title: item.document.nazwa,
        price: item.document.cena,
        originalPrice: item.document.cenaPoprzednia,
        category: item.document.kategoria,
        shop: item.document.sklep,
        votes: {
          hot: item.document.liczbaHot,
          cold: item.document.liczbaCold
        },
        image: item.document.zdjecie ? `http://localhost:5023${item.document.zdjecie}` : undefined
      }));

      setResults(mappedResults);

      // Aktualizuj URL
      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      }

    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      setResults([]);
      setParsedParams(null);
      setQueryMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    performSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestionId: number) => {
    // Przekieruj bezpośrednio do oferty
    navigate(`/okazja/${suggestionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors pb-20 lg:pb-0 relative">
      {/* Falling icons background */}
      <FallingIcons />

      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 py-4 sm:py-6 relative z-10">
        {/* Nagłówek wyszukiwania */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 sm:p-6 transition-colors">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2 sm:gap-3 transition-colors">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              Wyszukiwanie okazji
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors">
              Znajdź najlepsze promocje z tysięcy sklepów internetowych
            </p>
          </div>
        </div>

        {/* Pasek wyszukiwania */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 transition-colors">
            <PasekWyszukiwania
              onSearch={handleSearch}
              showAdvancedFilters={true}
              placeholder="Np. 'szukam laptopa do 3000zł' lub 'smartfon od 2000 do 4000'"
            />
          </div>
        </div>

        {/* Sparsowane parametry (jeśli wykryto) */}
        {parsedParams && (parsedParams.minPrice || parsedParams.maxPrice || parsedParams.category) && (
          <div className="mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🎯 Wykryto automatycznie:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedParams.category && (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-md text-sm font-medium">
                        🏷️ {parsedParams.category}
                      </span>
                    )}
                    {parsedParams.minPrice && (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-md text-sm font-medium">
                        💰 Od {parsedParams.minPrice} zł
                      </span>
                    )}
                    {parsedParams.maxPrice && (
                      <span className="inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-md text-sm font-medium">
                        💰 Do {parsedParams.maxPrice} zł
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner korekty literówki */}
        {queryMeta?.wasCorrected && results.length > 0 && (
          <div className="mb-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg p-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 dark:text-yellow-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ✨ Wyświetlam wyniki dla <strong className="font-bold">"{queryMeta.corrected}"</strong> zamiast <span className="line-through text-yellow-600 dark:text-yellow-400">{queryMeta.original}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informacja o wyszukiwaniu AI */}
        {query && !queryMeta?.wasCorrected && results.length > 0 && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-colors">
              <div className="flex items-center gap-2">
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  🔍 Azure AI Search automatycznie rozpoznaje synonimy i literówki
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wyniki */}
        <WynikiWyszukiwania
          results={results}
          query={query}
          loading={loading}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Wskazówki */}
        {!query && !loading && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6 transition-colors">
                💡 Wskazówki wyszukiwania
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 text-center hover:shadow-md transition-all duration-300 border border-blue-200 dark:border-blue-800">
                  <div className="text-4xl mb-3">💬</div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Naturalny język</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    "szukam telefonu do 1000zł"
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 text-center hover:shadow-md transition-all duration-300 border border-purple-200 dark:border-purple-800">
                  <div className="text-4xl mb-3">💰</div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Zakres cenowy</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    "laptop od 3000 do 5000 zł"
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 text-center hover:shadow-md transition-all duration-300 border border-green-200 dark:border-green-800">
                  <div className="text-4xl mb-3">📱</div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Nazwa produktu</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    "smartfon z aparatem 108MP"
                  </p>
                </div>
              </div>

              {/* Dodatkowe przykłady */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                  <strong className="text-gray-900 dark:text-gray-100">Więcej przykładów:</strong>
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleSearch("słuchawki bluetooth do 200")}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    słuchawki bluetooth do 200
                  </button>
                  <button
                    onClick={() => handleSearch("pad do ps5")}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    pad do ps5
                  </button>
                  <button
                    onClick={() => handleSearch("monitor gaming od 1000")}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    monitor gaming od 1000
                  </button>
                  <button
                    onClick={() => handleSearch("telewizor 4K poniżej 3000")}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    telewizor 4K poniżej 3000
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StronaWyszukiwania;
