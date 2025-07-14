using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TechPromo.Api.Model;

namespace TechPromo.Api.Services
{
    // Interfejs - co mój serwis JWT umie robić
    public interface IJwtService
    {
        Task<string> GenerateTokenAsync(Uzytkownik user);
    }

    // Serwis do tworzenia tokenów JWT - jak fabryka tokenów
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly UserManager<Uzytkownik> _userManager;

        public JwtService(IConfiguration configuration, UserManager<Uzytkownik> userManager)
        {
            _configuration = configuration;
            _userManager = userManager;
        }

        // Główna metoda - tworzy token JWT dla zalogowanego użytkownika
        public async Task<string> GenerateTokenAsync(Uzytkownik user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            
            // Pobieram tajny klucz do podpisywania tokenów
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
                         ?? jwtSettings["Key"] 
                         ?? throw new InvalidOperationException("Brak klucza JWT do podpisania tokenu!");
            
            var key = Encoding.UTF8.GetBytes(jwtKey);
            
            // Pobieram role użytkownika (Admin, Uzytkownik, etc.)
            var roles = await _userManager.GetRolesAsync(user);
            
            // Claims = dane które będą w tokenie (jak dowód osobisty)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // ID użytkownika
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty), // Nick
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),   // Email
                new Claim("punkty", user.Punkty.ToString()),               // Punkty w grze
                new Claim("dataRejestracji", user.DataRejestracji.ToString("O")) // Kiedy się zarejestrował
            };

            // Dodaję wszystkie role użytkownika do tokenu
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Ustawienia tokenu - jak długo ma być ważny i kto go wydał
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),           // Dane użytkownika
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationMinutes"]!)), // Wygasa za 60 minut
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256), // Podpis cyfrowy
                Issuer = jwtSettings["Issuer"],     // Kto wydał token (moja aplikacja)
                Audience = jwtSettings["Audience"]  // Dla kogo jest token (użytkownicy)
            };

            // Tworzę i zwracam gotowy token jako string
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return tokenHandler.WriteToken(token);
        }
    }
}
