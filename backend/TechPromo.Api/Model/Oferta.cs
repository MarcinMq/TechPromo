using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Oferta
{
    [Key]
    public int IdOferta { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nazwa { get; set; }

    public decimal? Cena { get; set; }
    public string Opis { get; set; }
    public string Link { get; set; }
    public DateTime DataDodania { get; set; } = DateTime.UtcNow;

    public int LiczbaHot { get; set; } = 0;
    public int LiczbaCold { get; set; } = 0;

    [MaxLength(20)]
    public string Status { get; set; } = "aktywny";

    [ForeignKey("Uzytkownik")]
    public int IdUzytkownik { get; set; }
    public Uzytkownik Uzytkownik { get; set; }

    [ForeignKey("Kategoria")]
    public int? IdKategoria { get; set; }
    public Kategoria Kategoria { get; set; }

    // Opcjonalnie: jeśli chcesz przechowywać embeddingi jako tekst
    public string Embedding { get; set; }

    public ICollection<OfertaZdjecie> Zdjecia { get; set; }
    public ICollection<Komentarz> Komentarze { get; set; }
    public ICollection<Glos> Glosy { get; set; }
    public ICollection<OfertaTag> OfertaTagi { get; set; }
    public ICollection<Powiadomienie> Powiadomienia { get; set; }
}