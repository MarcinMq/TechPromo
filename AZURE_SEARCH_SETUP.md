# Azure AI Search - Konfiguracja Synonimów

## 📋 Przegląd

Ten dokument opisuje jak skonfigurować Azure AI Search z **Synonym Maps** (mapami synonimów) oraz **Language Analyzer** (analizatorem językowym) dla projektu TechPromo.

## 🎯 Co zostało zaimplementowane?

### 1. **Language Analyzer (Analiza językowa)**
- ✅ **PlLucene** - polski analizator językowy w polach `Nazwa` i `Opis`
- ✅ Automatyczny **stemming** ("telefonu" → "telefon", "laptopów" → "laptop")
- ✅ Automatyczna **lematyzacja** ("szukam" → "szukać")
- ✅ Automatyczne **stop words** (ignoruje "i", "w", "na", "do")

### 2. **Synonym Maps (Mapy synonimów)**
- ✅ Centralna mapa synonimów w Azure AI Search
- ✅ Obsługa synonimów dla:
  - Telefony (telefon, smartphone, smartfon, komórka, iphone, samsung)
  - Laptopy (laptop, notebook, ultrabook, macbook)
  - Gaming (pad, kontroler, gamepad, joystick, ps5, xbox)
  - Audio (słuchawki, headset, nauszniki, głośnik, speaker)
  - TV i Monitory (tv, telewizor, monitor, ekran)
  - Akcesoria (klawiatura, mysz, powerbank)
  - ...i wiele więcej (patrz kod)

### 3. **Uproszczony Parser**
- ✅ Parser wykrywa tylko **ceny** i **kategorie**
- ✅ **Synonimy są obsługiwane przez Azure** (nie przez klienta)
- ✅ Mniej kodu, lepsza wydajność

## 🚀 Jak uruchomić?

### Krok 1: Uruchom backend
```bash
cd backend/TechPromo.Api
dotnet run
```

### Krok 2: Przebuduj indeks z synonimami
Backend automatycznie:
1. Tworzy mapę synonimów `techpromo-synonyms`
2. Przypisuje ją do pól `Nazwa` i `Opis`
3. Tworzy indeks z polskim analizatorem

**Ważne:** Jeśli indeks już istnieje, musisz go **usunąć** i utworzyć ponownie, aby synonym maps zadziałały:

