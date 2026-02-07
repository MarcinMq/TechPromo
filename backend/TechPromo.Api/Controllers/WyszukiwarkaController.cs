using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Search.Models;
using TechPromo.Api.Search.Services;

namespace TechPromo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WyszukiwarkaController : ControllerBase
{
    private readonly ISerwisWyszukiwania _searchService;
    private readonly SerwisSync _syncService;
    private readonly ILogger<WyszukiwarkaController> _logger;
    private readonly TechPromoDbContext _context;

    public WyszukiwarkaController(
        ISerwisWyszukiwania searchService,
        SerwisSync syncService,
        ILogger<WyszukiwarkaController> logger,
        TechPromoDbContext context)
    {
        _searchService = searchService;
        _syncService = syncService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Wyszukuje oferty w Azure AI Search
    /// GET /api/wyszukiwarka?q=laptop&kategoria=Komputery&sortowanie=date
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Wyszukaj([FromQuery] string? q, [FromQuery] ZapytanieWyszukiwania? parametry)
    {
        try
        {
            // Jeśli parametry nie zostały przekazane, utwórz nowy obiekt
            parametry ??= new ZapytanieWyszukiwania();

            // Jeśli przekazano parametr q, użyj go jako zapytania
            if (!string.IsNullOrWhiteSpace(q))
                parametry.Zapytanie = q;

            // Wykonaj wyszukiwanie
            var wyniki = await _searchService.WyszukajOfertyAsync(parametry);

            // Wykryj czy zapytanie mogło być literówką (fuzzy match)
            // Jeśli oryginalna forma zapytania różni się od tego co zwrócono w wynikach
            var originalQuery = parametry.Zapytanie ?? "";
            var wasCorrected = false;
            var correctedQuery = originalQuery;

            // Proste wykrywanie literówek - jeśli zapytanie zawiera nietypowe sekwencje liter
            // lub jeśli mamy wyniki ale zapytanie wygląda na błędne
            if (!string.IsNullOrWhiteSpace(originalQuery) && wyniki.Items.Any())
            {
                // Sprawdź czy nazwy wyników nie zawierają dokładnego zapytania
                // ale zawierają podobne słowa (fuzzy match)
                var queryLower = originalQuery.ToLower();
                var firstResultName = wyniki.Items.FirstOrDefault()?.Nazwa?.ToLower() ?? "";
                
                // Jeśli zapytanie ma literówki typowe (podwójne spółgłoski, przestawione litery)
                // i nie występuje dokładnie w wynikach, uznajemy że było skorygowane
                if (!firstResultName.Contains(queryLower))
                {
                    // Znajdź najbardziej podobne słowo z pierwszego wyniku
                    var resultWords = firstResultName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var word in resultWords)
                    {
                        // Oblicz podobieństwo (uproszczone - sprawdź czy większość liter się zgadza)
                        if (word.Length >= 3 && queryLower.Length >= 3)
                        {
                            var commonChars = queryLower.Intersect(word).Count();
                            var similarity = (double)commonChars / Math.Max(queryLower.Length, word.Length);
                            if (similarity > 0.6 && similarity < 1.0)
                            {
                                wasCorrected = true;
                                correctedQuery = word;
                                break;
                            }
                        }
                    }
                }
            }

            // Zwróć wyniki w formacie zgodnym z frontendem
            return Ok(new
            {
                items = wyniki.Items.Select(item => new
                {
                    document = new
                    {
                        ofertaId = int.Parse(item.OfertaId),
                        nazwa = item.Nazwa,
                        opis = item.Opis,
                        typ = item.Typ,
                        cena = item.Cena,
                        cenaPoprzednia = item.CenaPoprzednia,
                        kod = item.Kod,
                        kategoria = item.Kategoria,
                        sklep = item.Sklep,
                        link = item.Link,
                        dataDodania = item.DataDodania,
                        liczbaHot = item.LiczbaHot,
                        liczbaCold = item.LiczbaCold,
                        status = item.Status,
                        aktywna = item.Aktywna,
                        zatwierdzona = item.Zatwierdzona,
                        idUzytkownik = item.IdUzytkownik,
                        nazwaUzytkownika = item.NazwaUzytkownika,
                        zdjecie = item.Zdjecie,
                        tagi = item.Tagi,
                        wynikPopularnosci = item.WynikPopularnosci,
                        procentZniżki = item.ProcentZniżki
                    }
                }).ToList(),
                totalCount = wyniki.TotalCount,
                strona = wyniki.Strona,
                rozmiarStrony = wyniki.RozmiarStrony,
                totalPages = wyniki.TotalPages,
                hasNextPage = wyniki.HasNextPage,
                hasPreviousPage = wyniki.HasPreviousPage,
                facets = wyniki.Facets,
                queryMeta = new
                {
                    original = wyniki.QueryMeta?.Original ?? originalQuery,
                    corrected = DetermineCorrection(wyniki, originalQuery, correctedQuery, wasCorrected),
                    wasCorrected = (wyniki.QueryMeta?.WasCorrected ?? false) || wasCorrected
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wyszukiwania: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas wyszukiwania", error = ex.Message });
        }
    }

    /// <summary>
    /// Pobiera sugestie autouzupełniania
    /// GET /api/wyszukiwarka/sugestie?q=lap
    /// </summary>
    [HttpGet("sugestie")]
    public async Task<IActionResult> PobierzSugestie([FromQuery] string q, [FromQuery] int liczba = 5)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<string>());

            var sugestie = await _searchService.PobierzSugestieAsync(q, liczba);
            return Ok(sugestie);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania sugestii: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania sugestii" });
        }
    }

