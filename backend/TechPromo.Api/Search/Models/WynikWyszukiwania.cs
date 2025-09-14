using Azure.Search.Documents.Models;

namespace TechPromo.Api.Search.Models
{
    /// <summary>
    /// Wynik wyszukiwania z Azure AI Search
    /// </summary>
    /// <typeparam name="T">Typ dokumentu</typeparam>
    public class WynikWyszukiwania<T>
    {
        /// <summary>
        /// Lista znalezionych dokumentów
        /// </summary>
        public List<ElementWyniku<T>> Items { get; set; } = new();

        /// <summary>
        /// Łączna liczba znalezionych dokumentów
        /// </summary>
        public long TotalCount { get; set; }

        /// <summary>
        /// Aktualna strona
        /// </summary>
        public int CurrentPage { get; set; }

        /// <summary>
        /// Rozmiar strony
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Łączna liczba stron
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>
        /// Czy są poprzednie strony
        /// </summary>
        public bool HasPreviousPage => CurrentPage > 0;

        /// <summary>
        /// Czy są następne strony
        /// </summary>
        public bool HasNextPage => CurrentPage < TotalPages - 1;

        /// <summary>
        /// Facets (grupowania) zwrócone przez Azure Search
        /// </summary>
        public Dictionary<string, IList<FacetResult>> Facets { get; set; } = new();

        /// <summary>
        /// Czas wykonania zapytania w milisekundach
        /// </summary>
        public double ExecutionTimeMs { get; set; }
    }

    /// <summary>
    /// Pojedynczy element wyniku wyszukiwania
    /// </summary>
    /// <typeparam name="T">Typ dokumentu</typeparam>
    public class ElementWyniku<T>
    {
        /// <summary>
        /// Dokument
        /// </summary>
        public T Document { get; set; } = default!;

        /// <summary>
        /// Wynik relevancji (score) od Azure Search
        /// </summary>
        public double? Score { get; set; }

        /// <summary>
        /// Podkreślone fragmenty tekstu
        /// </summary>
        public Dictionary<string, IList<string>> Highlights { get; set; } = new();
    }
}