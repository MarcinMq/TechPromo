using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO
{
    public class AktualizujOferteDto
    {
        [Required]
        public string Tytul { get; set; } = string.Empty;
        public string? Opis { get; set; }
        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }
        public string? Kod { get; set; }
        public string? Link { get; set; }
    }
}