    /// <summary>
    /// Pobiera podobne oferty
    /// GET /api/wyszukiwarka/podobne/{ofertaId}?liczba=5
    /// </summary>
    [HttpGet("podobne/{ofertaId}")]
    public async Task<IActionResult> PobierzPodobneOferty(int ofertaId, [FromQuery] int liczba = 5)
    {
        try
        {
            // Pobierz dane oferty z bazy
            var oferta = await _context.Oferty
                .Include(o => o.Kategoria)
                .Where(o => o.IdOferta == ofertaId)
                .Select(o => new { o.Nazwa, Kategoria = o.Kategoria != null ? o.Kategoria.Nazwa : "" })
                .FirstOrDefaultAsync();

            if (oferta == null)
                return NotFound(new { message = "Oferta nie znaleziona" });

            var podobne = await _searchService.PobierzPodobneOfertyAsync(
                ofertaId.ToString(), 
                oferta.Kategoria, 
                oferta.Nazwa, 
                liczba);

            return Ok(podobne);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania podobnych ofert: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania podobnych ofert" });
        }
    }

    /// <summary>
    /// Inicjalizuje indeks Azure Search (tworzy jeśli nie istnieje)
    /// POST /api/wyszukiwarka/inicjalizuj
    /// </summary>
    [HttpPost("inicjalizuj")]
    public async Task<IActionResult> InicjalizujIndeks()
    {
        try
        {
            var sukces = await _syncService.InicjalizujIndeksAsync();
            
            if (sukces)
                return Ok(new { message = "Indeks został zainicjalizowany pomyślnie" });
            else
                return BadRequest(new { message = "Nie udało się zainicjalizować indeksu. Sprawdź logi aplikacji aby uzyskać więcej szczegółów." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas inicjalizacji indeksu: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas inicjalizacji indeksu", error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    /// <summary>
    /// Synchronizuje wszystkie oferty z bazy danych do Azure Search
    /// POST /api/wyszukiwarka/synchronizuj
    /// </summary>
    [HttpPost("synchronizuj")]
    public async Task<IActionResult> SynchronizujWszystkieOferty()
    {
        try
        {
            var (sukces, bledy) = await _syncService.SynchronizujWszystkieOfertyAsync();
            
            return Ok(new 
            { 
                message = "Synchronizacja zakończona",
                zsynchronizowane = sukces,
                bledy = bledy,
                calkowite = sukces + bledy
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas synchronizacji: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas synchronizacji", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizuje pojedynczą ofertę
    /// POST /api/wyszukiwarka/synchronizuj/{id}
    /// </summary>
    [HttpPost("synchronizuj/{id}")]
    public async Task<IActionResult> SynchronizujOferte(int id)
    {
        try
        {
            var sukces = await _syncService.SynchronizujOferteAsync(id);
            
            if (sukces)
                return Ok(new { message = $"Oferta {id} została zsynchronizowana" });
            else
                return BadRequest(new { message = $"Nie udało się zsynchronizować oferty {id}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas synchronizacji oferty {Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas synchronizacji oferty", error = ex.Message });
        }
    }

    /// <summary>
    /// Pobiera statystyki indeksu
    /// GET /api/wyszukiwarka/statystyki
    /// </summary>
    [HttpGet("statystyki")]
    public async Task<IActionResult> PobierzStatystyki()
    {
        try
        {
            var liczbaOfert = await _searchService.PobierzLiczbeOfertAsync();
            
            return Ok(new
            {
                liczbaOfertWIndeksie = liczbaOfert,
                indexName = "oferty-index"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pobierania statystyk: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas pobierania statystyk" });
        }
    }

    /// <summary>
    /// Czyści indeks i synchronizuje od nowa wszystkie oferty
    /// POST /api/wyszukiwarka/resynchronizuj
    /// </summary>
    [HttpPost("resynchronizuj")]
    public async Task<IActionResult> ResynchronizujIndeks()
    {
        try
        {
            _logger.LogInformation("Rozpoczynam pełną resynchronizację indeksu...");
            
            // 1. Usuń wszystkie dokumenty z indeksu
            var usuniete = await _searchService.UsunWszystkieOfertyAsync();
            _logger.LogInformation("Usunięto {Count} dokumentów z indeksu", usuniete);
            
            // 2. Poczekaj chwilę na propagację usunięcia
            await Task.Delay(1000);
            
            // 3. Zsynchronizuj wszystkie oferty z bazy
            var (sukces, bledy) = await _syncService.SynchronizujWszystkieOfertyAsync();
            
            return Ok(new 
            { 
                message = "Resynchronizacja zakończona",
                usunietychZIndeksu = usuniete,
                zsynchronizowanych = sukces,
                bledow = bledy
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas resynchronizacji: {Message}", ex.Message);
            return StatusCode(500, new { message = "Wystąpił błąd podczas resynchronizacji", error = ex.Message });
        }
    }

    /// <summary>
    /// Określa najlepszą korektę zapytania. Używa korekty z serwisu, 
    /// a jeśli ta jest identyczna z oryginałem, stosuje heurystykę z kontrolera.
    /// </summary>
    private static string DetermineCorrection(
        WynikWyszukiwania<ModelWyszukiwaniaOferty> wyniki, 
        string originalQuery, 
        string controllerCorrected, 
        bool controllerWasCorrected)
    {
        var serviceCorrected = wyniki.QueryMeta?.Corrected ?? originalQuery;
        
        // Jeśli serwis zwrócił prawdziwą korektę (różną od oryginału), użyj jej
        if (!string.Equals(serviceCorrected, originalQuery, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(serviceCorrected))
        {
            return serviceCorrected;
        }
        
        // Fallback: użyj heurystyki z kontrolera
        if (controllerWasCorrected && !string.IsNullOrWhiteSpace(controllerCorrected))
        {
            return controllerCorrected;
        }
        
        return originalQuery;
    }
}
