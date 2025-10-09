using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services;

/// <summary>
/// Serwis do synchronizacji danych z PostgreSQL do Azure Search Index
/// </summary>
public class SerwisSync
{
    private readonly TechPromoDbContext _context;
    private readonly ISerwisWyszukiwania _searchService;
    private readonly ILogger<SerwisSync> _logger;

    public SerwisSync(
        TechPromoDbContext context,
        ISerwisWyszukiwania searchService,
        ILogger<SerwisSync> logger)
    {
        _context = context;
        _searchService = searchService;
        _logger = logger;
    }

    /// <summary>
    /// Synchronizuje wszystkie oferty z bazy danych do indeksu Azure Search
    /// </summary>
    public async Task<(int Success, int Failed)> SynchronizujWszystkieOfertyAsync()
    {
        try
        {
            _logger.LogInformation("Rozpoczynam pełną synchronizację ofert...");

            // Pobierz wszystkie aktywne i zatwierdzone oferty
            var oferty = await _context.Oferty
                .Include(o => o.Kategoria)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi)
                    .ThenInclude(ot => ot.Tag)
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .ToListAsync();

            _logger.LogInformation("Pobrano {Count} ofert do synchronizacji", oferty.Count);

            // Mapuj do modelu wyszukiwania
            var searchDocs = oferty.Select(MapToSearchModel).ToList();

            // Dodaj wszystkie do indeksu (batch)
            const int batchSize = 100;
            int success = 0;
            int failed = 0;

            for (int i = 0; i < searchDocs.Count; i += batchSize)
            {
                var batch = searchDocs.Skip(i).Take(batchSize);
                var result = await _searchService.DodajLubAktualizujOfertyAsync(batch);
                
                if (result)
                    success += batch.Count();
                else
                    failed += batch.Count();
            }

            _logger.LogInformation("Synchronizacja zakończona. Sukces: {Success}, Błędy: {Failed}", success, failed);
            return (success, failed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas pełnej synchronizacji: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Synchronizuje pojedynczą ofertę
    /// </summary>
    public async Task<bool> SynchronizujOferteAsync(int ofertaId)
    {
        try
        {
            var oferta = await _context.Oferty
                .Include(o => o.Kategoria)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi)
                    .ThenInclude(ot => ot.Tag)
                .FirstOrDefaultAsync(o => o.IdOferta == ofertaId);

            if (oferta == null)
            {
                _logger.LogWarning("Oferta {OfertaId} nie została znaleziona w bazie danych", ofertaId);
                return false;
            }

            // Jeśli oferta jest nieaktywna lub niezatwierdzona, usuń z indeksu
            if (!oferta.Aktywna || !oferta.Zatwierdzona)
            {
                return await _searchService.UsunOferteAsync(ofertaId.ToString());
            }

            var searchDoc = MapToSearchModel(oferta);
            return await _searchService.DodajLubAktualizujOferteAsync(searchDoc);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas synchronizacji oferty {OfertaId}: {Message}", ofertaId, ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Usuwa ofertę z indeksu
    /// </summary>
    public async Task<bool> UsunOferteZIndeksuAsync(int ofertaId)
    {
        return await _searchService.UsunOferteAsync(ofertaId.ToString());
    }

    /// <summary>
    /// Mapuje model Oferta na ModelWyszukiwaniaOferty
    /// </summary>
    private ModelWyszukiwaniaOferty MapToSearchModel(Oferta oferta)
    {
        // Pobierz pierwsze zdjęcie
        var zdjecie = oferta.Zdjecia.FirstOrDefault();

        return new ModelWyszukiwaniaOferty
        {
            OfertaId = oferta.IdOferta.ToString(),
            Nazwa = oferta.Nazwa,
            Opis = oferta.Opis,
            Typ = oferta.Typ,
            Cena = oferta.Cena.HasValue ? (double)oferta.Cena.Value : null,
            CenaPoprzednia = oferta.CenaPoprzednia.HasValue ? (double)oferta.CenaPoprzednia.Value : null,
            Kod = oferta.Kod,
            Kategoria = oferta.Kategoria?.Nazwa,
            Sklep = ExtractShopName(oferta.Link),
            Link = oferta.Link,
            DataDodania = new DateTimeOffset(oferta.DataDodania, TimeSpan.Zero),
            LiczbaHot = oferta.LiczbaHot,
            LiczbaCold = oferta.LiczbaCold,
            Status = oferta.Status,
            Aktywna = oferta.Aktywna,
            Zatwierdzona = oferta.Zatwierdzona,
            IdUzytkownik = oferta.IdUzytkownik,
            NazwaUzytkownika = oferta.Uzytkownik?.UserName,
            Zdjecie = zdjecie?.UrlZdjecia,
            Tagi = oferta.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToArray(),
            Embedding = oferta.Embedding
        };
    }

    /// <summary>
    /// Wyciąga nazwę sklepu z linku
    /// </summary>
    private string? ExtractShopName(string link)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(link))
                return null;

            var uri = new Uri(link);
            var host = uri.Host.ToLower();

            // Usuń www.
            if (host.StartsWith("www."))
                host = host.Substring(4);

            // Weź pierwszą część domeny (przed pierwszą kropką)
            var parts = host.Split('.');
            if (parts.Length > 0)
            {
                var shopName = parts[0];
                // Zamień pierwszą literę na wielką
                return char.ToUpper(shopName[0]) + shopName.Substring(1);
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Inicjalizuje indeks (tworzy jeśli nie istnieje)
    /// </summary>
    public async Task<bool> InicjalizujIndeksAsync()
    {
        return await _searchService.UtworzIndeksJesliNieIstniajeAsync();
    }
}
