using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Zgloszenie")]
public class Zgloszenie
{
    [Key]
    public int id_zgloszenie { get; set; }

    public string typ_elementu { get; set; }
    public int id_elementu { get; set; }

    [Required]
    public string opis { get; set; }
    public DateTime data_zgloszenia { get; set; } = DateTime.UtcNow;
    public string status { get; set; }

    // Klucz obcy
    public int id_uzytkownik { get; set; }
    
    // Właściwość nawigacyjna
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }
}
