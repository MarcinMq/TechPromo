import React, { useState, useEffect, useRef } from 'react';
import { Settings, Search, Sparkles } from 'lucide-react';

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

interface Suggestion {
  id: number;
  tekst: string;
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const suggestionsTimeoutRef = useRef<number | undefined>(undefined);

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

  // Pobierz sugestie z Azure AI Search
  useEffect(() => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestionsTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/wyszukiwarka/sugestie?q=${encodeURIComponent(query)}&liczba=8`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania sugestii:', error);
      }
    }, 300); // Debounce 300ms

    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [query]);

  // Zamknij sugestie po kliknięciu poza komponentem
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch(query, filters);
    setQuery(''); // czyszczenie po wyszukaniu
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        // Wybierz aktywną sugestię
        const selectedSuggestion = suggestions[activeSuggestionIndex];
        handleSuggestionClick(selectedSuggestion);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Przekieruj bezpośrednio do oferty używając ID z sugestii
    window.location.href = `/okazja/${suggestion.id}`;
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

  // Jeśli tryb kompaktowy i nie rozwinięty, pokaż tylko ikonę
  if (compact && !isExpanded) {
    return (
      <button
        onClick={handleExpandClick}
        className={`flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 hover:border-white/30 text-white hover:scale-105 transition-all duration-300 ${className}`}
      >
        <Search className="w-5 h-5 drop-shadow-lg" />
      </button>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Główna wyszukiwarka */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 dark:border-gray-600/40 overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Ikona */}
          <div className="flex items-center justify-center w-12 h-12 text-xl text-gray-600 dark:text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          
          {/* Pole tekstowe */}
          <input
            type="text"
            className="flex-1 h-12 bg-transparent text-base font-medium text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 border-0 transition-colors"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoFocus={compact && isExpanded}
          />
          
          {/* Przycisk - Gradient */}
          <button 
            className="group relative overflow-hidden px-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            onClick={handleSearch}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Sparkles className="relative w-4 h-4" />
            <span className="relative">Szukaj</span>
          </button>
        </div>

        {/* Dropdown z sugestiami */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            {/* Naglowek Sugestie AI */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sugestie AI</span>
              </div>
            </div>
            
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    index === activeSuggestionIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>{suggestion.tekst}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
