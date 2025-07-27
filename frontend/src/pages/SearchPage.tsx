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
    <div className="search-page">
      <div className="search-page-container">
        {/* Page Header */}
        <div className="search-page-header">
          <h1>🔍 Wyszukiwanie okazji</h1>
          <p>Znajdź najlepsze promocje z tysięcy sklepów internetowych</p>
        </div>

        {/* Search Bar */}
        <div className="search-page-bar">
          <SearchBar 
            onSearch={handleSearch}
            showAdvancedFilters={true}
            placeholder="Wyszukaj okazje... (np. iPhone, laptop gaming, słuchawki)"
          />
        </div>

        {/* AI Features Info */}
        <div className="ai-search-info">
          <div className="ai-info-card">
            <div className="ai-info-icon">🤖</div>
            <div className="ai-info-text">
              <strong>Wkrótce: Inteligentne wyszukiwanie AI z Azure</strong>
              <p>Szukaj naturalnym językiem i otrzymuj spersonalizowane rekomendacje</p>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <SearchResults 
          results={results}
          query={query}
          loading={loading}
        />

        {/* Search Tips */}
        {!query && !loading && (
          <div className="search-tips">
            <h3>💡 Wskazówki wyszukiwania</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">🔤</div>
                <div className="tip-content">
                  <h4>Używaj słów kluczowych</h4>
                  <p>np. "iPhone 15", "laptop gaming", "słuchawki bluetooth"</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🏷️</div>
                <div className="tip-content">
                  <h4>Filtruj po kategorii</h4>
                  <p>Użyj filtrów, aby zawęzić wyniki do konkretnej kategorii</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">💰</div>
                <div className="tip-content">
                  <h4>Ustaw budżet</h4>
                  <p>Określ zakres cenowy w zaawansowanych filtrach</p>
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