#### Opcja A: Usunięcie indeksu przez Azure Portal
1. Wejdź na [portal.azure.com](https://portal.azure.com)
2. Przejdź do swojego Azure AI Search resource
3. Kliknij **Indexes** → wybierz swój indeks → **Delete**
4. Uruchom backend - indeks zostanie utworzony ponownie

#### Opcja B: Usunięcie indeksu przez API (Postman/curl)
```bash
DELETE https://<twoja-nazwa>.search.windows.net/indexes/oferty-index?api-version=2023-11-01
api-key: <twój-admin-key>
```

### Krok 3: Załaduj dane ponownie
Po usunięciu indeksu musisz załadować oferty ponownie:

```bash
POST http://localhost:5023/api/admin/synchronizuj-wyszukiwanie
Authorization: Bearer <admin-token>
```

### Krok 4: Testuj synonimy
Wpisz w wyszukiwarce:
- "pad" → znajdzie "kontroler do PS5"
- "smartfon" → znajdzie "telefon Samsung"
- "słuchawki" → znajdzie "headset bezprzewodowy"

## 🔍 Jak to działa?

### Przed (Parser po stronie klienta):
```
Użytkownik: "pad"
↓
Frontend: rozszerza na "pad kontroler gamepad joystick"
↓
Backend: wyszukuje wszystkie słowa
↓
Azure AI Search: zwraca wyniki
```

### Po (Synonym Maps w Azure):
```
Użytkownik: "pad"
↓
Frontend: wysyła "pad"
↓
Backend: przekazuje "pad" do Azure
↓
Azure AI Search: automatycznie rozszerza na synonimy
↓
Zwraca wyniki dla "pad", "kontroler", "gamepad", "joystick"
```

## ✅ Zalety tego rozwiązania

| Aspekt | Parser klienta | Azure Synonym Maps |
|--------|-----------------|-------------------|
| **Wydajność** | ❌ Wolniejsze (więcej tekstu) | ✅ Szybsze (Azure optymalizuje) |
| **Utrzymanie** | ❌ Trzeba edytować kod | ✅ Można edytować bez deployu |
| **Centralizacja** | ❌ Rozproszone (frontend) | ✅ Centralne (Azure) |
| **Skalowanie** | ❌ Trudne (każdy klient rozszerza) | ✅ Łatwe (raz w Azure) |
| **Koszt** | ✅ Darmowe | ✅ Darmowe (Free tier) |

## 📝 Jak dodać nowe synonimy?

### Metoda 1: Edycja kodu (wymaga redeployu)
Edytuj `SerwisWyszukiwania.cs`:

```csharp
var synonyms = string.Join("\n", new[]
{
    "telefon, smartphone, smartfon, komórka",
    "laptop, notebook, ultrabook",
    // Dodaj nową grupę synonimów
    "router, access point, modem",
    // ...
});
```

Uruchom ponownie backend.

### Metoda 2: Azure Portal (bez redeployu)
1. Wejdź na [portal.azure.com](https://portal.azure.com)
2. Przejdź do Azure AI Search resource
3. Kliknij **Synonym maps** → `techpromo-synonyms` → **Edit**
4. Dodaj nowe linie synonimów (format Solr)
5. Zapisz

**Ważne:** Po edycji synonimów przez portal musisz **przebudować indeks** (Delete + Create).

## 🧪 Testowanie

### Test 1: Synonimy działają
```
Wpisz: "pad"
Oczekiwany wynik: Oferty z "kontroler", "gamepad", "joystick"
```

### Test 2: Stemming działa
```
Wpisz: "telefonu"
Oczekiwany wynik: Oferty z "telefon", "telefony", "telefonem"
```

### Test 3: Parser cen działa
```
Wpisz: "laptop do 3000zł"
Oczekiwany wynik: Laptopy z ceną ≤ 3000 PLN
Badge: "💰 Do 3000 zł"
```

### Test 4: Parser kategorii działa
```
Wpisz: "szukam słuchawek"
Oczekiwany wynik: Oferty z kategorii "Audio"
Badge: "🏷️ Audio"
```

## 🐛 Troubleshooting

### Problem: "pad" nie znajduje "kontroler"
**Przyczyna:** Indeks nie ma synonym maps lub został utworzony przed dodaniem synonimów.

**Rozwiązanie:**
1. Usuń indeks (Delete)
2. Uruchom backend ponownie (utworzy indeks z synonimami)
3. Załaduj dane ponownie

### Problem: Polskie znaki nie działają
**Przyczyna:** Brak polskiego analizatora językowego.

**Rozwiązanie:** Sprawdź czy w `ModelWyszukiwaniaOferty.cs` pola mają:
```csharp
[SearchableField(AnalyzerName = LexicalAnalyzerName.Values.PlLucene)]
```

### Problem: Synonym map już istnieje (błąd 409)
**Przyczyna:** Próbujesz utworzyć mapę synonimów, która już istnieje.

**Rozwiązanie:** Backend używa `CreateOrUpdateSynonymMapAsync`, więc to nie powinno się zdarzyć. Jeśli wystąpi, usuń mapę przez Azure Portal i spróbuj ponownie.

## 📚 Dokumentacja

- [Azure AI Search - Synonym Maps](https://learn.microsoft.com/en-us/azure/search/search-synonyms)
- [Azure AI Search - Language Analyzers](https://learn.microsoft.com/en-us/azure/search/index-add-language-analyzers)
- [Solr Synonym Format](https://solr.apache.org/guide/6_6/filter-descriptions.html#FilterDescriptions-SynonymFilter)

## ✨ Co dalej?

### Opcjonalne ulepszenia:
1. **Semantic Search** (wymaga tier S1+) - jeszcze lepsze dopasowanie kontekstu
2. **AI Enrichment** - rozpoznawanie tekstu ze zdjęć
3. **Custom Analyzers** - własne reguły tokenizacji
4. **Vector Search** - wyszukiwanie semantyczne przez embeddings

---

**Autor:** GitHub Copilot  
**Data:** 2025-10-13  
**Projekt:** TechPromo - Platforma Agregująca Promocje
