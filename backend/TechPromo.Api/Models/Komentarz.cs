using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Komentarz
    {
        [Key]
        public int id_komentarz { get; set; }
        
        public string id_uzytkownik { get; set; }
        
        public int id_oferta { get; set; }
        
        [Required]
        public string tresc { get; set; }
        
        public DateTime data_dodania { get; set; }
        
        [MaxLength(50)]
        public string status { get; set; } = "aktywny";

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
        
        [ForeignKey("id_oferta")]
        public virtual Oferta Oferta { get; set; }
    }
}