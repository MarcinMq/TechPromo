using System;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Komentarz
    {
        [Key]
        public int Id { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;
        public int OfertaId { get; set; }
        public string Tresc { get; set; } = string.Empty;
        public DateTime DataDodania { get; set; }
        public string? Status { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
        public Oferta? Oferta { get; set; }
    }
}
