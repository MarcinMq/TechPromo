using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Komentarz")]
public class Komentarz
{
    [Key]
    public int id_komentarz { get; set; }

    [Required]
    public string tresc { get; set; }

    public DateTime data_dodania { get; set; } = DateTime.UtcNow;
    
    public string status { get; set; }

    // Klucze obce
    public int id_uzytkownik { get; set; }
    public int id_oferta { get; set; }

    // Właściwości nawigacyjne
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }

    [ForeignKey("id_oferta")]
    public virtual Oferta Oferta { get; set; }

    public virtual ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
}
