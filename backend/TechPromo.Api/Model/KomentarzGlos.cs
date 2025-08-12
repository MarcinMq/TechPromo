using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Model
{
    public class KomentarzGlos
    {
        [Key]
        public int IdKomentarzGlos { get; set; }

        [ForeignKey("Komentarz")]
        public int IdKomentarz { get; set; }
        public Komentarz? Komentarz { get; set; }

        [ForeignKey("Uzytkownik")]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        [MaxLength(10)]
        public string TypGlosu { get; set; } = "up"; // up | down

        public DateTime DataGlosu { get; set; } = DateTime.UtcNow;
    }
}
