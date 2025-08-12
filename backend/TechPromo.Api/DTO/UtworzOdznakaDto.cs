using System.ComponentModel.DataAnnotations;

// DTO: utworzenie odznaki
namespace TechPromo.Api.DTO
{
    public class UtworzOdznakaDto
    {
        [Required(ErrorMessage = "Nazwa odznaki jest wymagana")]
        [MaxLength(50, ErrorMessage = "Nazwa nie może być dłuższa niż 50 znaków")]
        public string Nazwa { get; set; } = string.Empty;

        [Required(ErrorMessage = "Opis odznaki jest wymagany")]
        [MaxLength(200, ErrorMessage = "Opis nie może być dłuższy niż 200 znaków")]
        public string Opis { get; set; } = string.Empty;

        public string Ikona { get; set; } = "🏆";
    }
}
