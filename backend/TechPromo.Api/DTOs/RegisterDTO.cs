using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Adres e-mail jest wymagany")]
        [EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Nazwa użytkownika jest wymagana")]
        public string NazwaUzytkownika { get; set; }

        [Required(ErrorMessage = "Hasło jest wymagane")]
        [MinLength(8, ErrorMessage = "Hasło musi zawierać co najmniej 8 znaków")]
        public string Haslo { get; set; }

        [Required(ErrorMessage = "Potwierdzenie hasła jest wymagane")]
        [Compare("Haslo", ErrorMessage = "Hasło i potwierdzenie hasła nie są zgodne")]
        public string PotwierdzHaslo { get; set; }
    }
}