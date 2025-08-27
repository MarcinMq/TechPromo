using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using TechPromo.Api.Model;

namespace TechPromo.Api.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<Uzytkownik>>();
            var db = serviceProvider.GetRequiredService<TechPromoDbContext>();

            // Role
            string[] roles = { "Admin", "Moderator", "Uzytkownik" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole<int>(role));
            }

            // Użytkownicy: email, hasło, rola, nick
            await CreateUserAsync(userManager, "admin@techpromo.pl", "Qwerty123!", "Admin", "admin");
            await CreateUserAsync(userManager, "moderator@techpromo.pl", "Qwerty123!", "Moderator", "moderator");
            await CreateUserAsync(userManager, "uzytkownik@techpromo.pl", "Qwerty123!", "Uzytkownik", "uzytkownik");

            // Seed odznak jeśli nie istnieją
            var badges = new (string code, string name, string desc, string icon)[]
            {
                ("first_deal","Pierwsza okazja","first_deal","🏁"),
                ("deals_5","5 okazji","deals_5","🥉"),
                ("hot_50","Gorąca 50°","hot_50","🔥"),
                ("comments_10","10 komentarzy","comments_10","💬"),
                ("first_vote","Pierwszy głos","first_vote","👍"),
                ("avatar_set","Avatar ustawiony","avatar_set","🖼️"),
            };

            foreach (var b in badges)
            {
                if (!db.Odznaki.Any(o => o.Nazwa == b.code || o.Opis == b.code))
                {
                    db.Odznaki.Add(new Odznaka
                    {
                        Nazwa = b.name,
                        Opis = b.code, // używamy Opis jako kod techniczny aby nie ruszać modelu
                        Ikona = b.icon
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task CreateUserAsync(UserManager<Uzytkownik> userManager, string email, string password, string role, string nick)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new Uzytkownik
                {
                    UserName = nick,           
                    Email = email,
                    EmailConfirmed = true,
                    DataRejestracji = DateTime.UtcNow,
                    Punkty = 0
                };
                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }
        }
    }
}
