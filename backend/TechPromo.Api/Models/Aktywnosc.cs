using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Zapis aktywności użytkownika w systemie.
    /// </summary>
    public class Aktywnosc
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdAktywnosc { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        [MaxLength(50)]
        public string TypAktywnosci { get; set; } = string.Empty;

        [Required]
        public int IdElementu { get; set; }

        [Required]
        public DateTime Data { get; set; }
    }
}
