using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models.Dto;

public class RegisterDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string NazwaUzytkownika { get; set; } = string.Empty;
}
