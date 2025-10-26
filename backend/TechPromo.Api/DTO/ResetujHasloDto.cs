using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO;

public class ResetujHasloDto
{
    [Required(ErrorMessage = "Email jest wymagany")]
    [EmailAddress(ErrorMessage = "Niepoprawny format email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Token jest wymagany")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nowe hasło jest wymagane")]
    [MinLength(6, ErrorMessage = "Hasło musi mieć minimum 6 znaków")]
    public string NoweHaslo { get; set; } = string.Empty;
}
