namespace TechPromo.Api.ViewModels
{
    public class JwtResponseViewModel : ResponseViewModel
    {
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public string UserId { get; set; }
        public string Username { get; set; }
        public List<string> Roles { get; set; }
    }
}