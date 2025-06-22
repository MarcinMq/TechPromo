using System;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Aktywnosc
    {
        [Key]
        public int Id { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;
        public string TypAktywnosci { get; set; } = string.Empty;
        public int ElementId { get; set; }
        public DateTime Data { get; set; }

        public ApplicationUser? Uzytkownik { get; set; }
    }
}
