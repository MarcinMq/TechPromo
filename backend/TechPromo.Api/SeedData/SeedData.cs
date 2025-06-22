using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TechPromo.Api.Constants;
using TechPromo.Api.Models;

namespace TechPromo.Api.SeedData;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>();

        string[] roles = new[]
        {
            Roles.Administrator,
            Roles.Moderator,
            Roles.Uzytkownik
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(role));
            }
        }

        var adminEmail = "admin@test.pl";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new Uzytkownik { UserName = adminEmail, Email = adminEmail };
            await userManager.CreateAsync(adminUser, "Qwerty123!");
            await userManager.AddToRoleAsync(adminUser, Roles.Administrator);
        }
    }
}

