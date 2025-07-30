import React from 'react';
import { Flame, Snowflake, Search } from 'lucide-react';

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
      <div className="relative bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold text-gray-700">Wyszukuję najlepsze okazje...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="relative bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 text-center">
        <div className="flex flex-col items-center space-y-6">
          <Search className="w-16 h-16 text-gray-400" />
          <h3 className="text-2xl font-black text-gray-900 mb-4">Brak wyników dla "{query}"</h3>
          <p className="text-lg text-gray-700 font-medium max-w-md">
            Spróbuj użyć innych słów kluczowych lub zmienić filtry wyszukiwania.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Nagłówek */}
      {query && (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-gray-900">Wyniki dla: "{query}"</h3>
            <span className="text-lg font-bold text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl">
              Znaleziono {results.length} ofert
            </span>
          </div>
        </div>
      )}
      
      {/* Siatka */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map(result => (
          <div key={result.id} className="group relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-3 transition-all duration-500 border border-white/40 hover:shadow-3xl">
            {/* Nakładka karty */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              {/* Obraz */}
              <div className="relative h-48 bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm flex items-center justify-center">
                {result.image ? (
                  <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl">📦</div>
                )}
                {result.originalPrice && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-2xl backdrop-blur-sm shadow-lg">
                    -{Math.round((1 - result.price / result.originalPrice) * 100)}%
                  </div>
                )}
              </div>
              
              {/* Treść */}
              <div className="p-8">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{result.category}</p>
                  <h4 className="text-xl font-black text-gray-900 mt-2 leading-tight">{result.title}</h4>
                </div>
                
                {/* Ceny */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-black text-red-600">{result.price.toFixed(2)} zł</span>
                    {result.originalPrice && (
                      <span className="text-lg line-through text-gray-400">{result.originalPrice.toFixed(2)} zł</span>
                    )}
                  </div>
                </div>
                
                {/* Sklep */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 font-medium">🏪 {result.shop}</p>
                </div>
                
                {/* Głosy */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
                  <div className="flex space-x-3">
                    <span className="flex items-center space-x-1 bg-gradient-to-r from-red-100 to-pink-100 backdrop-blur-sm text-red-600 px-3 py-1 rounded-2xl font-bold text-sm">
                      <Flame className="w-4 h-4" />
                      <span>{result.votes.hot}</span>
                    </span>
                    <span className="flex items-center space-x-1 bg-gradient-to-r from-blue-100 to-cyan-100 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-2xl font-bold text-sm">
                      <Snowflake className="w-4 h-4" />
                      <span>{result.votes.cold}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
