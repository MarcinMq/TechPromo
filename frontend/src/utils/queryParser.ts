/**
 * Parser zapytań w naturalnym języku
 * Wyciąga parametry jak cena, kategoria itp. z tekstu
 */

export interface ParsedQuery {
  keywords: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

/**
 * Parsuje zapytanie w naturalnym języku
 * Przykłady:
 * - "szukam telefonu do 1000zł"
 * - "laptop gaming od 3000 do 5000 zł"
 * - "słuchawki bluetooth do 200"
 * - "telewizor sony poniżej 3000"
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    keywords: query.toLowerCase().trim()
  };

  // 1. Wykryj ceny w różnych formatach
  const pricePatterns = [
    // "do 1000zł", "do 1000 zł", "do 1000", "do 1500zl"
    /(?:do|max|maksymalnie|poniżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "od 500 do 1000", "500-1000", "500 - 1000 zł"
    /(?:od\s+)?(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?\s*(?:[-–—]|do)\s*(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "od 500zł", "od 500", "minimum 500"
    /(?:od|min|minimum|powyżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "1000zł", "1000 zł", "1500zl" (pojedyncza cena - traktuj jako max)
    /^.*?(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)\s*$/i
  ];

  // Sprawdź pattern "do X"
  const maxPriceMatch = query.match(pricePatterns[0]);
  if (maxPriceMatch) {
    result.maxPrice = parseFloat(maxPriceMatch[1].replace(',', '.'));
    // Usuń z keywords
    result.keywords = result.keywords.replace(pricePatterns[0], '').trim();
  }

  // Sprawdź pattern "od X do Y"
  const rangePriceMatch = query.match(pricePatterns[1]);
  if (rangePriceMatch && !maxPriceMatch) {
    result.minPrice = parseFloat(rangePriceMatch[1].replace(',', '.'));
    result.maxPrice = parseFloat(rangePriceMatch[2].replace(',', '.'));
    // Usuń z keywords
    result.keywords = result.keywords.replace(pricePatterns[1], '').trim();
  }

  // Sprawdź pattern "od X"
  const minPriceMatch = query.match(pricePatterns[2]);
  if (minPriceMatch && !maxPriceMatch && !rangePriceMatch) {
    result.minPrice = parseFloat(minPriceMatch[1].replace(',', '.'));
    // Usuń z keywords
    result.keywords = result.keywords.replace(pricePatterns[2], '').trim();
  }

  // Sprawdź pojedynczą cenę (jeśli nie znaleziono innych)
  const singlePriceMatch = query.match(pricePatterns[3]);
  if (singlePriceMatch && !maxPriceMatch && !rangePriceMatch && !minPriceMatch) {
    // Pojedyncza cena - domyślnie jako maksymalna
    result.maxPrice = parseFloat(singlePriceMatch[1].replace(',', '.'));
    // Usuń z keywords
    result.keywords = result.keywords.replace(/\d+(?:[.,]\d+)?\s*(?:zł|pln|zl)/i, '').trim();
  }

  // 2. Usuń typowe "słowa szumu"
  const noiseWords = [
    'szukam', 'szukać', 'znajdź', 'znaleźć', 'pokaż', 'pokazać',
    'chcę', 'chciałbym', 'potrzebuję', 'potrzebuje',
    'jakiś', 'jakieś', 'jakiś', 'jakąś',
    'dobry', 'dobra', 'dobre', 'tani', 'tania', 'tanie',
    'szybki', 'szybka', 'szybkie', 'wydajny', 'wydajna', 'wydajne',
    'mocny', 'mocna', 'mocne', 'mały', 'mała', 'małe',
    'duży', 'duża', 'duże', 'nowy', 'nowa', 'nowe'
  ];

  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result.keywords = result.keywords.replace(regex, '');
  });

  // 3. Wykryj kategorie (opcjonalne - możesz rozbudować)
  const categoryKeywords: { [key: string]: string } = {
    'telefon': 'Telefony',
    'smartphone': 'Telefony',
    'smartfon': 'Telefony',
    'smartfona': 'Telefony',
    'smartfonem': 'Telefony',
    'iphone': 'Telefony',
    'samsung': 'Telefony',
    'xiaomi': 'Telefony',
    'laptop': 'Laptopy',
    'notebook': 'Laptopy',
    'komputer': 'Komputery',
    'słuchawki': 'Audio',
    'telewizor': 'TV i Video',
    'tv': 'TV i Video',
    'monitor': 'Komputery',
    'klawiatura': 'Komputery',
    'mysz': 'Komputery',
    'router': 'Networking',
    'drukarka': 'Drukarki',
    'tablet': 'Tablety',
    'tableta': 'Tablety',
    'watch': 'Smartwatche',
    'zegarek': 'Smartwatche'
  };

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (result.keywords.toLowerCase().includes(keyword)) {
      result.category = category;
      break;
    }
  }

  // 4. Rozszerz o synonimy przed czyszczeniem
  const synonyms: { [key: string]: string[] } = {
    'pad': ['kontroler', 'gamepad', 'joystick', 'dualshock', 'dualsense'],
    'kontroler': ['pad', 'gamepad', 'joystick'],
    'gamepad': ['pad', 'kontroler', 'joystick'],
    'joystick': ['pad', 'kontroler', 'gamepad'],
    'laptop': ['notebook', 'komputer przenośny'],
    'notebook': ['laptop', 'komputer przenośny'],
    'smartfon': ['telefon', 'smartphone', 'komórka'],
    'telefon': ['smartfon', 'smartphone', 'komórka'],
    'smartphone': ['telefon', 'smartfon', 'komórka'],
    'słuchawki': ['headset', 'nauszniki', 'douszne'],
    'headset': ['słuchawki', 'nauszniki'],
    'tv': ['telewizor', 'televizor'],
    'telewizor': ['tv', 'televizor'],
    'ps5': ['playstation 5', 'playstation'],
    'ps4': ['playstation 4', 'playstation'],
    'xbox': ['microsoft xbox', 'xbox series'],
    'switch': ['nintendo switch', 'nintendo']
  };

  // Znajdź synonimy i dodaj je do zapytania
  const words = result.keywords.toLowerCase().split(/\s+/);
  const expandedWords = [...words];
  
  words.forEach(word => {
    if (synonyms[word]) {
      expandedWords.push(...synonyms[word]);
    }
  });

  // Usuń duplikaty i połącz
  const uniqueWords = [...new Set(expandedWords)];
  result.keywords = uniqueWords.join(' ');

  // 5. Wyczyść keywords - usuń nadmiarowe spacje
  result.keywords = result.keywords
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

/**
 * Rozszerza zapytanie o synonimy bez parsowania cen
 * Używane gdy chcemy tylko dodać synonimy do prostego wyszukiwania
 */
export function expandQueryWithSynonyms(query: string): string {
  const synonyms: { [key: string]: string[] } = {
    'pad': ['kontroler', 'gamepad', 'joystick', 'dualshock', 'dualsense'],
    'kontroler': ['pad', 'gamepad', 'joystick'],
    'gamepad': ['pad', 'kontroler', 'joystick'],
    'joystick': ['pad', 'kontroler', 'gamepad'],
    'laptop': ['notebook', 'komputer przenośny'],
    'notebook': ['laptop', 'komputer przenośny'],
    'smartfon': ['telefon', 'smartphone', 'komórka'],
    'telefon': ['smartfon', 'smartphone', 'komórka'],
    'smartphone': ['telefon', 'smartfon', 'komórka'],
    'słuchawki': ['headset', 'nauszniki', 'douszne'],
    'headset': ['słuchawki', 'nauszniki'],
    'tv': ['telewizor', 'televizor'],
    'telewizor': ['tv', 'televizor'],
    'ps5': ['playstation 5', 'playstation'],
    'ps4': ['playstation 4', 'playstation'],
    'xbox': ['microsoft xbox', 'xbox series'],
    'switch': ['nintendo switch', 'nintendo']
  };

  const words = query.toLowerCase().trim().split(/\s+/);
  const expandedWords = [...words];
  
  words.forEach(word => {
    if (synonyms[word]) {
      // Dodaj najważniejsze synonimy (max 2-3 żeby nie było za długie)
      expandedWords.push(...synonyms[word].slice(0, 2));
    }
  });

  // Usuń duplikaty i połącz
  const uniqueWords = [...new Set(expandedWords)];
  return uniqueWords.join(' ').trim();
}

/**
 * Testowa funkcja - przykłady użycia
 */
export function testQueryParser() {
  const testCases = [
    "szukam telefonu do 1000zł",
    "laptop gaming od 3000 do 5000 zł",
    "słuchawki bluetooth do 200",
    "telewizor sony poniżej 3000",
    "iPhone 15 max 4500",
    "monitor od 1000",
    "500-1500 zł telefon",
    "gaming laptop 5000 zł"
  ];

  console.log("=== Query Parser Tests ===");
  testCases.forEach(query => {
    const parsed = parseNaturalLanguageQuery(query);
    console.log(`\nQuery: "${query}"`);
    console.log(`Keywords: "${parsed.keywords}"`);
    if (parsed.minPrice) console.log(`Min Price: ${parsed.minPrice}`);
    if (parsed.maxPrice) console.log(`Max Price: ${parsed.maxPrice}`);
    if (parsed.category) console.log(`Category: ${parsed.category}`);
  });
}
