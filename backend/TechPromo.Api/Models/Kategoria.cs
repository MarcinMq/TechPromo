using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Opisuje kategorię, do której może należeć oferta.
    /// </summary>
    public class Kategoria
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdKategoria { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nazwa { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Opis { get; set; }

        public ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
    }
}
