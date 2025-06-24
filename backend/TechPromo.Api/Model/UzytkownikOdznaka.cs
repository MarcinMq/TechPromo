using System;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class UzytkownikOdznaka
    {
        [ForeignKey("Uzytkownik")]
        public int IdUzytkownik { get; set; }
        public Uzytkownik Uzytkownik { get; set; }

        [ForeignKey("Odznaka")]
        public int IdOdznaka { get; set; }
        public Odznaka Odznaka { get; set; }

        public DateTime DataPrzyznania { get; set; } = DateTime.UtcNow;
    }

