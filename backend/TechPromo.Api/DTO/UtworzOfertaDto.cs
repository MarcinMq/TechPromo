using System.ComponentModel.DataAnnotations;

// DTO: utworzenie oferty
namespace TechPromo.Api.DTO
{
    public class UtworzOfertaDto
    {
        [Required(ErrorMessage = "Tytuł jest wymagany")]
        [MaxLength(100, ErrorMessage = "Tytuł nie może być dłuższy niż 100 znaków")]
    public string Tytul { get; set; } = string.Empty;

        [Required(ErrorMessage = "Opis jest wymagany")]
        [MaxLength(1000, ErrorMessage = "Opis nie może być dłuższy niż 1000 znaków")]
    public string Opis { get; set; } = string.Empty;

        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }

        [Required(ErrorMessage = "Sklep jest wymagany")]
    [MaxLength(300, ErrorMessage = "Link nie może być dłuższy niż 300 znaków")]
    public string Sklep { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kategoria jest wymagana")]
    public string Kategoria { get; set; } = string.Empty;

        public string? Tagi { get; set; } // oddzielone przecinkami
        
        public DateTime? WaznoscOd { get; set; } // Data rozpoczęcia ważności oferty
        public DateTime? WaznoscDo { get; set; } // Data zakończenia ważności oferty

        public List<IFormFile>? Zdjecia { get; set; }
    }
}
