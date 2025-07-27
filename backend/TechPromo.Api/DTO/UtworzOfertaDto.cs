using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO
{
    public class UtworzOfertaDto
    {
        [Required(ErrorMessage = "Tytuł jest wymagany")]
        [MaxLength(100, ErrorMessage = "Tytuł nie może być dłuższy niż 100 znaków")]
        public string Tytul { get; set; }

        [Required(ErrorMessage = "Opis jest wymagany")]
        [MaxLength(1000, ErrorMessage = "Opis nie może być dłuższy niż 1000 znaków")]
        public string Opis { get; set; }

        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }

        [Required(ErrorMessage = "Sklep jest wymagany")]
        [MaxLength(100, ErrorMessage = "Nazwa sklepu nie może być dłuższa niż 100 znaków")]
        public string Sklep { get; set; }

        [Required(ErrorMessage = "Kategoria jest wymagana")]
        public string Kategoria { get; set; }

        public string? Tagi { get; set; } // oddzielone przecinkami

        public List<IFormFile>? Zdjecia { get; set; }
    }
}
