namespace TechPromo.Api.Search.Models;

/// <summary>
/// DTO dla sugestii autouzupełniania
/// </summary>
public class SugestiaDto
{
    /// <summary>
    /// ID oferty
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Nazwa oferty (tekst sugestii)
    /// </summary>
    public string Tekst { get; set; } = string.Empty;
}
