namespace TechPromo.Api.Models.Dto;

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NazwaUzytkownika { get; set; } = string.Empty;
    public string Rola { get; set; } = string.Empty;
}
