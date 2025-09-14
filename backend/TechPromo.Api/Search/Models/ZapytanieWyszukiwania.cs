using Azure.Search.Documents.Models;

namespace TechPromo.Api.Search.Models
{
    /// <summary>
    /// Parametry zapytania do Azure AI Search
    /// </summary>
    public class ZapytanieWyszukiwania
    {
        /// <summary>
        /// Tekst wyszukiwania - jeśli null lub pusty, zwróci wszystkie dokumenty
        /// </summary>
        public string? SearchText { get; set; }

        /// <summary>
        /// Filtry OData - np. "kategoria eq 'Elektronika'" lub "cena lt 100"
        /// </summary>
        public string? Filter { get; set; }

        /// <summary>
        /// Pola do sortowania - np. "cena asc" lub "dataDodania desc"
        /// </summary>
        public string? OrderBy { get; set; }

        /// <summary>
        /// Numer strony (zaczyna od 0)
        /// </summary>
        public int Page { get; set; } = 0;

        /// <summary>
        /// Liczba wyników na stronę (maksymalnie 50)
        /// </summary>
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// Pola do wyświetlania facet (grupowanie wyników)
        /// </summary>
        public List<string>? Facets { get; set; }

        /// <summary>
        /// Pola do podkreślenia w wynikach
        /// </summary>
        public List<string>? HighlightFields { get; set; }

        /// <summary>
        /// Tryb wyszukiwania
        /// </summary>
        public SearchMode SearchMode { get; set; } = SearchMode.Any;

        /// <summary>
        /// Typ zapytania
        /// </summary>
        public SearchQueryType QueryType { get; set; } = SearchQueryType.Simple;
    }
}