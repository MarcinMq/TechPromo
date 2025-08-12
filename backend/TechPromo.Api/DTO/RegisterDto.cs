using System.ComponentModel.DataAnnotations;

// DTO: rejestracja (wejście)
namespace TechPromo.Api.DTO
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Nick jest wymagany")]
        public string Nick { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email jest wymagany")]
        [EmailAddress(ErrorMessage = "Niepoprawny format email")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hasło jest wymagane")]
        [MinLength(6, ErrorMessage = "Hasło musi mieć co najmniej 6 znaków")]
        public string Password { get; set; } = string.Empty;
    }
}
