using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

[Table("Oferta")]
public class Oferta
{
    [Key]
    public int id_oferta { get; set; }

    [Required]
    [MaxLength(200)]
    public string nazwa { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal cena { get; set; }

    public string? opis { get; set; }

    [Url]
    public string link { get; set; }

    [Url]
    public string? zdjecie { get; set; }

    public DateTime data_dodania { get; set; } = DateTime.UtcNow;

    public int liczba_hot { get; set; }
    public int liczba_cold { get; set; }
    
    public string status { get; set; }
    
    public string? tagi { get; set; }

    // Klucze obce
    public int id_uzytkownik { get; set; }
    public int id_kategoria { get; set; }

    // Właściwości nawigacyjne
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }

    [ForeignKey("id_kategoria")]
    public virtual Kategoria Kategoria { get; set; }
    
    public virtual ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
    public virtual ICollection<Glos> Glosy { get; set; } = new List<Glos>();
}