using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using System.Text.Json.Serialization;

namespace TechPromo.Api.Search.Models;

/// <summary>
/// Model dokumentu dla Azure AI Search Index
/// </summary>
public class ModelWyszukiwaniaOferty
{
    [SimpleField(IsKey = true, IsFilterable = true)]
    public string OfertaId { get; set; } = string.Empty;

    [SearchableField(IsFilterable = true, IsSortable = true, AnalyzerName = LexicalAnalyzerName.Values.PlLucene)]
    public string Nazwa { get; set; } = string.Empty;

    [SearchableField(AnalyzerName = LexicalAnalyzerName.Values.PlLucene)]
    public string Opis { get; set; } = string.Empty;

    [SimpleField(IsFilterable = true, IsFacetable = true)]
    public string Typ { get; set; } = "okazja";

    [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
    public double? Cena { get; set; }

    [SimpleField(IsFilterable = true, IsSortable = true)]
    public double? CenaPoprzednia { get; set; }

    [SearchableField(IsFilterable = true)]
    public string? Kod { get; set; }

    [SearchableField(IsFilterable = true, IsFacetable = true)]
    public string? Kategoria { get; set; }

    [SearchableField]
    public string? Sklep { get; set; }

    [SimpleField]
    public string Link { get; set; } = string.Empty;

    [SimpleField(IsFilterable = true, IsSortable = true)]
    public DateTimeOffset DataDodania { get; set; }

    [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
    public int LiczbaHot { get; set; }

    [SimpleField(IsFilterable = true, IsSortable = true)]
    public int LiczbaCold { get; set; }

    [SimpleField(IsFilterable = true)]
    public string Status { get; set; } = "aktywny";

    [SimpleField(IsFilterable = true)]
    public bool Aktywna { get; set; }

    [SimpleField(IsFilterable = true)]
    public bool Zatwierdzona { get; set; }

    [SimpleField(IsFilterable = true)]
    public int IdUzytkownik { get; set; }

    [SearchableField]
    public string? NazwaUzytkownika { get; set; }

    [SimpleField]
    public string? Zdjecie { get; set; }

    [SearchableField(IsFilterable = true, IsFacetable = true)]
    public string[]? Tagi { get; set; }

    // Pole do przechowywania embeddings wektorowych (opcjonalne - dla semantic search)
    [SearchableField(IsFilterable = false, IsSortable = false)]
    public string? Embedding { get; set; }

    /// <summary>
    /// Oblicza wynik popularności oferty (hot - cold)
    /// Ignorowane przez FieldBuilder - używane tylko po stronie klienta
    /// </summary>
    [FieldBuilderIgnore]
    [JsonIgnore]
    public int WynikPopularnosci => LiczbaHot - LiczbaCold;

    /// <summary>
    /// Oblicza procentową zniżkę
    /// Ignorowane przez FieldBuilder - używane tylko po stronie klienta
    /// </summary>
    [FieldBuilderIgnore]
    [JsonIgnore]
    public double? ProcentZniżki
    {
        get
        {
            if (CenaPoprzednia.HasValue && Cena.HasValue && CenaPoprzednia > 0)
            {
                return Math.Round((1 - (Cena.Value / CenaPoprzednia.Value)) * 100, 2);
            }
            return null;
        }
    }
}
