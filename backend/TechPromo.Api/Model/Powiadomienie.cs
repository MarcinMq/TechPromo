using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Powiadomienie
    {
        [Key]
        public int IdPowiadomienie { get; set; }

        [ForeignKey("Uzytkownik")]
        public int IdUzytkownik { get; set; }
        public Uzytkownik Uzytkownik { get; set; }

        [MaxLength(30)]
        public string Typ { get; set; }
        public string Tresc { get; set; }
        public DateTime DataUtworzenia { get; set; } = DateTime.UtcNow;
        public bool Przeczytane { get; set; } = false;

        [ForeignKey("Oferta")]
        public int? IdOferta { get; set; }
        public Oferta Oferta { get; set; }

        [ForeignKey("Komentarz")]
        public int? IdKomentarz { get; set; }
        public Komentarz Komentarz { get; set; }
    }