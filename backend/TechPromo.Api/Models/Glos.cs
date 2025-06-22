using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Glos
    {
        [Key]
        public int id_glos { get; set; }
        
        public string id_uzytkownik { get; set; }
        
        public int id_oferta { get; set; }
        
        [MaxLength(10)]
        public string typ_glosu { get; set; } // "hot" or "cold"
        
        public DateTime data_glosu { get; set; }

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
        
        [ForeignKey("id_oferta")]
        public virtual Oferta Oferta { get; set; }
    }
}