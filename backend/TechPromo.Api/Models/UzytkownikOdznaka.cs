using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Łączy użytkowników z ich zdobytymi odznakami.
    /// </summary>
    public class UzytkownikOdznaka
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        public int IdOdznaka { get; set; }
        public Odznaka? Odznaka { get; set; }

        [Required]
        public DateTime DataPrzyznania { get; set; }
    }
}
