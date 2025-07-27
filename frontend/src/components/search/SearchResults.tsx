import React from 'react';

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
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, loading = false }) => {
  if (loading) {
    return (
      <div className="search-results-container">
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Wyszukuję najlepsze okazje...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="search-results-container">
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>Brak wyników dla "{query}"</h3>
          <p>Spróbuj użyć innych słów kluczowych lub zmienić filtry wyszukiwania.</p>
          
          {/* AI Suggestion - przygotowane na przyszłość */}
          <div className="ai-suggestion">
            <div className="ai-suggestion-icon">🤖</div>
            <div className="ai-suggestion-text">
              <strong>Sugestia AI:</strong>
              <p>Może Cię zainteresować: "laptop gaming", "słuchawki bezprzewodowe", "smartfon"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      {query && (
        <div className="search-results-header">
          <h3>Wyniki dla: "{query}"</h3>
          <span className="results-count">Znaleziono {results.length} ofert</span>
        </div>
      )}
      
      <div className="search-results-grid">
        {results.map(result => (
          <div key={result.id} className="search-result-card">
            <div className="result-image">
              {result.image ? (
                <img src={result.image} alt={result.title} />
              ) : (
                <div className="result-placeholder">📦</div>
              )}
            </div>
            
            <div className="result-content">
              <div className="result-category">{result.category}</div>
              <h4 className="result-title">{result.title}</h4>
              
              <div className="result-prices">
                <span className="result-price">{result.price.toFixed(2)} zł</span>
                {result.originalPrice && (
                  <>
                    <span className="result-original-price">{result.originalPrice.toFixed(2)} zł</span>
                    <span className="result-discount">
                      -{Math.round((1 - result.price / result.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              
              <div className="result-shop">🏪 {result.shop}</div>
              
              <div className="result-votes">
                <span className="hot-votes">🔥 {result.votes.hot}</span>
                <span className="cold-votes">❄️ {result.votes.cold}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
