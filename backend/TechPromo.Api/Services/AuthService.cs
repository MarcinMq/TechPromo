using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TechPromo.Api.DTOs;
using TechPromo.Api.Models;
using TechPromo.Api.ViewModels;

namespace TechPromo.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<Uzytkownik> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        public async Task<ResponseViewModel> RegisterAsync(RegisterDto model)
        {
            // Sprawdzenie, czy użytkownik o podanym e-mailu już istnieje
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return new ResponseViewModel { Status = "Error", Message = "Użytkownik z tym adresem e-mail już istnieje!" };

            // Tworzenie nowego użytkownika
            var user = new Uzytkownik
            {
                Email = model.Email,
                UserName = model.Email,
                nazwa_uzytkownika = model.NazwaUzytkownika,
                data_rejestracji = DateTime.Now,
                rola = "Uzytkownik", // Domyślna rola
                SecurityStamp = Guid.NewGuid().ToString(),
            };

            var result = await _userManager.CreateAsync(user, model.Haslo);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return new ResponseViewModel { Status = "Error", Message = $"Błąd tworzenia użytkownika: {errors}" };
            }

            // Przypisanie domyślnej roli "Uzytkownik"
            await _userManager.AddToRoleAsync(user, "Uzytkownik");

            return new ResponseViewModel { Status = "Success", Message = "Użytkownik został pomyślnie utworzony!" };
        }

        public async Task<JwtResponseViewModel> LoginAsync(LoginDto model)
        {
            // Sprawdzenie, czy użytkownik istnieje
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return new JwtResponseViewModel { Status = "Error", Message = "Nieprawidłowy adres e-mail lub hasło!" };

            // Sprawdzenie, czy hasło jest poprawne
            if (!await _userManager.CheckPasswordAsync(user, model.Haslo))
                return new JwtResponseViewModel { Status = "Error", Message = "Nieprawidłowy adres e-mail lub hasło!" };

            // Pobranie ról użytkownika
            var userRoles = await _userManager.GetRolesAsync(user);

            // Tworzenie listy claims
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // Dodanie ról do claims
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            // Generowanie tokenu JWT
            var token = GenerateToken(authClaims);

            return new JwtResponseViewModel
            {
                Status = "Success",
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                UserId = user.Id,
                Username = user.nazwa_uzytkownika,
                Roles = userRoles.ToList()
            };
        }

        public async Task<ResponseViewModel> AddRoleAsync(AddRoleDto model)
        {
            // Sprawdzenie, czy użytkownik istnieje
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return new ResponseViewModel { Status = "Error", Message = "Użytkownik nie istnieje!" };

            // Sprawdzenie, czy rola istnieje
            if (!await _roleManager.RoleExistsAsync(model.Role))
                return new ResponseViewModel { Status = "Error", Message = "Rola nie istnieje!" };

            // Sprawdzenie, czy użytkownik już ma przypisaną tę rolę
            if (await _userManager.IsInRoleAsync(user, model.Role))
                return new ResponseViewModel { Status = "Error", Message = "Użytkownik ma już przypisaną tę rolę!" };

            // Przypisanie roli do użytkownika
            var result = await _userManager.AddToRoleAsync(user, model.Role);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return new ResponseViewModel { Status = "Error", Message = $"Błąd przypisania roli: {errors}" };
            }

            // Aktualizacja pola rola w tabeli Uzytkownik
            user.rola = model.Role;
            await _userManager.UpdateAsync(user);

            return new ResponseViewModel { Status = "Success", Message = "Rola została pomyślnie przypisana!" };
        }

        private JwtSecurityToken GenerateToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

            return token;
        }
    }
}