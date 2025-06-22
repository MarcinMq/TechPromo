using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Models;
using TechPromo.Api.SeedData;

var builder = WebApplication.CreateBuilder(args);

// Dodaj kontrolery
builder.Services.AddControllers();

// Swagger (API dokumentacja)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext z PostgreSQL. Connection string powinien być ustawiony w zmiennej środowiskowej "TECHPROMO_CONNECTION_STRING".
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("TECHPROMO_CONNECTION_STRING")
    ?? string.Empty;
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<Uzytkownik, IdentityRole<int>>(options =>
{
    options.User.RequireUniqueEmail = true;
})
    .AddRoles<IdentityRole<int>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var app = builder.Build();

// Seed roles and administrator account
await SeedData.InitializeAsync(app.Services);

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

