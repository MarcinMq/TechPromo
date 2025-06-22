using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TechPromo.Api.Data;
using TechPromo.Api.Models;
using TechPromo.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Dodaj kontrolery
builder.Services.AddControllers();

// Swagger (API dokumentacja)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext z Aiven PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity configuration using custom user
builder.Services
    .AddIdentity<Uzytkownik, IdentityRole<int>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var key = Encoding.UTF8.GetBytes(jwtKey!);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddScoped<JwtService>();

var app = builder.Build();

// Seed roles and default admin
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    var userManager = services.GetRequiredService<UserManager<Uzytkownik>>();

    string[] roles = ["Uzytkownik", "Moderator", "Admin"];
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole<int>(role));
    }

    var adminEmail = "admin@test.pl";
    var admin = await userManager.FindByEmailAsync(adminEmail);
    if (admin == null)
    {
        admin = new Uzytkownik
        {
            UserName = adminEmail,
            Email = adminEmail,
            NazwaUzytkownika = "Admin",
            DataRejestracji = DateTime.UtcNow,
            Rola = "Admin"
        };
        admin.Haslo = userManager.PasswordHasher.HashPassword(admin, "Qwerty123!");

        await userManager.CreateAsync(admin, "Qwerty123!");
        await userManager.AddToRoleAsync(admin, "Admin");
    }
}

// Użyj Swaggera w trybie dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
