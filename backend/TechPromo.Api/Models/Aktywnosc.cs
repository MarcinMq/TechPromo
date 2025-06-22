using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Aktywnosc
    {
        [Key]
        public int id_aktywnosc { get; set; }
        
        public string id_uzytkownik { get; set; }
        
        [MaxLength(100)]
        public string typ_aktywnosci { get; set; }
        
        public int? id_elementu { get; set; }
        
        public DateTime data { get; set; }

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
    }
}