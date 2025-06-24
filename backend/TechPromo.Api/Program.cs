using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using TechPromo.Api.Data;
using TechPromo.Api.Model;

var builder = WebApplication.CreateBuilder(args);

//CORS (Cross-Origin Resource Sharing) - pozwala na dostęp z innej domeny
var allowedOrigin = "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevCors", policy =>
    {
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


// Dodaj kontrolery
builder.Services.AddControllers();

// Swagger (API dokumentacja)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext z Aiven PostgreSQL
builder.Services.AddDbContext<TechPromoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<Uzytkownik, IdentityRole<int>>()
    .AddEntityFrameworkStores<TechPromoDbContext>();

var app = builder.Build();

app.UseCors("FrontendDevCors");

// Inicjalizacja SeedData
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await SeedData.InitializeAsync(services);
}

//Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
