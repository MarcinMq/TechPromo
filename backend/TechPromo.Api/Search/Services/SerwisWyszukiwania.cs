using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Models;
using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services;

/// <summary>
/// Implementacja serwisu wyszukiwania Azure AI Search
/// </summary>
public class SerwisWyszukiwania : ISerwisWyszukiwania
{
    private readonly SearchClient _searchClient;
    private readonly SearchIndexClient _indexClient;
    private readonly ILogger<SerwisWyszukiwania> _logger;
    private readonly string _indexName;

    private static readonly string[] TelefonSynonimy = new[]
    {
        "telefon", "telefony", "smartfon", "smartfony", "smartphone", "smartphones",
        "komórka", "komorka", "komórki", "mobile", "phone", "cellphone", "ajfon", "iphone"
    };

    private static readonly HashSet<string> TelefonSynonimyLookup =
        new(TelefonSynonimy, StringComparer.OrdinalIgnoreCase);

    public SerwisWyszukiwania(
        SearchClient searchClient,
        SearchIndexClient indexClient,
        ILogger<SerwisWyszukiwania> logger,
        IConfiguration configuration)
    {
        _searchClient = searchClient;
        _indexClient = indexClient;
        _logger = logger;
        _indexName = configuration["AzureSearch:IndexName"] ?? "oferty-index";
    }

