// Start API: konfiguracja usług i uruchomienie.
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using TechPromo.Api.Search.Services;
using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;

var builder = WebApplication.CreateBuilder(args);

//CORS (Cross-Origin Resource Sharing) - pozwala na dostęp z innej domeny
var isDevelopment = builder.Environment.IsDevelopment();
var isTesting = builder.Environment.IsEnvironment("Testing");
var isProduction = builder.Environment.IsProduction();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if ((isDevelopment || isTesting) && allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "http://localhost:5174", "http://localhost:5175" };
}

if (isProduction && allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("Brak konfiguracji CORS dla produkcji. Ustaw Cors:AllowedOrigins.");
}

var allowedHosts = builder.Configuration["AllowedHosts"];
if (isProduction
    && (string.IsNullOrWhiteSpace(allowedHosts)
        || allowedHosts == "*"
        || allowedHosts.Contains("localhost", StringComparison.OrdinalIgnoreCase)))
{
    throw new InvalidOperationException("Brak bezpiecznej konfiguracji AllowedHosts dla produkcji.");
}
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
if (isProduction && string.IsNullOrWhiteSpace(defaultConnection))
{
    throw new InvalidOperationException("Brak ConnectionStrings:DefaultConnection dla produkcji.");
}

builder.Services.AddDbContext<TechPromoDbContext>(options =>
    options.UseNpgsql(defaultConnection));

builder.Services.AddIdentity<Uzytkownik, IdentityRole<int>>()
    .AddEntityFrameworkStores<TechPromoDbContext>()
    .AddDefaultTokenProviders(); // Dodaje token providers dla resetowania hasła, email confirmation, etc.

// JWT - konfiguracja tokenu do logowania użytkowników
var jwtSettings = builder.Configuration.GetSection("Jwt");

// Pobieram klucz JWT z zmiennej środowiskowej albo z appsettings (backup)
// Ten klucz służy do podpisywania tokenów - musi być długi i tajny
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
             ?? jwtSettings["Key"] 
             ?? throw new InvalidOperationException("Brak klucza JWT! Ustaw zmienną JWT_SECRET_KEY.");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException("Klucz JWT musi miec co najmniej 32 bajty.");
}

