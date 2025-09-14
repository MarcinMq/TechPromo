using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services
{
    /// <summary>
    /// Interfejs do obsługi Azure AI Search
    /// </summary>
    public interface ISerwisWyszukiwania
    {
        /// <summary>
        /// Wyszukaj oferty w indeksie
        /// </summary>
        /// <param name="query">Parametry zapytania</param>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Wyniki wyszukiwania</returns>
        Task<WynikWyszukiwania<ModelWyszukiwaniaOferty>> SearchOfertAsync(ZapytanieWyszukiwania query, CancellationToken cancellationToken = default);

        /// <summary>
        /// Dodaj lub zaktualizuj ofertę w indeksie
        /// </summary>
        /// <param name="oferta">Oferta do dodania/aktualizacji</param>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Wynik operacji</returns>
        Task<WynikIndeksu> IndexOfertaAsync(ModelWyszukiwaniaOferty oferta, CancellationToken cancellationToken = default);

        /// <summary>
        /// Dodaj lub zaktualizuj wiele ofert w indeksie (batch operation)
        /// </summary>
        /// <param name="ofertas">Lista ofert do dodania/aktualizacji</param>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Wynik operacji</returns>
        Task<WynikIndeksu> IndexOfertasBatchAsync(IEnumerable<ModelWyszukiwaniaOferty> ofertas, CancellationToken cancellationToken = default);

        /// <summary>
        /// Usuń ofertę z indeksu
        /// </summary>
        /// <param name="ofertaId">ID oferty do usunięcia</param>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Wynik operacji</returns>
        Task<WynikIndeksu> DeleteOfertaAsync(int ofertaId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Usuń wszystkie dokumenty z indeksu
        /// </summary>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Wynik operacji</returns>
        Task<WynikIndeksu> ClearIndexAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Sprawdź czy indeks istnieje
        /// </summary>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>True jeśli indeks istnieje</returns>
        Task<bool> IndexExistsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Utwórz indeks jeśli nie istnieje
        /// </summary>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>True jeśli indeks został utworzony lub już istniał</returns>
        Task<bool> CreateIndexIfNotExistsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Pobierz statystyki indeksu (liczba dokumentów, rozmiar)
        /// </summary>
        /// <param name="cancellationToken">Token anulowania</param>
        /// <returns>Statystyki indeksu</returns>
        Task<StatystykiIndeksu> GetIndexStatisticsAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Statystyki indeksu Azure AI Search
    /// </summary>
    public class StatystykiIndeksu
    {
        /// <summary>
        /// Liczba dokumentów w indeksie
        /// </summary>
        public long DocumentCount { get; set; }

        /// <summary>
        /// Rozmiar indeksu w bajtach
        /// </summary>
        public long StorageSize { get; set; }

        /// <summary>
        /// Data ostatniej aktualizacji
        /// </summary>
        public DateTimeOffset LastModified { get; set; }
    }
}