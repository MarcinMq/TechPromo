using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Kategoria
    {
        [Key]
        public int Id { get; set; }
        public string Nazwa { get; set; } = string.Empty;
        public string? Opis { get; set; }

        public ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
    }
}
