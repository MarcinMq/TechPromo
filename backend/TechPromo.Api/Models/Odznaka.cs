using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models
{
    public class Odznaka
    {
        [Key]
        public int Id { get; set; }
        public string Nazwa { get; set; } = string.Empty;
        public string? Opis { get; set; }
        public string? Ikona { get; set; }

        public ICollection<UzytkownikOdznaka> UzytkownikOdznaki { get; set; } = new List<UzytkownikOdznaka>();
    }
}
