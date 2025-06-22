using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Models.Dto;

public class ChangeRoleDto
{
    [Required]
    public string Rola { get; set; } = string.Empty;
}
