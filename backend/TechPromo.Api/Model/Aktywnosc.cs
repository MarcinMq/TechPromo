using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Aktywnosc
    {
        [Key]
        public int IdAktywnosc { get; set; }

        [ForeignKey("Uzytkownik")]
        public int IdUzytkownik { get; set; }
        public Uzytkownik Uzytkownik { get; set; }

        [Required]
        [MaxLength(50)]
        public string TypAktywnosci { get; set; }

        public int? IdElementu { get; set; }
        public DateTime Data { get; set; } = DateTime.UtcNow;
    }