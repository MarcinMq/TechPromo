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

            // Wykonaj wyszukiwanie
            var searchText = string.IsNullOrWhiteSpace(zapytanie.Zapytanie) ? "*" : zapytanie.Zapytanie;
            SearchResults<ModelWyszukiwaniaOferty> response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>(
                searchText,
                searchOptions);

            // Mapuj wyniki
            var items = new List<ModelWyszukiwaniaOferty>();
            await foreach (var result in response.GetResultsAsync())
            {
                items.Add(result.Document);
            }

            // Mapuj facets
            var facets = new Dictionary<string, List<FacetValue>>();
            foreach (var facet in response.Facets)
            {
                facets[facet.Key] = facet.Value.Select(f => new FacetValue
                {
                    Value = f.Value?.ToString() ?? "",
                    Count = f.Count ?? 0
                }).ToList();
            }

            return new WynikWyszukiwania<ModelWyszukiwaniaOferty>
            {
                Items = items,
                TotalCount = response.TotalCount,
                Strona = zapytanie.Strona,
                RozmiarStrony = zapytanie.RozmiarStrony,
                Facets = facets
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

    /// <inheritdoc/>
    public async Task<bool> UtworzIndeksJesliNieIstniajeAsync()
    {
        try
        {
            // Najpierw utwórz synonym map
            await UtworzLubAktualizujSynonymMapAsync();

            // Sprawdź czy indeks istnieje
            try
            {
                await _indexClient.GetIndexAsync(_indexName);
                _logger.LogInformation("Indeks {IndexName} już istnieje", _indexName);
                return true;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                // Indeks nie istnieje, utwórz go
                _logger.LogInformation("Tworzenie indeksu {IndexName}...", _indexName);
            }

            // Utwórz definicję indeksu
            var indexDefinition = new SearchIndex(_indexName)
            {
                Fields = new FieldBuilder().Build(typeof(ModelWyszukiwaniaOferty))
            };

            // Dodaj suggester dla autouzupełniania
            indexDefinition.Suggesters.Add(new SearchSuggester("sg", new[] { "Nazwa", "Kategoria" }));

            // Przypisz synonym map do pól Nazwa i Opis
            var nazwaField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Nazwa");
            if (nazwaField != null)
            {
                nazwaField.SynonymMapNames.Add("techpromo-synonyms");
            }

            var opisField = indexDefinition.Fields.FirstOrDefault(f => f.Name == "Opis");
            if (opisField != null)
            {
                opisField.SynonymMapNames.Add("techpromo-synonyms");
            }

            // Utwórz indeks
            await _indexClient.CreateIndexAsync(indexDefinition);
            _logger.LogInformation("Indeks {IndexName} został utworzony pomyślnie", _indexName);
            
            return true;
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Błąd Azure Search podczas tworzenia indeksu {IndexName}: Status={Status}, ErrorCode={ErrorCode}, Message={Message}", 
                _indexName, ex.Status, ex.ErrorCode, ex.Message);
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
                // Telefony i smartfony
                "telefon, smartphone, smartfon, komórka, iphone, samsung, xiaomi, nokia, motorola, oppo, realme, vivo",
                
                // Komputery
                "laptop, notebook, komputer przenośny, ultrabook, chromebook, macbook",
                "komputer, pc, desktop",
                
                // Gaming
                "pad, kontroler, gamepad, joystick, dualshock, dualsense",
                "ps5, playstation 5, playstation",
                "xbox, microsoft xbox, xbox series",
                "konsola, konsola do gier",
                
                // Audio
                "słuchawki, headset, nauszniki, douszne, bezprzewodowe słuchawki",
                "głośnik, speaker, bluetooth speaker, głośnik bezprzewodowy",
                
                // Wyświetlacze
                "tv, telewizor, televizor, smart tv",
                "monitor, ekran, wyświetlacz",
                
                // Akcesoria komputerowe
                "klawiatura, keyboard, klawiatura mechaniczna, klawiatura bezprzewodowa",
                "mysz, mouse, myszka, mysz bezprzewodowa, mysz gamingowa",
                "myszka, mysz",
                
                // Przechowywanie danych
                "dysk, ssd, hdd, dysk twardy, dysk ssd, pendrive, pamięć usb",
                
                // Smartwatche
                "smartwatch, zegarek, smartband, opaska sportowa, apple watch",
                
                // Tablety
                "tablet, ipad, tablet graficzny",
                
                // Fotografia
                "aparat, kamera, lustrzanka, aparat cyfrowy, aparat bezlusterkowy",
                
                // Drukarki
                "drukarka, printer, drukarka laserowa, drukarka atramentowa",
                
                // Routery i sieć
                "router, router wifi, access point, modem",
                
                // Powerbanki
                "powerbank, power bank, ładowarka przenośna, bateria zewnętrzna",
                
                // Ogólne synonimy
                "bezprzewodowy, wireless, bluetooth",
                "szybki, wydajny, mocny",
                "tani, niedrogi, budżetowy, promocja",
                "nowy, nówka",
                "używany, poleasingowy, refurbished"
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
