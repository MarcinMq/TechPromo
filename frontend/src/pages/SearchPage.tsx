import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchResults from '../components/search/SearchResults';
import SearchBar from '../components/search/SearchBar';

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

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    setQuery(searchQuery);
    
    if (searchQuery) {
      performSearch(searchQuery, {});
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, filters: any) => {
    setLoading(true);
    setQuery(searchQuery);

    try {
      // TODO: Integracja z API backendu
      // Na razie symulujemy wyniki wyszukiwania
      await new Promise(resolve => setTimeout(resolve, 1000)); // Symulacja opóźnienia

      const mockResults: SearchResult[] = [
        {
          id: 1,
          title: "iPhone 15 Pro 128GB - Super promocja!",
          price: 4599,
          originalPrice: 5999,
          category: "Telefony",
          shop: "Media Expert",
          votes: { hot: 124, cold: 8 }
        },
        {
          id: 2,
          title: "Samsung Galaxy Watch 6 44mm",
          price: 899,
          originalPrice: 1299,
          category: "Smartwatche", 
          shop: "RTV Euro AGD",
          votes: { hot: 89, cold: 12 }
        },
        {
          id: 3,
          title: "Sony WH-1000XM5 Słuchawki bezprzewodowe",
          price: 1199,
          originalPrice: 1599,
          category: "Audio",
          shop: "x-kom",
          votes: { hot: 156, cold: 3 }
        }
      ];

      // Filtruj wyniki na podstawie zapytania
      const filteredResults = searchQuery 
        ? mockResults.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mockResults;

      setResults(filteredResults);
      
      // Aktualizuj URL
      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      }

    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string, filters: any) => {
    performSearch(searchQuery, filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Nagłówek */}
        <div className="relative mb-12">
          {/* Blur circles */}
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/40 p-12 text-center overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>
            
            <div className="relative z-10">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                🔍 Wyszukiwanie okazji
              </h1>
              <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
                Znajdź najlepsze promocje z tysięcy sklepów internetowych
              </p>
            </div>
          </div>
        </div>

        {/* Pasek wyszukiwania */}
        <div className="relative mb-12">
          <div className="bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 overflow-hidden">
            {/* Nakładka wyszukiwania */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10"></div>
            
            <div className="relative z-10">
              <SearchBar 
                onSearch={handleSearch}
                showAdvancedFilters={true}
                placeholder="Wyszukaj okazje... (np. iPhone, laptop gaming, słuchawki)"
              />
            </div>
          </div>
        </div>

        {/* Wyniki */}
        <SearchResults 
          results={results}
          query={query}
          loading={loading}
        />

        {/* Wskazówki */}
        {!query && !loading && (
          <div className="relative mt-12">
            {/* Blur circles */}
            <div className="absolute -top-8 -left-8 w-48 h-48 bg-gradient-to-br from-green-400/15 to-blue-600/15 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-gradient-to-br from-purple-400/15 to-pink-600/15 rounded-full blur-3xl"></div>
            
            <div className="relative bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 overflow-hidden">
              {/* Nakładka wskazówek */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-gray-900 text-center mb-10 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  💡 Wskazówki wyszukiwania
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 text-center hover:shadow-3xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-2">
                    {/* Nakładka wskazówki */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-6">🔤</div>
                      <h4 className="text-xl font-black text-gray-900 mb-4">Używaj słów kluczowych</h4>
                      <p className="text-gray-700 font-medium">np. "iPhone 15", "laptop gaming", "słuchawki bluetooth"</p>
                    </div>
                  </div>
                  <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 text-center hover:shadow-3xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-2">
                    {/* Nakładka wskazówki */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-6">🏷️</div>
                      <h4 className="text-xl font-black text-gray-900 mb-4">Filtruj po kategorii</h4>
                      <p className="text-gray-700 font-medium">Użyj filtrów, aby zawęzić wyniki do konkretnej kategorii</p>
                    </div>
                  </div>
                  <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 text-center hover:shadow-3xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-2">
                    {/* Nakładka wskazówki */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-6">💰</div>
                      <h4 className="text-xl font-black text-gray-900 mb-4">Ustaw budżet</h4>
                      <p className="text-gray-700 font-medium">Określ zakres cenowy w zaawansowanych filtrach</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
