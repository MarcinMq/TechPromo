using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    public class Oferta
    {
        [Key]
        public int id_oferta { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string nazwa { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal cena { get; set; }
        
        public int id_kategoria { get; set; }
        
        public string opis { get; set; }
        
        [MaxLength(500)]
        public string link { get; set; }
        
        [MaxLength(500)]
        public string zdjecie { get; set; }
        
        public DateTime data_dodania { get; set; }
        
        public int liczba_hot { get; set; } = 0;
        
        public int liczba_cold { get; set; } = 0;
        
        [MaxLength(50)]
        public string status { get; set; } = "aktywna";
        
        public string tagi { get; set; }
        
        public string id_uzytkownik { get; set; }

        // Navigation properties
        [ForeignKey("id_uzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; }
        
        [ForeignKey("id_kategoria")]
        public virtual Kategoria Kategoria { get; set; }
        
        public virtual ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public virtual ICollection<Glos> Glosy { get; set; } = new List<Glos>();
        public virtual ICollection<Zgloszenie> Zgloszenia { get; set; } = new List<Zgloszenie>();
    }
}