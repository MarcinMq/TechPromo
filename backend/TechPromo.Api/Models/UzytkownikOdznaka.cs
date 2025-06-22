using System;

namespace TechPromo.Api.Models
{
    public class UzytkownikOdznaka
    {
        public string UzytkownikId { get; set; } = string.Empty;
        public int OdznakaId { get; set; }
        public DateTime DataPrzyznania { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
        public Odznaka? Odznaka { get; set; }
    }
}
