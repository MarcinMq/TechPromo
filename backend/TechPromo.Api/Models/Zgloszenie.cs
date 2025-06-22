using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Zgłoszenie nadużycia przez użytkownika dotyczące oferty lub komentarza.
    /// </summary>
    public class Zgloszenie
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdZgloszenie { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        [MaxLength(20)]
        public string TypElementu { get; set; } = string.Empty;

        [Required]
        public int IdElementu { get; set; }

        [Required]
        [MaxLength(500)]
        public string Opis { get; set; } = string.Empty;

        [Required]
        public DateTime DataZgloszenia { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;
    }
}
