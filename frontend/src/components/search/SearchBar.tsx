import React, { useState, useEffect } from 'react';
import { Settings, Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  compact?: boolean; // Nowa prop dla kompaktowego trybu
  className?: string; // Klasy CSS dla kontenera
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
  showAdvancedFilters = false,
  compact = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Handler dla kliknięcia ikony w trybie kompaktowym
  const handleExpandClick = () => {
    if (compact) {
      setIsExpanded(true);
    }
  };

  // Handler dla utraty fokusa w trybie kompaktowym
  const handleBlur = () => {
    if (compact && query === '') {
      setIsExpanded(false);
    }
  };

  // Jeśli tryb kompaktowy i nie rozwinięty, pokaż tylko ikonę
  if (compact && !isExpanded) {
    return (
      <button
        onClick={handleExpandClick}
        className={`flex items-center justify-center w-10 h-10 bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/40 text-gray-600 hover:bg-white/90 transition-all duration-300 ${className}`}
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Główna wyszukiwarka */}
      <div className="relative">
        <div className="flex items-center bg-white/70 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 overflow-hidden">
          {/* Ikona */}
          <div className="flex items-center justify-center w-12 h-12 text-xl text-gray-600">
            <Search className="w-5 h-5" />
          </div>
          
          {/* Pole tekstowe */}
          <input
            type="text"
            className="flex-1 h-12 bg-transparent text-base font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 border-0"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            autoFocus={compact && isExpanded}
          />
          
          {/* Przycisk */}
          <button 
            className="px-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
            onClick={handleSearch}
          >
            Szukaj
          </button>
        </div>

        {/* Przełącznik filtrów */}
        {showAdvancedFilters && (
          <button
            className="mt-2 flex items-center justify-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur-xl rounded-xl border border-white/40 text-gray-700 font-semibold hover:bg-white/70 transition-all duration-300 text-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Settings className="w-4 h-4" />
            <span>Filtry zaawansowane</span>
            <span className="text-sm transition-transform duration-300">{showFilters ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Filtry zaawansowane */}
      {showAdvancedFilters && showFilters && (
        <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 p-6 space-y-4">
          {/* Pierwszy rząd */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Kategoria</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Sortowanie</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="hot">🔥 Najgorętsze</option>
                <option value="newest">✨ Najnowsze</option>
                <option value="price">💰 Najtańsze</option>
              </select>
            </div>
          </div>

          {/* Drugi rząd */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Cena od</label>
              <input
                type="number"
                placeholder="0 zł"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Cena do</label>
              <input
                type="number"
                placeholder="∞ zł"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-end">
              <button 
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
                onClick={clearFilters}
              >
                Wyczyść filtry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
