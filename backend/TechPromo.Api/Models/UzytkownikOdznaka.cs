using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class UzytkownikOdznaka
    {
        public string id_uzytkownik { get; set; }
        
        public int id_odznaka { get; set; }
        
        public DateTime data_przyznania { get; set; }

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
        
        [ForeignKey("id_odznaka")]
        public virtual Odznaka Odznaka { get; set; }
    }
}