using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Odznaka")]
public class Odznaka
{
    [Key]
    public int id_odznaka { get; set; }

    [Required]
    [MaxLength(100)]
    public string nazwa { get; set; }

    public string opis { get; set; }

    [Url]
    public string ikona { get; set; }
    
    // Właściwość nawigacyjna
    public virtual ICollection<Uzytkownik_Odznaka> Uzytkownik_Odznaki { get; set; } = new List<Uzytkownik_Odznaka>();
}