using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Adres e-mail jest wymagany")]
        [EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Hasło jest wymagane")]
        public string Haslo { get; set; }
    }
}