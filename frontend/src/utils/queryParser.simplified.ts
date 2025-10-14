/**
 * Uproszczony parser zapytań w języku naturalnym
 * 
 * Obsługuje tylko:
 * - Wykrywanie cen (do X, od X do Y, maksymalnie X)
 * - Wykrywanie kategorii (podstawowe kategorie produktów)
 * - Czyszczenie słów nieistotnych
 * 
 * Synonimy i analiza językowa są obsługiwane przez Azure AI Search:
 * - Language Analyzer (PlLucene) - automatyczna lematyzacja i stemming
 * - Synonym Maps - centralna mapa synonimów w Azure
 */

export interface ParsedQuery {
  keywords: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

/**
 * Parsuje zapytanie w języku naturalnym
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  if (!query || typeof query !== 'string') {
    return { keywords: '' };
  }

  let cleanQuery = query.toLowerCase().trim();
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  let category: string | undefined;

  // Wykryj ceny
  const priceResult = detectPrice(cleanQuery);
  minPrice = priceResult.minPrice;
  maxPrice = priceResult.maxPrice;
  cleanQuery = priceResult.cleanQuery;

  // Wykryj kategorię
  const categoryResult = detectCategory(cleanQuery);
  category = categoryResult.category;
  cleanQuery = categoryResult.cleanQuery;

  // Usuń słowa nieistotne (stop words)
  cleanQuery = removeNoiseWords(cleanQuery);

  // Wyczyść białe znaki
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

  return {
    keywords: cleanQuery,
    minPrice,
    maxPrice,
    category
  };
}

/**
 * Wykrywa ceny w zapytaniu
 * Obsługuje formaty:
 * - "do 1000", "maksymalnie 1000", "max 1000"
 * - "od 500", "minimum 500", "min 500"
 * - "od 500 do 1000", "między 500 a 1000"
 * - "500-1000", "500 - 1000"
 */
function detectPrice(query: string): { cleanQuery: string; minPrice?: number; maxPrice?: number } {
  let cleanQuery = query;
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  // Format: "od X do Y" lub "między X a Y"
  const rangeMatch = cleanQuery.match(/(?:od|między)\s+(\d+(?:[.,]\d+)?)\s+(?:do|a|i)\s+(\d+(?:[.,]\d+)?)/i);
  if (rangeMatch) {
    minPrice = parseFloat(rangeMatch[1].replace(',', '.'));
    maxPrice = parseFloat(rangeMatch[2].replace(',', '.'));
    cleanQuery = cleanQuery.replace(rangeMatch[0], '');
  }

  // Format: "X-Y" lub "X - Y"
  if (!minPrice && !maxPrice) {
    const dashRangeMatch = cleanQuery.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*(?:zł|złotych|pln)?/i);
    if (dashRangeMatch) {
      minPrice = parseFloat(dashRangeMatch[1].replace(',', '.'));
      maxPrice = parseFloat(dashRangeMatch[2].replace(',', '.'));
      cleanQuery = cleanQuery.replace(dashRangeMatch[0], '');
    }
  }

  // Format: "do X", "maksymalnie X", "max X"
  if (!maxPrice) {
    const maxMatch = cleanQuery.match(/(?:do|maksymalnie|max|maximum|poniżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|złotych|pln)?/i);
    if (maxMatch) {
      maxPrice = parseFloat(maxMatch[1].replace(',', '.'));
      cleanQuery = cleanQuery.replace(maxMatch[0], '');
    }
  }

  // Format: "od X", "minimum X", "min X"
  if (!minPrice) {
    const minMatch = cleanQuery.match(/(?:od|minimum|min|co najmniej|powyżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|złotych|pln)?/i);
    if (minMatch) {
      minPrice = parseFloat(minMatch[1].replace(',', '.'));
      cleanQuery = cleanQuery.replace(minMatch[0], '');
    }
  }

  // Format: sama liczba z waluty "1000 zł", "1000 złotych"
  if (!minPrice && !maxPrice) {
    const simpleMatch = cleanQuery.match(/(\d+(?:[.,]\d+)?)\s*(?:zł|złotych|pln)/i);
    if (simpleMatch) {
      maxPrice = parseFloat(simpleMatch[1].replace(',', '.'));
      cleanQuery = cleanQuery.replace(simpleMatch[0], '');
    }
  }

