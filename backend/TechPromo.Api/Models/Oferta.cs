using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Oferta
    {
        [Key]
        public int Id { get; set; }
        public string Nazwa { get; set; } = string.Empty;
        public decimal Cena { get; set; }
        public int KategoriaId { get; set; }
        public string? Opis { get; set; }
        public string? Link { get; set; }
        public string? Zdjecie { get; set; }
        public DateTime DataDodania { get; set; }
        public int LiczbaHot { get; set; }
        public int LiczbaCold { get; set; }
        public string? Status { get; set; }
        public string? Tagi { get; set; }
        public string UzytkownikId { get; set; } = string.Empty;

        public ApplicationUser? Uzytkownik { get; set; }
        public Kategoria? Kategoria { get; set; }
        public ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public ICollection<Glos> Glosy { get; set; } = new List<Glos>();
    }
}
