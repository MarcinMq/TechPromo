# Test Plan - Azure AI Search Synonym Maps

## 🧪 Testy manualne

### Test 1: Synonimy Gaming
**Zapytanie:** `pad`  
**Oczekiwany wynik:** Oferty zawierające:
- "kontroler"
- "gamepad"
- "joystick"
- "DualShock"
- "DualSense"

**Status:** [ ] Pass / [ ] Fail

---

### Test 2: Synonimy Telefony
**Zapytanie:** `smartfon`  
**Oczekiwany wynik:** Oferty zawierające:
- "telefon"
- "smartphone"
- "komórka"
- "iPhone"
- "Samsung"

**Status:** [ ] Pass / [ ] Fail

---

### Test 3: Synonimy Audio
**Zapytanie:** `słuchawki`  
**Oczekiwany wynik:** Oferty zawierające:
- "headset"
- "nauszniki"
- "douszne"

**Status:** [ ] Pass / [ ] Fail

---

### Test 4: Synonimy Komputery
**Zapytanie:** `laptop`  
**Oczekiwany wynik:** Oferty zawierające:
- "notebook"
- "ultrabook"
- "MacBook"
- "Chromebook"

**Status:** [ ] Pass / [ ] Fail

---

### Test 5: Stemming (Polski analizator)
**Zapytanie:** `telefonu`  
**Oczekiwany wynik:** Oferty zawierające:
- "telefon"
- "telefony"
- "telefonem"

**Status:** [ ] Pass / [ ] Fail

---

### Test 6: Parser cen - maksymalna
**Zapytanie:** `laptop do 3000zł`  
**Oczekiwany wynik:**
- Laptopy z ceną ≤ 3000 PLN
- Badge: "💰 Do 3000 zł"

**Status:** [ ] Pass / [ ] Fail

---

### Test 7: Parser cen - zakres
**Zapytanie:** `telefon od 1000 do 2000 zł`  
**Oczekiwany wynik:**
- Telefony z ceną między 1000-2000 PLN
- Badge: "💰 Od 1000 zł" i "💰 Do 2000 zł"

**Status:** [ ] Pass / [ ] Fail

---

### Test 8: Parser kategorii
**Zapytanie:** `szukam słuchawek`  
**Oczekiwany wynik:**
- Oferty z kategorii "Audio"
- Badge: "🏷️ Audio"

**Status:** [ ] Pass / [ ] Fail

---

### Test 9: Parser kombinowany
**Zapytanie:** `gaming laptop do 5000zł`  
**Oczekiwany wynik:**
- Laptopy gamingowe do 5000 PLN
- Badge: "💰 Do 5000 zł"
- Możliwa kategoria: "Laptopy"

**Status:** [ ] Pass / [ ] Fail

---

### Test 10: Fuzzy matching (literówki)
**Zapytanie:** `laptopp` (błąd ortograficzny)  
**Oczekiwany wynik:**
- Sugestia: "laptop"
- Sekcja "Czy chodziło Ci o..." (jeśli brak wyników)

**Status:** [ ] Pass / [ ] Fail

---

## 🔍 Testy techniczne

### Test 11: Synonym Map istnieje w Azure
```bash
GET https://<nazwa>.search.windows.net/synonymmaps/techpromo-synonyms?api-version=2023-11-01
api-key: <admin-key>
```

**Oczekiwany wynik:** Status 200, zwraca definicję mapy synonimów

**Status:** [ ] Pass / [ ] Fail

---

### Test 12: Indeks ma przypisane synonym maps
```bash
GET https://<nazwa>.search.windows.net/indexes/oferty-index?api-version=2023-11-01
api-key: <admin-key>
```

**Oczekiwany wynik:** 
Pola `Nazwa` i `Opis` mają:
```json
{
  "name": "Nazwa",
  "type": "Edm.String",
  "searchable": true,
  "analyzer": "pl.lucene",
  "synonymMaps": ["techpromo-synonyms"]
}
```

**Status:** [ ] Pass / [ ] Fail

---

### Test 13: Logi backendu
**Uruchom backend i sprawdź logi:**

**Oczekiwane logi:**
```
Mapa synonimów 'techpromo-synonyms' została utworzona
Indeks oferty-index został utworzony pomyślnie
```

**Status:** [ ] Pass / [ ] Fail

---

## 📊 Wyniki testów

**Testy zaliczone:** ___ / 13  
**Data testów:** ___________  
**Tester:** ___________

---

## 🐛 Znalezione problemy

| # | Problem | Severity | Status |
|---|---------|----------|--------|
| 1 |         |          |        |
| 2 |         |          |        |
| 3 |         |          |        |

---

## ✅ Akceptacja

- [ ] Wszystkie synonimy działają poprawnie
- [ ] Parser cen działa poprawnie
- [ ] Parser kategorii działa poprawnie
- [ ] Polski analizator (stemming) działa
- [ ] Fuzzy matching działa
- [ ] Synonym Map istnieje w Azure
- [ ] Indeks ma przypisane synonym maps
- [ ] Logi backendu są poprawne

**Podpis testera:** ___________  
**Data:** ___________

---

## 💡 Wskazówki

### Jak sprawdzić synonym map w Azure Portal?
1. Wejdź na portal.azure.com
2. Znajdź swój Azure AI Search resource
3. Kliknij **Synonym maps** w menu
4. Powinieneś zobaczyć `techpromo-synonyms`

### Jak sprawdzić pola indeksu?
1. Azure Portal → Azure AI Search
2. Kliknij **Indexes** → `oferty-index`
3. Kliknij **Fields**
4. Sprawdź pole `Nazwa` i `Opis` - powinny mieć `Synonym maps: techpromo-synonyms`

### Jak przetestować query z synonimami bezpośrednio?
```bash
POST https://<nazwa>.search.windows.net/indexes/oferty-index/docs/search?api-version=2023-11-01
api-key: <admin-key>
Content-Type: application/json

{
  "search": "pad",
  "top": 10
}
```

Powinien znaleźć dokumenty z "kontroler", "gamepad", itp.
