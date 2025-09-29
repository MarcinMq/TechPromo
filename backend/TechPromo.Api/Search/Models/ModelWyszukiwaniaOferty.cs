using System.Text.Json.Serialization;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;

namespace TechPromo.Api.Search.Models
{
    // Model oferty w indeksie Azure AI Search
    public class ModelWyszukiwaniaOferty
    {
        // Identyfikator dokumentu w indeksie
        [SimpleField(IsKey = true, IsFilterable = true)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        // ID oferty w bazie
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("ofertaId")]
        public int OfertaId { get; set; }

        // Nazwa oferty
        [SearchableField(IsFilterable = true, IsSortable = true, AnalyzerName = LexicalAnalyzerName.Values.StandardLucene)]
        [JsonPropertyName("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        // Opis oferty
        [SearchableField(AnalyzerName = LexicalAnalyzerName.Values.StandardLucene)]
        [JsonPropertyName("opis")]
        public string Opis { get; set; } = string.Empty;

        // Kategoria oferty
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("kategoria")]
        public string Kategoria { get; set; } = string.Empty;

        // Sklep oferujący
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("sklep")]
        public string Sklep { get; set; } = string.Empty;

        // Autor oferty
        [SearchableField(IsFilterable = true)]
        [JsonPropertyName("autor")]
        public string Autor { get; set; } = string.Empty;

        // Aktualna cena
        [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
        [JsonPropertyName("cena")]
        public double? Cena { get; set; }

        // Poprzednia cena
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("cenaPoprzednia")]
        public double? CenaPoprzednia { get; set; }

        // Procent zniżki
        [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
        [JsonPropertyName("procentZnizki")]
        public double? ProcentZnizki { get; set; }

        // Typ oferty
        [SimpleField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("typ")]
        public string Typ { get; set; } = string.Empty;

        // Data dodania
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("dataDodania")]
        public DateTimeOffset DataDodania { get; set; }

        // Liczba polubień
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("liczbaHot")]
        public int LiczbaHot { get; set; }

        // Liczba negatywnych głosów
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("liczbaCold")]
        public int LiczbaCold { get; set; }

        // Wynik popularności
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("wynikPopularnosci")]
        public int WynikPopularnosci { get; set; }

        // Czy oferta aktywna
        [SimpleField(IsFilterable = true)]
        [JsonPropertyName("aktywna")]
        public bool Aktywna { get; set; }

        // Czy zatwierdzona przez moderatora
        [SimpleField(IsFilterable = true)]
        [JsonPropertyName("zatwierdzona")]
        public bool Zatwierdzona { get; set; }

        // Tagi oferty
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("tagi")]
        public ICollection<string> Tagi { get; set; } = new List<string>();

        // URL pierwszego zdjęcia
        [SimpleField]
        [JsonPropertyName("zdjecie")]
        public string? Zdjecie { get; set; }

        // Link do oferty
        [SimpleField]
        [JsonPropertyName("link")]
        public string Link { get; set; } = string.Empty;

        // Kod promocyjny
        [SearchableField(IsFilterable = true)]
        [JsonPropertyName("kod")]
        public string? Kod { get; set; }
    }
}