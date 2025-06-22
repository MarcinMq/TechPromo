using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models
{
    /// <summary>
    /// Oferta promocyjna zgłoszona przez użytkownika i przypisana do kategorii.
    /// </summary>
    public class Oferta
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdOferta { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nazwa { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Cena { get; set; }

        [Required]
        public int IdKategoria { get; set; }
        public Kategoria? Kategoria { get; set; }

        [Required]
        [MaxLength(500)]
        public string Opis { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Link { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Zdjecie { get; set; }

        [Required]
        public DateTime DataDodania { get; set; }

        public int LiczbaHot { get; set; }
        public int LiczbaCold { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Tagi { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }
        public Uzytkownik? Uzytkownik { get; set; }

        public ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public ICollection<Glos> Glosy { get; set; } = new List<Glos>();
        public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
    }
}
