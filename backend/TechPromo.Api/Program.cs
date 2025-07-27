using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;

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

// Swagger z obsługą JWT - dodaję przycisk "Authorize" do testowania API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Definiuję jak Swagger ma obsługiwać tokeny JWT
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Wpisz JWT token w formacie: Bearer {twój_token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Wymagam autoryzacji dla wszystkich chronioných endpointów
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// DbContext z Aiven PostgreSQL
builder.Services.AddDbContext<TechPromoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<Uzytkownik, IdentityRole<int>>()
    .AddEntityFrameworkStores<TechPromoDbContext>();

// JWT - konfiguracja tokenu do logowania użytkowników
var jwtSettings = builder.Configuration.GetSection("Jwt");

// Pobieram klucz JWT z zmiennej środowiskowej albo z appsettings (backup)
// Ten klucz służy do podpisywania tokenów - musi być długi i tajny
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
             ?? jwtSettings["Key"] 
             ?? throw new InvalidOperationException("Brak klucza JWT! Ustaw zmienną JWT_SECRET_KEY.");

var key = Encoding.UTF8.GetBytes(jwtKey);

// Dodaję JWT do systemu autoryzacji - sprawdza tokeny przy każdym zapytaniu
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Tu ustawiam jak sprawdzać czy token jest prawdziwy
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,        // Sprawdź kto wydał token
        ValidateAudience = true,      // Sprawdź dla kogo jest token  
        ValidateLifetime = true,      // Sprawdź czy token nie wygasł
        ValidateIssuerSigningKey = true, // Sprawdź podpis cyfrowy
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero     // Bez tolerancji czasu - token wygasa dokładnie w czasie
    };
});

// Rejestruję serwis do tworzenia tokenów JWT
builder.Services.AddScoped<IJwtService, JwtService>();

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

// Obsługa plików statycznych (zdjęcia ofert)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
