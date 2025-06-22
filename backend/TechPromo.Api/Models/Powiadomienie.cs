using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Powiadomienie
    {
        [Key]
        public int id_powiadomienie { get; set; }
        
        public string id_uzytkownik { get; set; }
        
        [MaxLength(50)]
        public string typ { get; set; }
        
        public string tresc { get; set; }
        
        public DateTime data_utworzenia { get; set; }
        
        public int? id_oferta { get; set; }
        
        public int? id_komentarz { get; set; }

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
        
        [ForeignKey("id_oferta")]
        public virtual Oferta Oferta { get; set; }
        
        [ForeignKey("id_komentarz")]
        public virtual Komentarz Komentarz { get; set; }
    }
}