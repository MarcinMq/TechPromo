using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Aktywnosc")]
public class Aktywnosc
{
    [Key]
    public int id_aktywnosc { get; set; }
    
    [Required]
    public string typ_aktywnosci { get; set; }

    public int id_elementu { get; set; }
    public DateTime data { get; set; } = DateTime.UtcNow;

    // Klucz obcy
    public int id_uzytkownik { get; set; }

    // Właściwość nawigacyjna
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }
}