    /// <inheritdoc/>
    public async Task<WynikWyszukiwania<ModelWyszukiwaniaOferty>> WyszukajOfertyAsync(ZapytanieWyszukiwania zapytanie)
    {
        try
        {
            var searchOptions = new SearchOptions
            {
                IncludeTotalCount = true,
                Skip = zapytanie.Offset,
                Size = zapytanie.RozmiarStrony,
                QueryType = SearchQueryType.Full, // wlaczamy full query z synonimami
                SearchMode = SearchMode.Any, // dopasowuje jakiekolwiek slowo
                // Highlight w wyniku wyszukiwania
                HighlightPreTag = "<mark>",
                HighlightPostTag = "</mark>"
            };

            // Dodaj pola do wyświetlania highlightów
            searchOptions.HighlightFields.Add("Nazwa");
            searchOptions.HighlightFields.Add("Opis");

            // Dodaj facets (agregacje)
            searchOptions.Facets.Add("Kategoria,count:20");
            searchOptions.Facets.Add("Typ");
            searchOptions.Facets.Add("LiczbaHot,interval:10");

            // Buduj filtr
            var filters = new List<string>();

            if (zapytanie.TylkoAktywne)
                filters.Add("Aktywna eq true");

            if (zapytanie.TylkoZatwierdzone)
                filters.Add("Zatwierdzona eq true");

            if (!string.IsNullOrWhiteSpace(zapytanie.Kategoria))
                filters.Add($"Kategoria eq '{zapytanie.Kategoria.Replace("'", "''")}'");

            if (!string.IsNullOrWhiteSpace(zapytanie.Typ))
                filters.Add($"Typ eq '{zapytanie.Typ.Replace("'", "''")}'");

            if (!string.IsNullOrWhiteSpace(zapytanie.Sklep))
                filters.Add($"Sklep eq '{zapytanie.Sklep.Replace("'", "''")}'");

            if (zapytanie.MinCena.HasValue)
                filters.Add($"Cena ge {zapytanie.MinCena.Value}");

            if (zapytanie.MaxCena.HasValue)
                filters.Add($"Cena le {zapytanie.MaxCena.Value}");

            if (zapytanie.MinHot.HasValue)
                filters.Add($"LiczbaHot ge {zapytanie.MinHot.Value}");

            if (zapytanie.Tagi != null && zapytanie.Tagi.Length > 0)
            {
                var tagFilters = zapytanie.Tagi.Select(t => $"Tagi/any(tag: tag eq '{t.Replace("'", "''")}')");
                filters.Add($"({string.Join(" or ", tagFilters)})");
            }

            if (filters.Any())
                searchOptions.Filter = string.Join(" and ", filters);

            // Sortowanie
            switch (zapytanie.Sortowanie.ToLower())
            {
                case "date":
                case "data":
                    searchOptions.OrderBy.Add("DataDodania desc");
                    break;
                case "price_asc":
                case "cena_rosnaco":
                    searchOptions.OrderBy.Add("Cena asc");
                    break;
                case "price_desc":
                case "cena_malejaco":
                    searchOptions.OrderBy.Add("Cena desc");
                    break;
                case "hot":
                case "popularnosc":
                    searchOptions.OrderBy.Add("LiczbaHot desc");
                    break;
                case "popularity":
                case "wynik":
                    // Sortowanie po wyniku (hot - cold) - niestety Azure Search nie wspiera computed fields w sortowaniu
                    // więc sortujemy po LiczbaHot
                    searchOptions.OrderBy.Add("LiczbaHot desc");
                    break;
                // "relevance" - domyślnie używa relevance score
            }

            // 1. Próba wyszukiwania dokładnego (z obsługą synonimów)
            var searchText = string.IsNullOrWhiteSpace(zapytanie.Zapytanie) ? "*" : zapytanie.Zapytanie;
            searchText = RozszerzZapytanieOSynonimyTelefonu(searchText);
            
            // SearchQueryType.Full jest już ustawione w opcjach wyżej, co włącza obsługę Lucene i synonimów
            var responseWrapper = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>(
                searchText,
                searchOptions);
            SearchResults<ModelWyszukiwaniaOferty> response = responseWrapper.Value;

            var items = new List<ModelWyszukiwaniaOferty>();
            await foreach (var result in response.GetResultsAsync())
            {
                items.Add(result.Document);
            }

            // Metadane zapytania
            var queryMeta = new QueryMeta 
            { 
                Original = zapytanie.Zapytanie ?? "", 
                Corrected = zapytanie.Zapytanie ?? "", 
                WasCorrected = false 
            };

            // 2. Jeśli brak wyników, spróbuj Fuzzy Search (tolerancja błędów)
            // Ale tylko jeśli zapytanie nie jest puste, nie zawiera cudzysłowów ani tyldy
            if (items.Count == 0 && searchText != "*" && !searchText.Contains("\"") && !searchText.Contains("~") && !searchText.Contains(" AND ") && !searchText.Contains(" OR "))
            {
                var words = searchText.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var fuzzyWords = words.Select(w => w.Length > 2 ? $"{w}~" : w); // Fuzzy dla słów > 2 znaki
                var fuzzyQuery = string.Join(" ", fuzzyWords);

                if (fuzzyQuery != searchText)
                {
                    _logger.LogInformation("Brak wyników dla '{Original}', próba fuzzy: '{Fuzzy}'", searchText, fuzzyQuery);
                    var fuzzyResponseWrapper = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>(fuzzyQuery, searchOptions);
                    var fuzzyResponse = fuzzyResponseWrapper.Value;
                    
                    var fuzzyItems = new List<ModelWyszukiwaniaOferty>();
                    await foreach (var result in fuzzyResponse.GetResultsAsync())
                    {
                        fuzzyItems.Add(result.Document);
                    }

                    if (fuzzyItems.Count > 0)
                    {
                        items = fuzzyItems;
                        response = fuzzyResponse; // Nadpisz odpowiedź, żeby totalCount i facets były poprawne
                        queryMeta.WasCorrected = true;

                        // Znajdź skorygowane słowo z nazwy pierwszego wyniku
                        var firstResultName = fuzzyItems.FirstOrDefault()?.Nazwa?.ToLower() ?? "";
                        var resultWords = firstResultName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        var queryWords = (zapytanie.Zapytanie ?? "").ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        var correctedWords = new List<string>();

                        foreach (var qWord in queryWords)
                        {
                            var bestMatch = qWord;
                            var bestSimilarity = 0.0;

                            foreach (var rWord in resultWords)
                            {
                                if (rWord.Length >= 3 && qWord.Length >= 3)
                                {
                                    var commonChars = qWord.ToCharArray().Intersect(rWord.ToCharArray()).Count();
                                    var similarity = (double)commonChars / Math.Max(qWord.Length, rWord.Length);
                                    if (similarity > bestSimilarity && similarity > 0.5)
                                    {
                                        bestSimilarity = similarity;
                                        bestMatch = rWord;
                                    }
                                }
                            }
                            correctedWords.Add(bestMatch);
                        }

                        var correctedText = string.Join(" ", correctedWords);
                        // Użyj skorygowanego tekstu tylko jeśli różni się od oryginału
                        if (!string.Equals(correctedText, (zapytanie.Zapytanie ?? "").ToLower(), StringComparison.OrdinalIgnoreCase))
                        {
                            queryMeta.Corrected = correctedText;
                        }
                        else
                        {
                            // Fallback: użyj zapytania bez tyldy
                            queryMeta.Corrected = fuzzyQuery.Replace("~", "");
                        }
                    }
                }
            }

            // Mapuj facets
            var facets = new Dictionary<string, List<FacetValue>>();
            if (response.Facets != null)
            {
                foreach (var facet in response.Facets)
                {
                    facets[facet.Key] = facet.Value.Select(f => new FacetValue
                    {
                        Value = f.Value?.ToString() ?? "",
                        Count = f.Count ?? 0
                    }).ToList();
                }
            }

            return new WynikWyszukiwania<ModelWyszukiwaniaOferty>
            {
                Items = items,
                TotalCount = response.TotalCount,
                Strona = zapytanie.Strona,
                RozmiarStrony = zapytanie.RozmiarStrony,
                Facets = facets,
                QueryMeta = queryMeta
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wyszukiwania ofert: {Message}", ex.Message);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> DodajLubAktualizujOferteAsync(ModelWyszukiwaniaOferty oferta)
    {
        try
        {
            var batch = IndexDocumentsBatch.Upload(new[] { oferta });
            var result = await _searchClient.IndexDocumentsAsync(batch);
            
            var success = result.Value.Results.All(r => r.Succeeded);
            if (!success)
            {
                _logger.LogWarning("Nie wszystkie oferty zostały dodane/zaktualizowane poprawnie");
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas dodawania/aktualizacji oferty {OfertaId}: {Message}", 
                oferta.OfertaId, ex.Message);
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> DodajLubAktualizujOfertyAsync(IEnumerable<ModelWyszukiwaniaOferty> oferty)
    {
        try
        {
            var ofertaList = oferty.ToList();
            if (!ofertaList.Any())
                return true;

            _logger.LogInformation("Próba dodania {Count} ofert do indeksu Azure Search", ofertaList.Count);

            var batch = IndexDocumentsBatch.Upload(ofertaList);
            var result = await _searchClient.IndexDocumentsAsync(batch);
            
            var success = result.Value.Results.All(r => r.Succeeded);
            if (!success)
            {
                var failed = result.Value.Results.Where(r => !r.Succeeded).ToList();
                _logger.LogError("Nie wszystkie oferty zostały dodane/zaktualizowane. Błędów: {Count}", failed.Count);
                
                // Loguj szczegóły każdego błędu
                foreach (var failedItem in failed)
                {
                    _logger.LogError("Błąd dla dokumentu {Key}: Status={Status}, ErrorMessage={ErrorMessage}", 
                        failedItem.Key, failedItem.Status, failedItem.ErrorMessage);
                }
            }
            else
            {
                _logger.LogInformation("Pomyślnie dodano {Count} ofert do indeksu", ofertaList.Count);
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas dodawania/aktualizacji ofert (batch): {Message}. StackTrace: {StackTrace}", ex.Message, ex.StackTrace);
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> UsunOferteAsync(string ofertaId)
    {
        try
        {
            var batch = IndexDocumentsBatch.Delete("OfertaId", new[] { ofertaId });
            var result = await _searchClient.IndexDocumentsAsync(batch);
            
            return result.Value.Results.All(r => r.Succeeded);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania oferty {OfertaId}: {Message}", ofertaId, ex.Message);
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> UsunOfertyAsync(IEnumerable<string> ofertaIds)
    {
        try
        {
            var idList = ofertaIds.ToList();
            if (!idList.Any())
                return true;

            var batch = IndexDocumentsBatch.Delete("OfertaId", idList);
            var result = await _searchClient.IndexDocumentsAsync(batch);
            
            return result.Value.Results.All(r => r.Succeeded);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania ofert (batch): {Message}", ex.Message);
            return false;
        }
    }

    private static string RozszerzZapytanieOSynonimyTelefonu(string searchText)
    {
        if (string.IsNullOrWhiteSpace(searchText) || searchText == "*")
            return searchText;

        var trimmed = searchText.Trim();

        // Nie rozszerzaj złożonych zapytań (operatory Lucene, cudzysłowy, tylda, spacje)
        if (trimmed.Contains(' ') || trimmed.Contains(" AND ", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains(" OR ", StringComparison.OrdinalIgnoreCase) || trimmed.Contains('"') ||
            trimmed.Contains('~'))
        {
            return searchText;
        }

        if (!TelefonSynonimyLookup.Contains(trimmed))
            return searchText;

        var unikalne = TelefonSynonimy
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(s => s.Contains(' ') ? $"\"{s}\"" : s);

        return $"({string.Join(" OR ", unikalne)})";
    }

    /// <inheritdoc/>
    public async Task<bool> UtworzIndeksJesliNieIstniajeAsync()
    {
        try
        {
            // Najpierw utwórz synonym map
            await UtworzLubAktualizujSynonymMapAsync();

            try { await _indexClient.DeleteIndexAsync(_indexName); } catch { } // Force delete to ensure synonyms are applied

            // Utwórz definicję indeksu
            var indexDefinition = new SearchIndex(_indexName)
            {
                Fields = new FieldBuilder().Build(typeof(ModelWyszukiwaniaOferty))
            };

            // Wycofano Semantic Search - używamy klasycznego wyszukiwania z rozbudowanymi synonimami

            // Dodaj suggester dla autouzupełniania
            indexDefinition.Suggesters.Add(new SearchSuggester("sg", new[] { "Nazwa", "Kategoria" }));

            // Przypisz synonym map polom, jeśli trzeba (implementacja niżej)
            // ... (kod przypisania synonimów ręcznie, bo FieldBuilder tego nie robi automatycznie)
            var nazwaField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Nazwa");
            if (nazwaField != null) nazwaField.SynonymMapNames.Add("techpromo-synonyms");

            var opisField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Opis");
            if (opisField != null) opisField.SynonymMapNames.Add("techpromo-synonyms");

            var kategoriaField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Kategoria");
            if (kategoriaField != null && kategoriaField.IsSearchable != false) kategoriaField.SynonymMapNames.Add("techpromo-synonyms");

            // Dodaj synonimy do pola Sklep (jeśli searchable)
            var sklepField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Sklep");
            if (sklepField != null && sklepField.IsSearchable != false) sklepField.SynonymMapNames.Add("techpromo-synonyms");


            // Utwórz lub zaktualizuj indeks (wymusza aktualizację konfiguracji semantycznej)
            await _indexClient.CreateOrUpdateIndexAsync(indexDefinition);
            _logger.LogInformation("Indeks {IndexName} został utworzony/zaktualizowany pomyślnie (włączono Semantic Search)", _indexName);
            
            return true;
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Błąd Azure Search podczas operacji na indeksie {IndexName}: Status={Status}, Message={Message}", 
                _indexName, ex.Status, ex.Message);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Nieoczekiwany błąd podczas tworzenia indeksu {IndexName}: {Message}", _indexName, ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Tworzy lub aktualizuje mapę synonimów w Azure AI Search
    /// </summary>
    private async Task<bool> UtworzLubAktualizujSynonymMapAsync()
    {
        try
        {
            const string synonymMapName = "techpromo-synonyms";

            // Definicja synonimów w formacie Solr
            // Format: słowo1, słowo2, słowo3 (każda linia to grupa synonimów)
            var synonyms = string.Join("\n", new[]
            {
                // ============================================
                // TELEFONY I SMARTFONY
                // Format bez "=>" = dwukierunkowe synonimy (telefon <-> smartfon)
                // ============================================
                "telefon, telefony, smartfon, smartfony, smartphone, smartphones, komórka, komorka, komórki, mobile, phone, cellphone, ajfon, iphone",
                
                // ============================================
                // KOMPUTERY I LAPTOPY
                
                // ============================================
                // KOMPUTERY I LAPTOPY (wszystkie warianty)
                // ============================================
                "laptop, laptopy, notebook, notebooks, notebooki, komputer przenośny, portable computer, portable pc, lap top",
                "ultrabook, ultrabooki, thin laptop, cienki laptop",
                "chromebook, chromebooki, chrome book",
                "macbook, mac book, macbooki, apple macbook, macbook air, macbook pro",
                "komputer, computer, pc, desktop, desktopy, komputery, computers, pcs, stacjonarny, komputer stacjonarny",
                "komputer gamingowy, gaming pc, gaming computer, pc gamingowy",
                "komputer do gier, komputer dla graczy",
                "mini pc, nuc, mini komputer, small form factor, sff",
                "all in one, aio, komputer all in one",
                "workstation, stacja robocza",
                "serwer, server, home server",
                "lenovo, thinkpad, ideapad, legion",
                "dell, inspiron, xps, alienware, latitude",
                "hp, pavilion, omen, envy, elitebook, probook",
                "asus, vivobook, zenbook, rog, tuf",
                "acer, aspire, nitro, predator, swift",
                "msi, stealth, raider, creator",
                
                // ============================================
                // TABLETY (wszystkie warianty)
                // ============================================
                "tablet, tablety, tablets, tab, taby, pad",
                "ipad, ipady, apple ipad, ipad pro, ipad air, ipad mini",
                "samsung tab, galaxy tab, samsung tablet",
                "tablet graficzny, graphic tablet, drawing tablet, tablet do rysowania, wacom, xp-pen, huion",
                "tablet dla dzieci, kids tablet, tablet edukacyjny",
                "e-ink tablet, tablet e-ink, remarkable, boox",
                
                // ============================================
                // SMARTWATCHE I OPASKI (wszystkie warianty)
                // ============================================
                "smartwatch, smartwatche, smartwatchy, smart watch, smart watche, zegarek inteligentny, inteligentny zegarek",
                "apple watch, applewatch, iwatch",
                "samsung watch, galaxy watch",
                "garmin, garmin watch, zegarek garmin",
                "fitbit, fit bit",
                "amazfit, huawei watch, xiaomi watch, mi watch",
                "smartband, smart band, opaska, opaska sportowa, opaska fitness, fitness band, fitness tracker, activity tracker",
                "mi band, xiaomi band, huawei band",
                "zegarek, watch, zegarki, watches, wearable, wearables, noszone, urządzenie noszone",
                "pulsometr, heart rate monitor, hrm",
                "gps watch, zegarek z gps, zegarek sportowy, sports watch",
                
                // ============================================
                // SŁUCHAWKI I AUDIO (wszystkie warianty)
                // ============================================
                "słuchawki, headphones, sluchawki, earphones, słuchawka, headphone, earphone",
                "headset, headsety, zestaw słuchawkowy",
                "nauszniki, nauszne, over ear, over-ear, wokółuszne, around ear",
                "douszne, dokanałowe, in ear, in-ear, iem, earbuds, ear buds, wkładki douszne",
                "tws, true wireless, prawdziwie bezprzewodowe",
                "airpods, air pods, airpodsy, apple airpods",
                "galaxy buds, samsung buds",
                "słuchawki bezprzewodowe, wireless headphones, bluetooth headphones, bezprzewodowe",
                "słuchawki przewodowe, wired headphones, przewodowe",
                "słuchawki gamingowe, gaming headset, słuchawki dla graczy",
                "słuchawki z anc, noise cancelling, anc, redukcja szumów, active noise cancelling",
                "głośnik, głośniki, speaker, speakers, głośniczek",
                "głośnik bluetooth, bluetooth speaker, głośnik bezprzewodowy, portable speaker, przenośny głośnik",
                "soundbar, sound bar, belka dźwiękowa, listwa dźwiękowa",
                "subwoofer, sub, bass, basowy",
                "kino domowe, home theater, home theatre, home cinema, system audio",
                "wieża, hi-fi, hifi, stereo, zestaw stereo",
                "mikrofon, microphone, mic, mikrofony, microphones",
                "dac, przetwornik, wzmacniacz słuchawkowy, headphone amp",
                "jbl, bose, sony, sennheiser, audio technica, beyerdynamic, akg",
                
                // ============================================
                // TELEWIZORY (wszystkie warianty)
                // ============================================
                "telewizor, telewizory, tv, tvs, televizor, television, tele, tv set",
                "smart tv, smart telewizor, telewizor smart, android tv, google tv, webos, tizen",
                "oled, oled tv, telewizor oled",
                "qled, qled tv, telewizor qled",
                "led, led tv, telewizor led",
                "lcd, lcd tv, telewizor lcd",
                "4k, 4k tv, uhd, ultra hd, telewizor 4k",
                "8k, 8k tv, telewizor 8k",
                "full hd, fhd, 1080p",
                "lg tv, lg oled, lg nanocell",
                "samsung tv, samsung qled, samsung neo qled",
                "sony bravia, sony tv",
                "philips ambilight, philips tv",
                "tcl, hisense, xiaomi tv",
                
                // ============================================
                // MONITORY (wszystkie warianty)
                // ============================================
                "monitor, monitory, monitors, ekran, ekrany, screen, screens, wyświetlacz, display, displays",
                "monitor gamingowy, gaming monitor, monitor dla graczy",
                "monitor 4k, 4k monitor, uhd monitor",
                "monitor curved, zakrzywiony, curved, wygięty",
                "ultrawide, ultra wide, ultraszeroki, 21:9, 32:9",
                "monitor ips, ips, ips panel",
                "monitor va, va, va panel",
                "monitor tn, tn, tn panel",
                "monitor oled, oled monitor",
                "144hz, 165hz, 240hz, 360hz, wysokie odświeżanie, high refresh rate",
                "27 cali, 27 inch, 32 cali, 32 inch, 24 cali, 34 cali",
                "dell monitor, lg monitor, samsung monitor, asus monitor, benq, aoc, msi monitor, gigabyte monitor",
                
                // ============================================
                // KONSOLE I GAMING (wszystkie warianty)
                // ============================================
                "konsola, konsole, console, consoles, konsola do gier, gaming console",
                "ps5, playstation 5, playstation5, play station 5, ps 5, plejstejszyn",
                "ps4, playstation 4, playstation4, play station 4",
                "ps3, playstation 3",
                "xbox, x-box",
                "xbox series x, xbox series s, xbox series, xsx, xss",
                "xbox one, xbox one x, xbox one s",
                "nintendo switch, switch, switch oled, switch lite, nintendo",
                "steam deck, steamdeck, valve steam deck",
                "rog ally, asus rog ally",
                "pad, kontroler, controller, gamepad, joypad, joystick",
                "dualshock, dualsense, dual shock, dual sense, pad ps5, pad ps4",
                "pad xbox, xbox controller",
                "joy-con, joycon, joy con",
                "kierownica, steering wheel, racing wheel, logitech g29, thrustmaster",
                "gaming, gra, gry, game, games, granie",
                "vr, virtual reality, wirtualna rzeczywistość, gogle vr, vr headset",
                "oculus, meta quest, quest 2, quest 3, psvr, playstation vr",
                
                // ============================================
                // AKCESORIA KOMPUTEROWE (wszystkie warianty)
                // ============================================
                "klawiatura, klawiatury, keyboard, keyboards",
                "klawiatura mechaniczna, mechanical keyboard, mechaniczna, mech",
                "klawiatura membranowa, membrane keyboard",
                "klawiatura bezprzewodowa, wireless keyboard",
                "klawiatura gamingowa, gaming keyboard",
                "klawiatura rgb, rgb keyboard, podświetlana",
                "60%, 65%, 75%, tkl, tenkeyless, full size",
                "logitech keyboard, razer keyboard, steelseries, corsair, hyperx, ducky, keychron",
                "mysz, myszka, mouse, mice, myszki",
                "mysz bezprzewodowa, wireless mouse, mysz bluetooth",
                "mysz przewodowa, wired mouse",
                "mysz gamingowa, gaming mouse, mysz dla graczy",
                "mysz optyczna, optical mouse",
                "mysz laserowa, laser mouse",
                "dpi, czułość, sensitivity",
                "logitech mouse, razer mouse, steelseries mouse, zowie, glorious, pulsar",
                "podkładka, mouse pad, mousepad, mata, podkładka pod mysz",
                "hub usb, usb hub, rozdzielacz usb, port replicator",
                "stacja dokująca, docking station, dock",
                "kamerka, webcam, kamera internetowa, web camera",
                "podstawka pod laptopa, laptop stand, stojak na laptopa, cooling pad, chłodzenie laptopa",
                
                // ============================================
                // DYSKI I PAMIĘĆ (wszystkie warianty)
                // ============================================
                "dysk, dyski, drive, drives, storage, pamięć masowa",
                "ssd, dysk ssd, solid state drive, dysk ssd",
                "nvme, m.2, m2, pcie ssd, dysk nvme",
                "sata ssd, sata, dysk sata",
                "hdd, dysk hdd, hard drive, hard disk, dysk twardy, dysk mechaniczny",
                "dysk zewnętrzny, external drive, external hdd, external ssd, przenośny dysk",
                "pendrive, pen drive, flash drive, usb stick, pamięć usb, usb flash",
                "karta pamięci, memory card, sd card, microsd, micro sd, karta sd",
                "ram, pamięć ram, memory, ddr4, ddr5, pamięć operacyjna",
                "samsung ssd, crucial, kingston, wd, western digital, seagate, sandisk, toshiba",
                "nas, network storage, serwer nas, synology, qnap",
                "1tb, 2tb, 500gb, 256gb, 512gb, 4tb, 8tb",
                
                // ============================================
                // DRUKARKI I SKANERY (wszystkie warianty)
                // ============================================
                "drukarka, drukarki, printer, printers",
                "drukarka laserowa, laser printer, laserowa, laser",
                "drukarka atramentowa, inkjet printer, inkjet, atramentowa",
                "drukarka wielofunkcyjna, multifunction printer, mfp, urządzenie wielofunkcyjne, all in one printer",
                "drukarka kolorowa, color printer, kolorowa",
                "drukarka czarno-biała, mono printer, monochromatyczna, black and white printer",
                "drukarka fotograficzna, photo printer, drukarka do zdjęć",
                "drukarka 3d, 3d printer, druk 3d",
                "skaner, scanner, skanery, scanners",
                "skaner dokumentów, document scanner, skaner płaski, flatbed scanner",
                "toner, tusz, ink, cartridge, wkład, nabój",
                "hp printer, canon printer, epson printer, brother printer, xerox",
                
                // ============================================
                // KAMERY I FOTOGRAFIA (wszystkie warianty)
                // ============================================
                "aparat, aparaty, camera, cameras, aparat fotograficzny, photo camera",
                "aparat cyfrowy, digital camera",
                "lustrzanka, dslr, lustrzanki",
                "bezlusterkowy, mirrorless, bezlusterkowiec, aparat bezlusterkowy",
                "kompakt, compact camera, aparat kompaktowy",
                "aparat natychmiastowy, instant camera, instax, polaroid",
                "kamera, kamery, camcorder, video camera, kamera wideo",
                "kamera sportowa, action camera, action cam, gopro, go pro, dji action",
                "kamera internetowa, webcam, kamerka, web camera",
                "obiektyw, obiektywy, lens, lenses",
                "statyw, tripod, monopod, gimbal, stabilizator",
                "lampa błyskowa, flash, flesz",
                "canon, nikon, sony alpha, fujifilm, panasonic lumix, olympus",
                "zdjęcie, zdjęcia, photo, photography, fotografia",
                
                // ============================================
                // DRONY (wszystkie warianty)
                // ============================================
                "dron, drony, drone, drones, quadcopter, quadrocopter, kwadrokopter",
                "dji, dji mini, dji air, dji mavic, mavic, phantom",
                "dron z kamerą, camera drone, dron fpv, fpv drone",
                "dron dla dzieci, mini drone, mały dron",
                "dron wyścigowy, racing drone",
                
                // ============================================
                // POWERBANKI I ŁADOWARKI (wszystkie warianty)
                // ============================================
                "powerbank, power bank, powerbanki, power banks, bateria zewnętrzna, przenośna bateria, portable battery, portable charger",
                "ładowarka, ładowarki, charger, chargers, zasilacz",
                "ładowarka indukcyjna, wireless charger, ładowanie bezprzewodowe, qi, magsafe",
                "ładowarka usb, usb charger, ładowarka usb-c, usb c charger",
                "ładowarka gan, gan charger, szybka ładowarka, fast charger",
                "ładowarka samochodowa, car charger",
                "kabel ładujący, charging cable, przewód, przewód ładujący",
                "mah, pojemność, capacity, 10000mah, 20000mah, 5000mah",
                "anker, baseus, ugreen, xiaomi powerbank, samsung powerbank",
                
                // ============================================
                // KABELE I ADAPTERY (wszystkie warianty)
                // ============================================
                "kabel, kabele, cable, cables, przewód, przewody, cord",
                "kabel usb, usb cable, usb-c, usb c, type-c, type c, usb-a, micro usb",
                "kabel lightning, lightning cable, kabel iphone",
                "kabel hdmi, hdmi cable, hdmi",
                "kabel displayport, displayport, dp",
                "kabel ethernet, ethernet cable, kabel lan, lan cable, rj45, kabel sieciowy",
                "kabel audio, audio cable, jack, mini jack, aux",
                "adapter, adaptery, przejściówka, converter, konwerter",
                "adapter usb, usb adapter, hub",
                "adapter hdmi, hdmi adapter",
                "przejściówka usb-c, usb c adapter, dongle",
                
                // ============================================
                // INTELIGENTNY DOM (wszystkie warianty)
                // ============================================
                "inteligentny dom, smart home, automatyka domowa, home automation",
                "smart żarówka, smart bulb, inteligentna żarówka, żarówka wifi, philips hue, yeelight",
                "smart gniazdko, smart plug, inteligentne gniazdko, gniazdko wifi",
                "smart włącznik, smart switch, inteligentny włącznik",
                "asystent głosowy, voice assistant, alexa, google home, google assistant, siri",
                "amazon echo, echo dot, google nest, nest hub, homepod, apple homepod",
                "termostat, smart thermostat, inteligentny termostat, nest thermostat",
                "kamera ip, ip camera, kamera monitoringu, security camera, kamera bezpieczeństwa",
                "dzwonek wideo, video doorbell, ring doorbell, smart doorbell",
                "zamek smart, smart lock, inteligentny zamek, elektroniczny zamek",
                "czujnik, sensor, czujnik ruchu, motion sensor, czujnik drzwi",
                "robot sprzątający, robot vacuum, odkurzacz automatyczny, roomba, roborock, xiaomi robot",
                "iot, internet of things, internet rzeczy",
                
                // ============================================
                // SIEĆ I ROUTERY (wszystkie warianty)
                // ============================================
                "router, routery, routers, ruter, rutery",
                "router wifi, wifi router, router bezprzewodowy, wireless router",
                "router wifi 6, wifi 6, ax router, 802.11ax",
                "router wifi 7, wifi 7, be router",
                "router mesh, mesh, system mesh, mesh wifi",
                "access point, ap, punkt dostępowy",
                "modem, modemy, modems",
                "modem lte, lte router, router lte, 4g router, 5g router",
                "switch, przełącznik, switch sieciowy, network switch",
                "karta sieciowa, network card, nic, wifi adapter, adapter wifi",
                "wzmacniacz wifi, wifi extender, repeater, range extender, wzmacniacz sygnału",
                "tp-link, asus router, netgear, linksys, ubiquiti, mikrotik, fritz",
                "sieć, network, networking, lan, wan, internet",
                
                // ============================================
                // PROJEKTORY (wszystkie warianty)
                // ============================================
                "projektor, projektory, projector, projectors, rzutnik",
                "projektor domowy, home projector, kino domowe projektor",
                "projektor full hd, 1080p projector",
                "projektor 4k, 4k projector",
                "projektor led, led projector",
                "projektor laserowy, laser projector",
                "projektor dlp, dlp projector",
                "projektor lcd, lcd projector",
                "projektor przenośny, portable projector, mini projektor, pico projector",
                "projektor krótkoogniskowy, short throw, ust, ultra short throw",
                "epson projektor, benq projektor, optoma, viewsonic, xgimi, anker nebula",
                "ekran projekcyjny, projection screen, ekran do projektora",
                
                // ============================================
                // E-BOOKI I CZYTNIKI (wszystkie warianty)
                // ============================================
                "czytnik, czytniki, ereader, e-reader, ebook reader, czytnik ebooków",
                "kindle, amazon kindle, kindle paperwhite, kindle oasis, kindle scribe",
                "kobo, pocketbook, inkbook, onyx boox",
                "ebook, e-book, ebooki, e-booki, książka elektroniczna, electronic book",
                "e-ink, eink, papier elektroniczny, e-paper",
                
                // ============================================
                // GRY I OPROGRAMOWANIE (wszystkie warianty)
                // ============================================
                "gra, gry, game, games, gierka",
                "gra na ps5, gra ps5, ps5 game, playstation 5 game",
                "gra na xbox, xbox game",
                "gra na switch, switch game, nintendo game",
                "gra pc, pc game, gra na pc, gra komputerowa, computer game",
                "oprogramowanie, software, program, programy, aplikacja",
                "windows, windows 11, windows 10, microsoft windows",
                "office, microsoft office, office 365, ms office",
                "antywirus, antivirus, antywir, ochrona, security software",
                "vpn, vpn software",
                "adobe, photoshop, premiere, lightroom",
                "steam, epic games, gog, origin, uplay",
                "klucz, key, licencja, license, kod aktywacyjny, activation code",
                
                // ============================================
                // AGD MAŁE (wszystkie warianty)
                // ============================================
                "agd małe, small appliances, małe agd, drobne agd",
                "ekspres, ekspres do kawy, coffee maker, coffee machine, ekspres ciśnieniowy",
                "czajnik, kettle, czajnik elektryczny, electric kettle",
                "toster, toaster, toster kanapkowy, sandwich maker",
                "mikser, blender, robot kuchenny, food processor, mixer",
                "odkurzacz, vacuum cleaner, vacuum, odkurzacz bezprzewodowy, cordless vacuum",
                "odkurzacz pionowy, stick vacuum, dyson, xiaomi odkurzacz",
                "żelazko, iron, żelazko parowe, steam iron",
                "suszarka do włosów, hair dryer, suszarka, dyson airwrap",
                "golarka, shaver, maszynka do golenia, electric shaver, braun, philips shaver",
                "szczoteczka elektryczna, electric toothbrush, szczoteczka soniczna, oral-b, sonicare",
                "waga, scale, waga kuchenna, waga łazienkowa, smart scale",
                
                // ============================================
                // AGD DUŻE (wszystkie warianty)
                // ============================================
                "agd duże, large appliances, duże agd, sprzęt agd",
                "lodówka, fridge, refrigerator, lodówki, chłodziarka",
                "pralka, washing machine, washer, pralki",
                "suszarka do ubrań, dryer, clothes dryer, suszarka bębnowa",
                "pralko-suszarka, washer dryer, pralka z suszarką",
                "zmywarka, dishwasher, zmywarki",
                "piekarnik, oven, piekarniki, piec",
                "kuchenka, stove, cooker, płyta grzewcza, hob, kuchenka indukcyjna, induction cooktop",
                "mikrofalówka, microwave, kuchenka mikrofalowa",
                "klimatyzacja, air conditioner, ac, klimatyzator, air conditioning",
                "oczyszczacz powietrza, air purifier, oczyszczacz",
                "nawilżacz, humidifier, nawilżacz powietrza",
                "grzejnik, heater, ogrzewacz, grzejnik elektryczny",
                
                // ============================================
                // OGÓLNE SYNONIMY (wszystkie warianty)
                // ============================================
                "bezprzewodowy, wireless, bluetooth, cordless, bez kabla, bez przewodu",
                "przewodowy, wired, kablowy, z kablem",
                "szybki, fast, quick, prędki, wydajny",
                "wydajny, efficient, powerful, mocny, high performance",
                "tani, cheap, niedrogi, budżetowy, low cost, affordable, ekonomiczny",
                "drogi, expensive, premium, luksusowy, high end, flagowy, flagship",
                "promocja, sale, discount, rabat, okazja, wyprzedaż, deal, offer",
                "nowy, new, nowość, najnowszy, latest, brand new",
                "używany, used, second hand, poleasingowy, b-stock",
                "odnowiony, refurbished, renewed, recertified",
                "gwarancja, warranty, rękojmia, guarantee",
                "oryginalny, original, genuine, authentic",
                "akcesoria, accessories, dodatki",
                "etui, case, pokrowiec, futerał, cover, obudowa",

                // ============================================
                // INTENCJE I CZYNNOŚCI (Mapowanie potrzeb na produkty)
                // Format Solr: "zapytanie => wynik1, wynik2"
                // ============================================
                "muzyka, słuchanie muzyki, do muzyki, audiofil => słuchawki, głośniki, soundbar, wieża",
                "impreza, na imprezę, party => głośnik bluetooth, jbl, soundbar",
                "praca, do pracy, biuro, do biura, home office, praca zdalna => laptop, monitor, myszka, klawiatura, drukarka, fotel, kamerka",
                "nauka, do nauki, szkoła, studia, dla studenta, dla ucznia => laptop, tablet, drukarka, czytnik ebook",
                "gry, granie, do gier, gaming, dla gracza, pro gamer => konsola, playstation, xbox, nintendo, laptop gamingowy, komputer gamingowy, mysz gamingowa, klawiatura gamingowa",
                "film, filmy, kino, oglądanie filmów, seriale, netflix => telewizor, projektor, soundbar",
                "sport, bieganie, na siłownię, trening, fitness => smartwatch, smartband, słuchawki bezprzewodowe",
                "zdjęcia, fotografia, robienie zdjęć, fotografowanie => aparat, lustrzanka, bezlusterkowiec, dron, karta pamięci",
                "internet, wifi, brak zasięgu, wolny internet => router, wzmacniacz wifi, mesh",
                "prezent, na prezent => smartfon, smartwatch, słuchawki, konsola, czytnik",
                "podróż, wyjazd, wakacje, na wyjazd => powerbank, słuchawki, czytnik, aparat, gopro"
            });

            var synonymMap = new SynonymMap(synonymMapName, synonyms);

            // Sprawdź czy mapa synonimów już istnieje
            try
            {
                await _indexClient.GetSynonymMapAsync(synonymMapName);
                // Istnieje - zaktualizuj
                await _indexClient.CreateOrUpdateSynonymMapAsync(synonymMap);
                _logger.LogInformation("Mapa synonimów '{SynonymMapName}' została zaktualizowana", synonymMapName);
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                // Nie istnieje - utwórz
                await _indexClient.CreateSynonymMapAsync(synonymMap);
                _logger.LogInformation("Mapa synonimów '{SynonymMapName}' została utworzona", synonymMapName);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas tworzenia/aktualizacji mapy synonimów: {Message}", ex.Message);
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<List<SugestiaDto>> PobierzSugestieAsync(string zapytanie, int liczbaWynikow = 5)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(zapytanie))
                return new List<SugestiaDto>();

            var suggestOptions = new SuggestOptions
            {
                Size = liczbaWynikow,
                UseFuzzyMatching = true
            };

            var response = await _searchClient.SuggestAsync<ModelWyszukiwaniaOferty>(
                zapytanie,
                "sg",
                suggestOptions);

            return response.Value.Results
                .Select(r => new SugestiaDto 
                { 
                    Id = int.Parse(r.Document.OfertaId),
                    Tekst = r.Text 
                })
                .Distinct()
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania sugestii: {Message}", ex.Message);
            return new List<SugestiaDto>();
        }
    }

    /// <inheritdoc/>
    public async Task<long?> PobierzLiczbeOfertAsync()
    {
        try
        {
            var searchOptions = new SearchOptions
            {
                IncludeTotalCount = true,
                Size = 0 // Nie pobieraj dokumentów, tylko liczbę
            };

            var response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>("*", searchOptions);
            return response.Value.TotalCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania liczby ofert: {Message}", ex.Message);
            return null;
        }
    }

    /// <inheritdoc/>
    public async Task<List<ModelWyszukiwaniaOferty>> PobierzPodobneOfertyAsync(
        string ofertaId, 
        string kategoria, 
        string nazwa, 
        int liczbaWynikow = 5)
    {
        try
        {
            var searchOptions = new SearchOptions
            {
                Size = liczbaWynikow,
                Filter = $"OfertaId ne '{ofertaId}' and Aktywna eq true and Zatwierdzona eq true"
            };

            // Jeśli kategoria jest podana, dodaj do filtra
            if (!string.IsNullOrWhiteSpace(kategoria))
            {
                searchOptions.Filter += $" and Kategoria eq '{kategoria.Replace("'", "''")}'";
            }

            // Sortuj po popularności (LiczbaHot)
            searchOptions.OrderBy.Add("LiczbaHot desc");

            // Wyszukaj podobne oferty na podstawie nazwy
            var searchText = string.IsNullOrWhiteSpace(nazwa) ? "*" : nazwa;
            var response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>(
                searchText,
                searchOptions);

            var results = new List<ModelWyszukiwaniaOferty>();
            await foreach (var result in response.Value.GetResultsAsync())
            {
                results.Add(result.Document);
            }

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania podobnych ofert dla {OfertaId}: {Message}", 
                ofertaId, ex.Message);
            return new List<ModelWyszukiwaniaOferty>();
        }
    }

    /// <inheritdoc/>
    public async Task<int> UsunWszystkieOfertyAsync()
    {
        try
        {
            // Pobierz wszystkie ID dokumentów z indeksu
            var searchOptions = new SearchOptions
            {
                Size = 1000, // Maksymalna liczba dokumentów do pobrania
                Select = { "OfertaId" }
            };

            var response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>("*", searchOptions);
            var ids = new List<string>();
            
            await foreach (var result in response.Value.GetResultsAsync())
            {
                ids.Add(result.Document.OfertaId);
            }

            if (ids.Count == 0)
            {
                _logger.LogInformation("Indeks jest już pusty");
                return 0;
            }

            // Usuń wszystkie dokumenty
            var batch = IndexDocumentsBatch.Delete("OfertaId", ids);
            var deleteResult = await _searchClient.IndexDocumentsAsync(batch);
            
            var deletedCount = deleteResult.Value.Results.Count(r => r.Succeeded);
            _logger.LogInformation("Usunięto {Count} dokumentów z indeksu", deletedCount);
            
            return deletedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas usuwania wszystkich ofert: {Message}", ex.Message);
            return -1;
        }
    }
}
