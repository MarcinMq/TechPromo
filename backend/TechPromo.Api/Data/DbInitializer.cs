using Microsoft.AspNetCore.Identity;
using TechPromo.Api.Models;

namespace TechPromo.Api.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context, 
            UserManager<Uzytkownik> userManager, 
            RoleManager<IdentityRole> roleManager)
        {
            // Upewniamy się, że baza danych istnieje
            context.Database.EnsureCreated();
            
            // Sprawdź czy role już istnieją
            if (!await roleManager.RoleExistsAsync("Administrator"))
            {
                // Tworzenie ról
                await roleManager.CreateAsync(new IdentityRole("Administrator"));
                await roleManager.CreateAsync(new IdentityRole("Moderator"));
                await roleManager.CreateAsync(new IdentityRole("Uzytkownik"));
            }

            // Sprawdź czy administrator już istnieje
            if (await userManager.FindByEmailAsync("admin@test.pl") == null)
            {
                // Tworzenie użytkownika administratora
                var admin = new Uzytkownik
                {
                    UserName = "admin@test.pl",
                    Email = "admin@test.pl",
                    nazwa_uzytkownika = "Administrator",
                    data_rejestracji = DateTime.Now,
                    EmailConfirmed = true,
                    rola = "Administrator",
                    punkty = 0
                };

                var result = await userManager.CreateAsync(admin, "Qwerty123!");

                if (result.Succeeded)
                {
                    // Przypisanie roli administratora
                    await userManager.AddToRoleAsync(admin, "Administrator");
                }
            }
        }
    }
}