using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Przechowuje głos oddany przez użytkownika na ofertę.
    /// </summary>
    public class Glos
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdGlos { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        [Required]
        public int IdOferta { get; set; }
        public Oferta? Oferta { get; set; }

        [Required]
        [MaxLength(10)]
        public string TypGlosu { get; set; } = string.Empty;

        [Required]
        public DateTime DataGlosu { get; set; }
    }
}