if (isProduction && jwtKey.Contains("DevelopmentOnly", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("Produkcja nie moze uzywac deweloperskiego klucza JWT.");
}

if (string.IsNullOrWhiteSpace(jwtSettings["Issuer"]) || string.IsNullOrWhiteSpace(jwtSettings["Audience"]))
{
    throw new InvalidOperationException("Brak konfiguracji Jwt:Issuer lub Jwt:Audience.");
}

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
builder.Services.AddScoped<IBadgeService, BadgeService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISerwisWykrywaniaDuplikatow, SerwisWykrywaniaDuplikatow>();

// Azure Content Safety - automatyczne wykrywanie wulgarnych/obraźliwych treści
if (isProduction)
{
    var emailConnectionString = builder.Configuration["EmailSettings:ConnectionString"];
    var emailSenderAddress = builder.Configuration["EmailSettings:SenderAddress"];
    var frontendUrl = builder.Configuration["EmailSettings:FrontendUrl"];

    if (string.IsNullOrWhiteSpace(emailConnectionString)
        || string.IsNullOrWhiteSpace(emailSenderAddress)
        || string.IsNullOrWhiteSpace(frontendUrl))
    {
        throw new InvalidOperationException("Brak konfiguracji EmailSettings dla produkcji.");
    }
}

var contentSafetyEndpoint = builder.Configuration["ContentSafety:Endpoint"];
var contentSafetyApiKey = builder.Configuration["ContentSafety:ApiKey"];
if (isProduction
    && (string.IsNullOrWhiteSpace(contentSafetyEndpoint) || string.IsNullOrWhiteSpace(contentSafetyApiKey)))
{
    throw new InvalidOperationException("Brak konfiguracji ContentSafety dla produkcji.");
}

builder.Services.AddSingleton<ISerwisModeracjiTresci, SerwisModeracjiTresci>();

// Hybrydowy system rekomendacji (Collaborative Filtering + Content-Based)
builder.Services.AddScoped<ISerwisRekomendacji, SerwisRekomendacji>();

// Azure AI Search - konfiguracja klientów i serwisów wyszukiwania
var azureSearchEndpoint = builder.Configuration["AzureSearch:Endpoint"];
var azureSearchApiKey = builder.Configuration["AzureSearch:ApiKey"];
var azureSearchIndexName = builder.Configuration["AzureSearch:IndexName"];
var isAzureSearchConfigured = !string.IsNullOrWhiteSpace(azureSearchEndpoint)
    && !string.IsNullOrWhiteSpace(azureSearchApiKey);

if (isProduction && !isAzureSearchConfigured)
{
    throw new InvalidOperationException("Brak konfiguracji Azure Search dla produkcji.");
}

if (isAzureSearchConfigured)
{
    var endpoint = new Uri(azureSearchEndpoint!);
    var credential = new AzureKeyCredential(azureSearchApiKey!);

    // SearchIndexClient - do zarządzania indeksami (tworzenie, usuwanie, etc.)
    builder.Services.AddSingleton(sp => new SearchIndexClient(endpoint, credential));

    // SearchClient - do wykonywania operacji na dokumentach (wyszukiwanie, dodawanie, etc.)
    builder.Services.AddSingleton(sp => new SearchClient(endpoint, azureSearchIndexName ?? "oferty-index", credential));

    // Rejestracja serwisów wyszukiwania
    builder.Services.AddScoped<ISerwisWyszukiwania, SerwisWyszukiwania>();
    builder.Services.AddScoped<SerwisSync>();
}
else
{
    // Jeśli brak konfiguracji Azure Search, loguj ostrzeżenie
    Console.WriteLine("⚠️ UWAGA: Azure AI Search nie jest skonfigurowany. Ustaw Endpoint i ApiKey w appsettings.json");
}


var app = builder.Build();

if (!isDevelopment && !isTesting)
{
    app.UseHsts();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseCors("FrontendDevCors");

// Inicjalizacja SeedData
if (builder.Configuration.GetValue("Startup:SeedData", !isProduction))
{
    using var seedScope = app.Services.CreateScope();
    await SeedData.InitializeAsync(seedScope.ServiceProvider);
}
    
    // Azure AI Search - utwórz indeks jeśli nie istnieje i zsynchronizuj dane
if (builder.Configuration.GetValue<bool>("Startup:InitializeSearchIndex")
    || builder.Configuration.GetValue<bool>("Startup:SyncSearchOnStartup"))
{
    using var searchScope = app.Services.CreateScope();
    var services = searchScope.ServiceProvider;

    try
    {
        var searchService = services.GetService<ISerwisWyszukiwania>();
        var syncService = services.GetService<SerwisSync>();
        
        if (searchService != null)
        {
            if (builder.Configuration.GetValue<bool>("Startup:InitializeSearchIndex"))
            {
                await searchService.UtworzIndeksJesliNieIstniajeAsync();
            }
            
            // Synchronizuj zawsze przy starcie (wymaganie użytkownika)
            if (syncService != null && builder.Configuration.GetValue<bool>("Startup:SyncSearchOnStartup"))
            {
                Console.WriteLine("Rozpoczynam automatyczną synchronizację z Azure Search...");
                await syncService.SynchronizujWszystkieOfertyAsync();
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Azure AI Search initialization error: {ex.Message}");
    }
    }

//Swagger
if (isDevelopment)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS redirection only in production
if (!isDevelopment && !isTesting)
{
    app.UseHttpsRedirection();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
    context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
    context.Response.Headers.TryAdd("Referrer-Policy", "no-referrer");
    context.Response.Headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (!isDevelopment)
    {
        context.Response.Headers.TryAdd("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
    }

    await next();
});

// Obsługa plików statycznych (zdjęcia ofert)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Required for integration tests (WebApplicationFactory)
public partial class Program { }
