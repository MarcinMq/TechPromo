// DTO: częściowa aktualizacja oferty
namespace TechPromo.Api.DTO
{
    // DTO aktualizacji oferty przez Admin/Moderator
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
