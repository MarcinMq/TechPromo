// DTO: częściowa aktualizacja oferty
namespace TechPromo.Api.DTO
{
    /// <summary>
    /// DTO do aktualizacji oferty przez Admina / Moderatora.
    /// Wszystkie pola są opcjonalne – aktualizowane są tylko te, które mają wartość.
    /// </summary>
    public class UpdateOfertaDto
    {
        public string? Tytul { get; set; }
        public string? Opis { get; set; }
        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }
        public string? Kod { get; set; }
        public string? Link { get; set; }
        public bool? Aktywna { get; set; }
        public bool? Zatwierdzona { get; set; }
    }
}
