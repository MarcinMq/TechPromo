using Azure.Search.Documents.Models;

namespace TechPromo.Api.Search.Models
{
    // Wynik wyszukiwania Azure AI Search
    public class WynikWyszukiwania<T>
    {
        // Lista znalezionych dokumentów
        public List<ElementWyniku<T>> Items { get; set; } = new();

        // Łączna liczba dokumentów
        public long TotalCount { get; set; }

        // Aktualna strona
        public int CurrentPage { get; set; }

        // Rozmiar strony
        public int PageSize { get; set; }

        // Łączna liczba stron
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        // Poprzednie strony dostępne
        public bool HasPreviousPage => CurrentPage > 0;

        // Następne strony dostępne
        public bool HasNextPage => CurrentPage < TotalPages - 1;

        // Facets (grupowania)
        public Dictionary<string, IList<FacetResult>> Facets { get; set; } = new();

        // Czas wykonania zapytania
        public double ExecutionTimeMs { get; set; }
    }

    // Element wyniku wyszukiwania
    public class ElementWyniku<T>
    {
        // Dokument
        public T Document { get; set; } = default!;

        // Wynik relevancji
        public double? Score { get; set; }

        // Podkreślone fragmenty
        public Dictionary<string, IList<string>> Highlights { get; set; } = new();
    }
}