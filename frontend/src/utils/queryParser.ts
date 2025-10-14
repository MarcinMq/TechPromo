// parser do wyciagania cen, kategorii itp z tekstu
export interface ParsedQuery {
  keywords: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

// parsuje zapytanie typu "laptop do 3000zl" albo "telefon od 500 do 1000"

export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    keywords: query.toLowerCase().trim()
  };

  // wyciagamy ceny w roznych formatach - "do 1000zl", "od 500 do 1000" itp
  const pricePatterns = [
    // "do 1000zl", "do 1000 zl", "maksymalnie 1500"
    /(?:do|max|maksymalnie|poniżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "od 500 do 1000", "500-1000", "500 - 1000 zl"
    /(?:od\s+)?(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?\s*(?:[-–—]|do)\s*(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "od 500zl", "minimum 500"
    /(?:od|min|minimum|powyżej)\s+(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)?/i,
    // "1000zl", "1500 zl" - pojedyncza cena traktowana jako max
    /^.*?(\d+(?:[.,]\d+)?)\s*(?:zł|pln|zl)\s*$/i
  ];

  // sprawdzamy "do X"
  const maxPriceMatch = query.match(pricePatterns[0]);
  if (maxPriceMatch) {
    result.maxPrice = parseFloat(maxPriceMatch[1].replace(',', '.'));
    // usuwamy z keywords
    result.keywords = result.keywords.replace(pricePatterns[0], '').trim();
  }

  // sprawdzamy "od X do Y"
  const rangePriceMatch = query.match(pricePatterns[1]);
  if (rangePriceMatch && !maxPriceMatch) {
    result.minPrice = parseFloat(rangePriceMatch[1].replace(',', '.'));
    result.maxPrice = parseFloat(rangePriceMatch[2].replace(',', '.'));
    // usuwamy z keywords
    result.keywords = result.keywords.replace(pricePatterns[1], '').trim();
  }

  // sprawdzamy "od X"
  const minPriceMatch = query.match(pricePatterns[2]);
  if (minPriceMatch && !maxPriceMatch && !rangePriceMatch) {
    result.minPrice = parseFloat(minPriceMatch[1].replace(',', '.'));
    // usuwamy z keywords
    result.keywords = result.keywords.replace(pricePatterns[2], '').trim();
  }

  // sprawdzamy pojedyncza cene - jesli nic innego nie znalezlismy
  const singlePriceMatch = query.match(pricePatterns[3]);
  if (singlePriceMatch && !maxPriceMatch && !rangePriceMatch && !minPriceMatch) {
    // pojedyncza cena domyslnie jako maksymalna
    result.maxPrice = parseFloat(singlePriceMatch[1].replace(',', '.'));
    // usuwamy z keywords
    result.keywords = result.keywords.replace(/\d+(?:[.,]\d+)?\s*(?:zł|pln|zl)/i, '').trim();
  }

  // usuwamy slowa szumu typu "szukam", "potrzebuje" itp
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

  // wykrywamy kategorie z keywords
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

  // dodajemy synonimy do zapytania
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

  // znajdujemy synonimy i dodajemy do zapytania
  const words = result.keywords.toLowerCase().split(/\s+/);
  const expandedWords = [...words];
  
  words.forEach(word => {
    if (synonyms[word]) {
      expandedWords.push(...synonyms[word]);
    }
  });

  // usuwamy duplikaty i laczymy
  const uniqueWords = [...new Set(expandedWords)];
  result.keywords = uniqueWords.join(' ');

  // czyscimy keywords - usuwamy nadmiarowe spacje
  result.keywords = result.keywords
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

// rozszerza zapytanie o synonimy bez parsowania cen
// uzywa sie gdy chcemy tylko dodac synonimy
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
      // dodajemy max 2-3 synonimy zeby nie bylo za dlugie
      expandedWords.push(...synonyms[word].slice(0, 2));
    }
  });

  // usuwamy duplikaty i laczymy
  const uniqueWords = [...new Set(expandedWords)];
  return uniqueWords.join(' ').trim();
}

// testowa funkcja - przykladowe uzycie parsera
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
