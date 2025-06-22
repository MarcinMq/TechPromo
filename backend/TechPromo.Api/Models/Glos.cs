using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Glos")]
public class Glos
{
    [Key]
    public int id_glos { get; set; }

    [Required]
    public string typ_glosu { get; set; }
    
    public DateTime data_glosu { get; set; } = DateTime.UtcNow;

    // Klucze obce
    public int id_uzytkownik { get; set; }
    public int id_oferta { get; set; }
    
    // Właściwości nawigacyjne
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }

    [ForeignKey("id_oferta")]
    public virtual Oferta Oferta { get; set; }
}
