using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTOs
{
    public class AddRoleDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Role { get; set; }
    }
}