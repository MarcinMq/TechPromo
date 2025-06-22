using System;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Glos
    {
        [Key]
        public int Id { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;
        public int OfertaId { get; set; }
        public string TypGlosu { get; set; } = string.Empty;
        public DateTime DataGlosu { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
        public Oferta? Oferta { get; set; }
    }
}
