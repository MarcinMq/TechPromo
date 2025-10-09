namespace TechPromo.Api.Search.Models;

/// <summary>
/// Parametry zapytania wyszukiwania
/// </summary>
public class ZapytanieWyszukiwania
{
    /// <summary>
    /// Tekst wyszukiwania
    /// </summary>
    public string? Zapytanie { get; set; }

    /// <summary>
    /// Numer strony (zaczyna się od 1)
    /// </summary>
    public int Strona { get; set; } = 1;

    /// <summary>
    /// Liczba wyników na stronę
    /// </summary>
    public int RozmiarStrony { get; set; } = 20;

    /// <summary>
    /// Filtr kategorii
    /// </summary>
    public string? Kategoria { get; set; }

    /// <summary>
    /// Minimalna cena
    /// </summary>
    public double? MinCena { get; set; }

    /// <summary>
    /// Maksymalna cena
    /// </summary>
    public double? MaxCena { get; set; }

    /// <summary>
    /// Typ oferty (okazja/kupon)
    /// </summary>
    public string? Typ { get; set; }

    /// <summary>
    /// Nazwa sklepu
    /// </summary>
    public string? Sklep { get; set; }

    /// <summary>
    /// Minimalna liczba głosów "hot"
    /// </summary>
    public int? MinHot { get; set; }

    /// <summary>
    /// Sortowanie: relevance, date, price_asc, price_desc, hot, popularity
    /// </summary>
    public string Sortowanie { get; set; } = "relevance";

    /// <summary>
    /// Tylko zatwierdzone oferty
    /// </summary>
    public bool TylkoZatwierdzone { get; set; } = true;

    /// <summary>
    /// Tylko aktywne oferty
    /// </summary>
    public bool TylkoAktywne { get; set; } = true;

    /// <summary>
    /// Tagi do filtrowania
    /// </summary>
    public string[]? Tagi { get; set; }

    /// <summary>
    /// Oblicza offset dla paginacji
    /// </summary>
    public int Offset => (Strona - 1) * RozmiarStrony;
}
