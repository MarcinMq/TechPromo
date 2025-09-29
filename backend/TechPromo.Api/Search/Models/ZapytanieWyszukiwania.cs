using Azure.Search.Documents.Models;

namespace TechPromo.Api.Search.Models
{
    // Parametry zapytania Azure AI Search
    public class ZapytanieWyszukiwania
    {
        // Tekst wyszukiwania
        public string? SearchText { get; set; }

        // Filtry OData
        public string? Filter { get; set; }

        // Pola sortowania
        public string? OrderBy { get; set; }

        // Numer strony
        public int Page { get; set; } = 0;

        // Liczba wyników na stronę
        public int PageSize { get; set; } = 20;

        // Pola facet (grupowanie)
        public List<string>? Facets { get; set; }

        // Pola podkreślenia
        public List<string>? HighlightFields { get; set; }

        // Tryb wyszukiwania
        public SearchMode SearchMode { get; set; } = SearchMode.Any;

        // Typ zapytania
        public SearchQueryType QueryType { get; set; } = SearchQueryType.Simple;
    }
}