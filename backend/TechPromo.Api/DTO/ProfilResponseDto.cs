namespace TechPromo.Api.DTO
{
    public class ProfilResponseDto
    {
        public string nick { get; set; } = string.Empty;
        public string email { get; set; } = string.Empty;
        public string rola { get; set; } = string.Empty;
        public int punkty { get; set; }
        public string dataRejestracji { get; set; } = string.Empty;
    }
}
