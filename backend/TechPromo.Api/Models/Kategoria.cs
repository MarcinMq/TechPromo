using System.Collections.Generic;

namespace TechPromo.Api.Models
{
    public class Kategoria
    {
        public int Id { get; set; }
        public string Nazwa { get; set; } = string.Empty;
        public string? Opis { get; set; }

        public ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
    }
}
