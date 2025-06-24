using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Glos
    {
        [Key]
        public int IdGlos { get; set; }

        [ForeignKey("Uzytkownik")]
        public int IdUzytkownik { get; set; }
        public Uzytkownik Uzytkownik { get; set; }

        [ForeignKey("Oferta")]
        public int IdOferta { get; set; }
        public Oferta Oferta { get; set; }

        [Required]
        [MaxLength(10)]
        public string TypGlosu { get; set; } // 'hot' lub 'cold'

        public DateTime DataGlosu { get; set; } = DateTime.UtcNow;
    }