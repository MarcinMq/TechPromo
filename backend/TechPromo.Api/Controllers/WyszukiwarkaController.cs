using Microsoft.AspNetCore.Mvc;
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

    public WyszukiwarkaController(
        ISerwisWyszukiwania searchService,
        SerwisSync syncService,
        ILogger<WyszukiwarkaController> logger)
    {
        _searchService = searchService;
        _syncService = syncService;
        _logger = logger;
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
                facets = wyniki.Facets
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
}
