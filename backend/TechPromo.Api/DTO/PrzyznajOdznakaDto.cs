using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO
{
    public class PrzyznajOdznakaDto
    {
        [Required(ErrorMessage = "ID użytkownika jest wymagane")]
        public int IdUzytkownik { get; set; }

        [Required(ErrorMessage = "ID odznaki jest wymagane")]
        public int IdOdznaka { get; set; }
    }
}
