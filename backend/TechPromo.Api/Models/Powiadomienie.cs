using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Powiadomienie")]
public class Powiadomienie
{
    [Key]
    public int id_powiadomienie { get; set; }
    
    [Required]
    public string typ { get; set; }
    
    [Required]
    public string tresc { get; set; }

    public DateTime data_utworzenia { get; set; } = DateTime.UtcNow;

    // Klucze obce (nullable)
    public int id_uzytkownik { get; set; }
    public int? id_oferta { get; set; }
    public int? id_komentarz { get; set; }

    // Właściwości nawigacyjne
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }
    
    [ForeignKey("id_oferta")]
    public virtual Oferta? Oferta { get; set; }

    [ForeignKey("id_komentarz")]
    public virtual Komentarz? Komentarz { get; set; }
}