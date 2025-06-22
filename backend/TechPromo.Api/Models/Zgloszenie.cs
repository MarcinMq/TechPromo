using System;

namespace TechPromo.Api.Models
{
    public class Zgloszenie
    {
        public int Id { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;
        public string TypElementu { get; set; } = string.Empty;
        public int ElementId { get; set; }
        public string Opis { get; set; } = string.Empty;
        public DateTime DataZgloszenia { get; set; }
        public string? Status { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
    }
}
