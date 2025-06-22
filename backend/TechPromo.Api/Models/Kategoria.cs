using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Kategoria")]
public class Kategoria
{
    [Key]
    public int id_kategoria { get; set; }

    [Required]
    [MaxLength(100)]
    public string nazwa { get; set; }
    
    public string? opis { get; set; }

    // Właściwość nawigacyjna
    public virtual ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
}
