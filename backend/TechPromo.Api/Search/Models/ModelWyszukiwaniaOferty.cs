using System.Text.Json.Serialization;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;

namespace TechPromo.Api.Search.Models
{
    /// <summary>
    /// Model reprezentujący ofertę w indeksie Azure AI Search
    /// Zoptymalizowany dla szybkiego wyszukiwania i filtrowania
    /// </summary>
    public class ModelWyszukiwaniaOferty
    {
        /// <summary>
        /// Unikalny identyfikator dokumentu w indeksie
        /// </summary>
        [SimpleField(IsKey = true, IsFilterable = true)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// ID oferty w bazie danych
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("ofertaId")]
        public int OfertaId { get; set; }

        /// <summary>
        /// Nazwa oferty - główne pole do wyszukiwania
        /// </summary>
        [SearchableField(IsFilterable = true, IsSortable = true, AnalyzerName = LexicalAnalyzerName.Values.StandardLucene)]
        [JsonPropertyName("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        /// <summary>
        /// Opis oferty - drugie najważniejsze pole do wyszukiwania
        /// </summary>
        [SearchableField(AnalyzerName = LexicalAnalyzerName.Values.StandardLucene)]
        [JsonPropertyName("opis")]
        public string Opis { get; set; } = string.Empty;

        /// <summary>
        /// Kategoria oferty - do filtrowania
        /// </summary>
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("kategoria")]
        public string Kategoria { get; set; } = string.Empty;

        /// <summary>
        /// Sklep oferujący - do filtrowania
        /// </summary>
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("sklep")]
        public string Sklep { get; set; } = string.Empty;

        /// <summary>
        /// Nazwa użytkownika który dodał ofertę
        /// </summary>
        [SearchableField(IsFilterable = true)]
        [JsonPropertyName("autor")]
        public string Autor { get; set; } = string.Empty;

        /// <summary>
        /// Aktualna cena oferty
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
        [JsonPropertyName("cena")]
        public double? Cena { get; set; }

        /// <summary>
        /// Poprzednia cena (przed promocją)
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("cenaPoprzednia")]
        public double? CenaPoprzednia { get; set; }

        /// <summary>
        /// Procent zniżki (obliczony)
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true, IsFacetable = true)]
        [JsonPropertyName("procentZnizki")]
        public double? ProcentZnizki { get; set; }

        /// <summary>
        /// Typ oferty (okazja, kupon)
        /// </summary>
        [SimpleField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("typ")]
        public string Typ { get; set; } = string.Empty;

        /// <summary>
        /// Data dodania oferty
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("dataDodania")]
        public DateTimeOffset DataDodania { get; set; }

        /// <summary>
        /// Liczba polubień (hot votes)
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("liczbaHot")]
        public int LiczbaHot { get; set; }

        /// <summary>
        /// Liczba negatywnych głosów (cold votes)
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("liczbaCold")]
        public int LiczbaCold { get; set; }

        /// <summary>
        /// Wynik popularności (hot - cold)
        /// </summary>
        [SimpleField(IsFilterable = true, IsSortable = true)]
        [JsonPropertyName("wynikPopularnosci")]
        public int WynikPopularnosci { get; set; }

        /// <summary>
        /// Czy oferta jest aktywna
        /// </summary>
        [SimpleField(IsFilterable = true)]
        [JsonPropertyName("aktywna")]
        public bool Aktywna { get; set; }

        /// <summary>
        /// Czy oferta została zatwierdzona przez moderatora
        /// </summary>
        [SimpleField(IsFilterable = true)]
        [JsonPropertyName("zatwierdzona")]
        public bool Zatwierdzona { get; set; }

        /// <summary>
        /// Tagi oferty - do wyszukiwania i filtrowania
        /// </summary>
        [SearchableField(IsFilterable = true, IsFacetable = true)]
        [JsonPropertyName("tagi")]
        public ICollection<string> Tagi { get; set; } = new List<string>();

        /// <summary>
        /// URL pierwszego zdjęcia oferty
        /// </summary>
        [SimpleField]
        [JsonPropertyName("zdjecie")]
        public string? Zdjecie { get; set; }

        /// <summary>
        /// Link do oferty w sklepie
        /// </summary>
        [SimpleField]
        [JsonPropertyName("link")]
        public string Link { get; set; } = string.Empty;

        /// <summary>
        /// Kod promocyjny (jeśli dotyczy)
        /// </summary>
        [SearchableField(IsFilterable = true)]
        [JsonPropertyName("kod")]
        public string? Kod { get; set; }
    }
}