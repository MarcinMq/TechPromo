using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services;

/// <summary>
/// Interface serwisu wyszukiwania Azure AI Search
/// </summary>
public interface ISerwisWyszukiwania
{
    /// <summary>
    /// Wyszukuje oferty według zapytania
    /// </summary>
    Task<WynikWyszukiwania<ModelWyszukiwaniaOferty>> WyszukajOfertyAsync(ZapytanieWyszukiwania zapytanie);

    /// <summary>
    /// Dodaje lub aktualizuje ofertę w indeksie
    /// </summary>
    Task<bool> DodajLubAktualizujOferteAsync(ModelWyszukiwaniaOferty oferta);

    /// <summary>
    /// Dodaje lub aktualizuje wiele ofert w indeksie (batch operation)
    /// </summary>
    Task<bool> DodajLubAktualizujOfertyAsync(IEnumerable<ModelWyszukiwaniaOferty> oferty);

    /// <summary>
    /// Usuwa ofertę z indeksu
    /// </summary>
    Task<bool> UsunOferteAsync(string ofertaId);

    /// <summary>
    /// Usuwa wiele ofert z indeksu (batch operation)
    /// </summary>
    Task<bool> UsunOfertyAsync(IEnumerable<string> ofertaIds);

    /// <summary>
    /// Sprawdza czy indeks istnieje, jeśli nie - tworzy go
    /// </summary>
    Task<bool> UtworzIndeksJesliNieIstniajeAsync();

    /// <summary>
    /// Pobiera sugestie autouzupełniania
    /// </summary>
    Task<List<string>> PobierzSugestieAsync(string zapytanie, int liczbaWynikow = 5);

    /// <summary>
    /// Pobiera liczbę dokumentów w indeksie
    /// </summary>
    Task<long?> PobierzLiczbeOfertAsync();

    /// <summary>
    /// Pobiera podobne oferty na podstawie kategorii i nazwy
    /// </summary>
    Task<List<ModelWyszukiwaniaOferty>> PobierzPodobneOfertyAsync(string ofertaId, string kategoria, string nazwa, int liczbaWynikow = 5);
}
