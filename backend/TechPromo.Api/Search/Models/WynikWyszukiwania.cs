namespace TechPromo.Api.Search.Models;

/// <summary>
/// Wynik wyszukiwania z metadanymi
/// </summary>
public class WynikWyszukiwania<T>
{
    /// <summary>
    /// Lista znalezionych dokumentów
    /// </summary>
    public List<T> Items { get; set; } = new();

    /// <summary>
    /// Całkowita liczba wyników
    /// </summary>
    public long? TotalCount { get; set; }

    /// <summary>
    /// Aktualna strona
    /// </summary>
    public int Strona { get; set; }

    /// <summary>
    /// Rozmiar strony
    /// </summary>
    public int RozmiarStrony { get; set; }

    /// <summary>
    /// Całkowita liczba stron
    /// </summary>
    public int? TotalPages => TotalCount.HasValue ? (int)Math.Ceiling(TotalCount.Value / (double)RozmiarStrony) : null;

    /// <summary>
    /// Czy są następne strony
    /// </summary>
    public bool HasNextPage => TotalPages.HasValue && Strona < TotalPages.Value;

    /// <summary>
    /// Czy są poprzednie strony
    /// </summary>
    public bool HasPreviousPage => Strona > 1;

    /// <summary>
    /// Facets - agregacje wyników (np. kategorie, zakresy cenowe)
    /// </summary>
    public Dictionary<string, List<FacetValue>>? Facets { get; set; }
}

/// <summary>
/// Wartość faceta (agregacja)
/// </summary>
public class FacetValue
{
    public string Value { get; set; } = string.Empty;
    public long Count { get; set; }
}
