using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class OfertaZdjecie
{
    [Key]
    public int IdOfertaZdjecie { get; set; }

    [ForeignKey("Oferta")]
    public int IdOferta { get; set; }
    public Oferta Oferta { get; set; }

    [Required]
    public string UrlZdjecia { get; set; }

    [Required]
    public int Kolejnosc { get; set; } = 1;
}