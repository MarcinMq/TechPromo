using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO
{
    public class DodajKomentarzDto
    {
        [Required(ErrorMessage = "Treść komentarza jest wymagana")]
        [MaxLength(500, ErrorMessage = "Komentarz nie może być dłuższy niż 500 znaków")]
        public string Tresc { get; set; }
    }
}
