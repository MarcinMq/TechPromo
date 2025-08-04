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
    public string Nazwa { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Typ { get; set; } = "okazja"; // okazja lub kupon

    public decimal? Cena { get; set; }
    public decimal? CenaPoprzednia { get; set; } // Cena przed promocją
    
    [MaxLength(50)]
    public string? Kod { get; set; } // Kod promocyjny dla kuponów
    
    public string Opis { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public DateTime DataDodania { get; set; } = DateTime.UtcNow;

    public int LiczbaHot { get; set; } = 0;
    public int LiczbaCold { get; set; } = 0;

    [MaxLength(20)]
    public string Status { get; set; } = "aktywny";

    // Właściwości dla moderacji
    public bool Aktywna { get; set; } = true;
    public bool Zatwierdzona { get; set; } = false;

    [ForeignKey("Uzytkownik")]
    public int IdUzytkownik { get; set; }
    public Uzytkownik Uzytkownik { get; set; } = null!;

    [ForeignKey("Kategoria")]
    public int? IdKategoria { get; set; }
    public Kategoria? Kategoria { get; set; }

    // Opcjonalnie: jeśli chcesz przechowywać embeddingi jako tekst
    public string Embedding { get; set; } = string.Empty;

    public ICollection<OfertaZdjecie> Zdjecia { get; set; } = new List<OfertaZdjecie>();
    public ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
    public ICollection<Glos> Glosy { get; set; } = new List<Glos>();
    public ICollection<OfertaTag> OfertaTagi { get; set; } = new List<OfertaTag>();
    public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
}