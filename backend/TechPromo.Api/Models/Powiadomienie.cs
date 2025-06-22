using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Powiadomienie systemowe wysyłane do użytkownika.
    /// </summary>
    public class Powiadomienie
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdPowiadomienie { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        [MaxLength(50)]
        public string Typ { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Tresc { get; set; } = string.Empty;

        [Required]
        public DateTime DataUtworzenia { get; set; }

        public int? IdOferta { get; set; }
        public Oferta? Oferta { get; set; }

        public int? IdKomentarz { get; set; }
        public Komentarz? Komentarz { get; set; }
    }
}
