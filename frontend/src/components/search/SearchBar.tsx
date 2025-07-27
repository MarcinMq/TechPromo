import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
}

interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'newest' | 'hot' | 'price';
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Wyszukaj okazje... (np. iPhone, laptop, słuchawki)",
  showAdvancedFilters = false 
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'hot'
  });

  // Załaduj kategorie z API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/oferta/kategorie');
        if (response.ok) {
          const categoryNames = await response.json();
          const categoryList = categoryNames.map((name: string) => ({
            id: name.toLowerCase(),
            name: name
          }));
          setCategories(categoryList);
        }
      } catch (error) {
        console.error('Błąd podczas ładowania kategorii:', error);
      }
    };

    loadCategories();
  }, []);

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Automatyczne wyszukiwanie przy zmianie filtrów
    if (query || Object.values(newFilters).some(v => v)) {
      onSearch(query, newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'hot' });
    setQuery('');
    onSearch('', { sortBy: 'hot' });
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          {/* AI Search Badge - przygotowane na przyszłość */}
          <div className="ai-badge" title="Wkrótce: Wyszukiwanie AI">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">AI</span>
          </div>
          
          <button 
            className="search-button"
            onClick={handleSearch}
          >
            Szukaj
          </button>
        </div>

        {showAdvancedFilters && (
          <button
            className="filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="filter-icon">⚙️</span>
            Filtry {showFilters ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <div className="advanced-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label>Kategoria:</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sortowanie:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="hot">🔥 Najgorętsze</option>
                <option value="newest">🆕 Najnowsze</option>
                <option value="price">💰 Najtańsze</option>
              </select>
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Cena od:</label>
              <input
                type="number"
                placeholder="0 zł"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="filter-group">
              <label>Cena do:</label>
              <input
                type="number"
                placeholder="∞ zł"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={clearFilters}>
                Wyczyść filtry
              </button>
            </div>
          </div>

          {/* AI Search Preview - przygotowane na przyszłość */}
          <div className="ai-search-preview">
            <div className="ai-feature-badge">
              <span className="ai-icon">🚀</span>
              <div className="ai-feature-text">
                <strong>Wkrótce: Inteligentne wyszukiwanie AI</strong>
                <p>Szukaj naturalnym językiem: "laptop do pracy za mniej niż 3000 zł"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
