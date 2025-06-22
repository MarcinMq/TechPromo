using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Zgloszenie
    {
        [Key]
        public int id_zgloszenie { get; set; }
        
        public string id_uzytkownik { get; set; }
        
        [MaxLength(50)]
        public string typ_elementu { get; set; } // np. "oferta", "komentarz"
        
        public int id_elementu { get; set; }
        
        public string opis { get; set; }
        
        public DateTime data_zgloszenia { get; set; }
        
        [MaxLength(50)]
        public string status { get; set; } = "oczekujące"; // np. "oczekujące", "zatwierdzone", "odrzucone"

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
    }
}