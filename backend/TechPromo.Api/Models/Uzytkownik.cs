using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Reprezentuje użytkownika systemu mogącego publikować oferty, komentować i głosować.
    /// </summary>
    public class Uzytkownik : IdentityUser<int>
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public override int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string NazwaUzytkownika { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Haslo { get; set; } = string.Empty;

        [Required]
        public DateTime DataRejestracji { get; set; }

        [Required]
        [MaxLength(20)]
        public string Rola { get; set; } = "Uzytkownik";

        public int Punkty { get; set; }

        public ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
        public ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public ICollection<Glos> Glosy { get; set; } = new List<Glos>();
        public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
        public ICollection<Zgloszenie> Zgloszenia { get; set; } = new List<Zgloszenie>();
        public ICollection<UzytkownikOdznaka> UzytkownikOdznaki { get; set; } = new List<UzytkownikOdznaka>();
        public ICollection<Aktywnosc> Aktywnosci { get; set; } = new List<Aktywnosc>();
    }
}
