using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services
{
    // Interfejs Azure AI Search
    public interface ISerwisWyszukiwania
    {
        // Wyszukaj oferty w indeksie
        Task<WynikWyszukiwania<ModelWyszukiwaniaOferty>> SearchOfertAsync(ZapytanieWyszukiwania query, CancellationToken cancellationToken = default);

        // Dodaj/zaktualizuj ofertę w indeksie
        Task<WynikIndeksu> IndexOfertaAsync(ModelWyszukiwaniaOferty oferta, CancellationToken cancellationToken = default);

        // Batch indexing ofert
        Task<WynikIndeksu> IndexOfertasBatchAsync(IEnumerable<ModelWyszukiwaniaOferty> ofertas, CancellationToken cancellationToken = default);

        // Usuń ofertę z indeksu
        Task<WynikIndeksu> DeleteOfertaAsync(int ofertaId, CancellationToken cancellationToken = default);

        // Wyczyść indeks
        Task<WynikIndeksu> ClearIndexAsync(CancellationToken cancellationToken = default);

        // Sprawdź czy indeks istnieje
        Task<bool> IndexExistsAsync(CancellationToken cancellationToken = default);

        // Utwórz indeks jeśli brakuje
        Task<bool> CreateIndexIfNotExistsAsync(CancellationToken cancellationToken = default);

        // Statystyki indeksu
        Task<StatystykiIndeksu> GetIndexStatisticsAsync(CancellationToken cancellationToken = default);

        // Sugestie autouzupełniania
        Task<List<string>> GetSuggestionsAsync(string partialQuery, int maxSuggestions = 5, CancellationToken cancellationToken = default);
    }

    // Statystyki indeksu Azure AI Search
    public class StatystykiIndeksu
    {
        // Liczba dokumentów w indeksie
        public long DocumentCount { get; set; }

        // Rozmiar indeksu w bajtach
        public long StorageSize { get; set; }

        // Data ostatniej aktualizacji
        public DateTimeOffset LastModified { get; set; }
    }
}