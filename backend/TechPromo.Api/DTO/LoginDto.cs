using System.ComponentModel.DataAnnotations;

// DTO: logowanie (wejście)
namespace TechPromo.Api.DTO
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Email jest wymagany")]
        [EmailAddress(ErrorMessage = "Niepoprawny format email")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hasło jest wymagane")]
        public string Password { get; set; } = string.Empty;
    }
}
