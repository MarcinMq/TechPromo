using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Odznaka, którą może zdobyć użytkownik za aktywność.
    /// </summary>
    public class Odznaka
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdOdznaka { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nazwa { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Opis { get; set; }

        [MaxLength(255)]
        public string? Ikona { get; set; }

        public ICollection<UzytkownikOdznaka> Uzytkownicy { get; set; } = new List<UzytkownikOdznaka>();
    }
}
