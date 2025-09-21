using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Model
{
    public class ZapisanaOferta
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int IdUzytkownik { get; set; }

        [Required]
        public int IdOferta { get; set; }

        [Required]
        public DateTime DataZapisania { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("IdUzytkownik")]
        public virtual Uzytkownik Uzytkownik { get; set; } = null!;

        [ForeignKey("IdOferta")]
        public virtual Oferta Oferta { get; set; } = null!;
    }
}