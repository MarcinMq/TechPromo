using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Kategoria
    {
        [Key]
        public int id_kategoria { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string nazwa { get; set; }
        
        public string opis { get; set; }

        // Navigation properties
        public virtual ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
    }
}