using System.ComponentModel.DataAnnotations;

// DTO: głos na ofertę
namespace TechPromo.Api.DTO
{
    public class GlosDto
    {
        [Required]
        [RegularExpression("^(hot|cold)$", ErrorMessage = "Typ głosu musi być 'hot' lub 'cold'")]
    public string Typ { get; set; } = string.Empty;
    }
}
