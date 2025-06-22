using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Komentarz pod ofertą napisany przez użytkownika.
    /// </summary>
    public class Komentarz
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdKomentarz { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        public int IdOferta { get; set; }
        public Oferta? Oferta { get; set; }

        [Required]
        [MaxLength(500)]
        public string Tresc { get; set; } = string.Empty;

        [Required]
        public DateTime DataDodania { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
    }
}
