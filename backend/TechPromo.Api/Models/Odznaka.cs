using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Odznaka
    {
        [Key]
        public int id_odznaka { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string nazwa { get; set; }
        
        public string opis { get; set; }
        
        [MaxLength(255)]
        public string ikona { get; set; }

        // Navigation properties
        public virtual ICollection<UzytkownikOdznaka> Uzytkownicy { get; set; } = new List<UzytkownikOdznaka>();
    }
}