namespace TechPromo.Api.DTO
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Nick { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rola { get; set; } = string.Empty;
        public int Punkty { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
