using System;

namespace TechPromo.Api.Models
{
    public class Powiadomienie
    {
        public int Id { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;
        public string Typ { get; set; } = string.Empty;
        public string Tresc { get; set; } = string.Empty;
        public DateTime DataUtworzenia { get; set; }
        public int? OfertaId { get; set; }
        public int? KomentarzId { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
        public Oferta? Oferta { get; set; }
        public Komentarz? Komentarz { get; set; }
    }
}
