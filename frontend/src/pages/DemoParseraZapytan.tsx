import React, { useState } from 'react';
import { parseNaturalLanguageQuery } from '../utils/queryParser';
import { Search, CheckCircle2 } from 'lucide-react';

/**
 * Strona demonstracyjna parsera zapytań w naturalnym języku
 * Pokazuje, jak działa parsowanie różnych formatów zapytań
 */
const QueryParserDemo: React.FC = () => {
  const [testQuery, setTestQuery] = useState('szukam telefonu do 1000zł');
  const [parsedResult, setParsedResult] = useState(parseNaturalLanguageQuery('szukam telefonu do 1000zł'));

  const handleQueryChange = (query: string) => {
    setTestQuery(query);
    setParsedResult(parseNaturalLanguageQuery(query));
  };

  const exampleQueries = [
    "szukam telefonu do 1000zł",
    "laptop gaming od 3000 do 5000 zł",
    "słuchawki bluetooth do 200",
    "telewizor sony poniżej 3000",
    "smartfon premium max 4500",
    "monitor od 1000",
    "500-1500 zł telefon Samsung",
    "gaming laptop 5000 zł",
    "mysz komputerowa do 100 zł",
    "drukarka HP od 500 do 1000"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Nagłówek */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Parser zapytań w naturalnym języku
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test parsowania zapytań wyszukiwania z automatycznym wykrywaniem cen i kategorii
          </p>
        </div>

        {/* Input testowy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            Wpisz zapytanie testowe:
          </label>
          <input
            type="text"
            value={testQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="np. szukam telefonu do 1000zł"
          />
        </div>

        {/* Wyniki parsowania */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            Wynik parsowania:
          </h2>

          <div className="space-y-3">
            {/* Keywords */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-1 uppercase tracking-wide">
                Słowa kluczowe
              </p>
              <p className="text-lg font-mono text-blue-700 dark:text-blue-300">
                {parsedResult.keywords || '(brak)'}
              </p>
            </div>

            {/* Cena minimalna */}
            {parsedResult.minPrice && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-xs font-bold text-green-900 dark:text-green-100 mb-1 uppercase tracking-wide">
                  Cena minimalna
                </p>
                <p className="text-lg font-mono text-green-700 dark:text-green-300">
                  {parsedResult.minPrice} zł
                </p>
              </div>
            )}

            {/* Cena maksymalna */}
            {parsedResult.maxPrice && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-xs font-bold text-orange-900 dark:text-orange-100 mb-1 uppercase tracking-wide">
                  Cena maksymalna
                </p>
                <p className="text-lg font-mono text-orange-700 dark:text-orange-300">
                  {parsedResult.maxPrice} zł
                </p>
              </div>
            )}

            {/* Kategoria */}
            {parsedResult.category && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-100 mb-1 uppercase tracking-wide">
                  Kategoria (wykryta)
                </p>
                <p className="text-lg font-mono text-purple-700 dark:text-purple-300">
                  {parsedResult.category}
                </p>
              </div>
            )}

            {/* Jeśli nic nie wykryto */}
            {!parsedResult.minPrice && !parsedResult.maxPrice && !parsedResult.category && (
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Brak wykrytych parametrów - użyto tylko słów kluczowych
                </p>
              </div>
            )}
          </div>

          {/* URL API który zostanie wysłany */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Parametry API:
            </p>
            <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
              <code className="text-xs text-green-400 font-mono">
                {(() => {
                  const params = new URLSearchParams();
                  params.append('q', parsedResult.keywords || testQuery);
                  if (parsedResult.minPrice) params.append('MinCena', parsedResult.minPrice.toString());
                  if (parsedResult.maxPrice) params.append('MaxCena', parsedResult.maxPrice.toString());
                  if (parsedResult.category) params.append('Kategoria', parsedResult.category);
                  return `/api/wyszukiwarka?${params.toString()}`;
                })()}
              </code>
            </div>
          </div>
        </div>

        {/* Przykładowe zapytania */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Przykładowe zapytania do testów:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleQueryChange(query)}
                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${testQuery === query
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Dokumentacja formatów */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            📚 Wspierane formaty:
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span><strong>Maksymalna cena:</strong> "do 1000zł", "max 1000", "poniżej 1000"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span><strong>Minimalna cena:</strong> "od 500zł", "min 500", "powyżej 500"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span><strong>Zakres cenowy:</strong> "od 500 do 1000", "500-1000 zł"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span><strong>Wykrywanie kategorii:</strong> automatyczne na podstawie słów kluczowych</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span><strong>Usuwanie szumu:</strong> "szukam", "chcę", "potrzebuję" itp.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QueryParserDemo;