  return { cleanQuery: cleanQuery.trim(), minPrice, maxPrice };
}

/**
 * Wykrywa kategorię w zapytaniu
 * Podstawowy słownik kategorii - dla bardziej zaawansowanego rozpoznawania
 * użyj Azure AI Search z Synonym Maps lub Semantic Search
 */
function detectCategory(query: string): { cleanQuery: string; category?: string } {
  const categoryKeywords: { [key: string]: string } = {
    // Telefony
    'telefon': 'Telefony',
    'smartphone': 'Telefony',
    'smartfon': 'Telefony',
    'smartfona': 'Telefony',
    'smartfonem': 'Telefony',
    'komórka': 'Telefony',
    'komórkę': 'Telefony',
    'iphone': 'Telefony',
    'samsung': 'Telefony',
    
    // Laptopy
    'laptop': 'Laptopy',
    'laptopa': 'Laptopy',
    'laptopów': 'Laptopy',
    'notebook': 'Laptopy',
    'ultrabook': 'Laptopy',
    'chromebook': 'Laptopy',
    'macbook': 'Laptopy',
    
    // Komputery
    'komputer': 'Komputery',
    'pc': 'Komputery',
    'desktop': 'Komputery',
    
    // Audio
    'słuchawki': 'Audio',
    'słuchawek': 'Audio',
    'headset': 'Audio',
    'nauszniki': 'Audio',
    'głośnik': 'Audio',
    'głośników': 'Audio',
    'speaker': 'Audio',
    
    // Gaming
    'pad': 'Gaming',
    'kontroler': 'Gaming',
    'gamepad': 'Gaming',
    'konsola': 'Gaming',
    'ps5': 'Gaming',
    'playstation': 'Gaming',
    'xbox': 'Gaming',
    
    // TV i Monitory
    'tv': 'TV i Monitory',
    'telewizor': 'TV i Monitory',
    'monitor': 'TV i Monitory',
    'ekran': 'TV i Monitory',
    
    // Akcesoria
    'klawiatura': 'Akcesoria',
    'mysz': 'Akcesoria',
    'myszka': 'Akcesoria',
    'powerbank': 'Akcesoria',
    'ładowarka': 'Akcesoria',
    
    // Smartwatche
    'smartwatch': 'Smartwatche',
    'zegarek': 'Smartwatche',
    'smartband': 'Smartwatche',
    'opaska': 'Smartwatche',
    
    // Tablety
    'tablet': 'Tablety',
    'ipad': 'Tablety',
    
    // Fotografia
    'aparat': 'Fotografia',
    'kamera': 'Fotografia',
    'lustrzanka': 'Fotografia',
    'obiektyw': 'Fotografia'
  };

  let cleanQuery = query;
  let category: string | undefined;

  // Szukaj kategorii w zapytaniu
  for (const [keyword, cat] of Object.entries(categoryKeywords)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleanQuery)) {
      category = cat;
      // Nie usuwaj słowa kluczowego - Azure Search może go wykorzystać
      break;
    }
  }

  return { cleanQuery, category };
}

/**
 * Usuwa słowa nieistotne (stop words) z zapytania
 * Azure AI Search ma wbudowane stop words dla języka polskiego,
 * ale można dodatkowo oczyścić zapytanie
 */
function removeNoiseWords(query: string): string {
  const noiseWords = [
    'szukam', 'szukać', 'szuka', 
    'kupić', 'kupię', 'kupi', 'kupie',
    'chcę', 'chce', 'chciałbym', 'chcialbym',
    'potrzebuję', 'potrzebuje', 'potrzebny',
    'poszukuję', 'poszukuje',
    'taniego', 'tanio', 'niedrogo', 'niedrogiego',
    'dobrego', 'dobry', 'dobra', 'dobre',
    'najlepszy', 'najlepsza', 'najlepsze',
    'polecam', 'polecacie', 'polecicie'
  ];

  let cleaned = query;
  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned;
}
