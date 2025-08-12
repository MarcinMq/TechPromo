using System.ComponentModel.DataAnnotations;

// DTO: zmiana punktów użytkownika
namespace TechPromo.Api.DTO
{
    public class AktualizujPunktyDto
    {
        [Required(ErrorMessage = "Liczba punktów jest wymagana")]
        [Range(0, int.MaxValue, ErrorMessage = "Punkty nie mogą być ujemne")]
        public int NowePunkty { get; set; }
    }
}
