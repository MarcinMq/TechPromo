using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO;

public class ZapomnianeHasloDto
{
    [Required(ErrorMessage = "Email jest wymagany")]
    [EmailAddress(ErrorMessage = "Niepoprawny format email")]
    public string Email { get; set; } = string.Empty;
}
