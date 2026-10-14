using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Moq;
using SkiaSharp;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;

namespace TechPromo.Testy.Security;

public sealed class SecurityFactory : WebApplicationFactory<Program>
{
    private readonly string database = Guid.NewGuid().ToString();
    public Mock<ISerwisModeracjiTresci> Moderation { get; } = new();
    public string? ConfirmationLink { get; private set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "SecurityRegressionTestKey_OnlyForTests_1234567890");
        builder.UseSetting("Startup:SeedData", "false");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "SecurityRegressionTestKey_OnlyForTests_1234567890",
            ["Jwt:Issuer"] = "TechPromoApi", ["Jwt:Audience"] = "TechPromoUsers",
            ["Startup:SeedData"] = "false"
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<TechPromoDbContext>>();
            services.AddDbContext<TechPromoDbContext>(options => options.UseInMemoryDatabase(database));
            Moderation.Setup(x => x.ModerujTekstAsync(It.IsAny<string>())).ReturnsAsync(WynikModeracjiTresci.Bezpieczny());
            Moderation.Setup(x => x.ModerujObrazAsync(It.IsAny<byte[]>())).ReturnsAsync(WynikModeracjiTresci.Bezpieczny());
            services.RemoveAll<ISerwisModeracjiTresci>();
            services.AddSingleton(Moderation.Object);
            var email = new Mock<IEmailService>();
            email.Setup(x => x.WyslijEmailPotwierdzeniaAsync(It.IsAny<string>(), It.IsAny<string>()))
                .Callback<string, string>((_, link) => ConfirmationLink = link).ReturnsAsync(true);
            services.RemoveAll<IEmailService>();
            services.AddSingleton(email.Object);
        });
    }

    public async Task<(int Id, string Token)> CreateAccountAsync(string role = "Uzytkownik")
    {
        using var scope = Services.CreateScope();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole<int>(role));
        var users = scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>();
        var user = new Uzytkownik { UserName = "user" + Guid.NewGuid().ToString("N"), Email = "user" + Guid.NewGuid().ToString("N") + "@example.test" };
        var result = await users.CreateAsync(user, "SecurityTest123!");
        Assert.True(result.Succeeded);
        await users.AddToRoleAsync(user, role);
        return (user.Id, await scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateTokenAsync(user));
    }

    public async Task<int> CreateOfferAsync(int owner, bool visible = true)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TechPromoDbContext>();
        var offer = new Oferta { Nazwa = "Test", Opis = "Test", IdUzytkownik = owner, Zatwierdzona = visible, Aktywna = visible };
        db.Oferty.Add(offer);
        await db.SaveChangesAsync();
        return offer.IdOferta;
    }
}

public sealed class SecurityRegressionTests
{
    private static void Authorize(HttpClient client, string token) => client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    [Fact]
    public async Task PublicDiagnosticsRequireAdmin()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/uzytkownicy")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/test/moderacja", new { tekst = "test" })).StatusCode);
        var user = await app.CreateAccountAsync();
        Authorize(client, user.Token);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/uzytkownicy")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/test/moderacja", new { tekst = "test" })).StatusCode);
    }

    [Fact]
    public async Task PasswordResetInvalidatesOldJwt()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync();
        string resetToken, email;
        using (var scope = app.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>();
            var user = (await users.FindByIdAsync(account.Id.ToString()))!;
            resetToken = await users.GeneratePasswordResetTokenAsync(user);
            email = user.Email!;
        }
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/konto/resetuj-haslo", new { email, token = resetToken, noweHaslo = "ChangedSecurity123!" })).StatusCode);
        Authorize(client, account.Token);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/konto/profil")).StatusCode);
    }

    [Fact]
    public async Task RoleRemovalInvalidatesAdminJwt()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync("Admin");
        Authorize(client, account.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/uzytkownicy")).StatusCode);
        using (var scope = app.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>();
            await users.RemoveFromRoleAsync((await users.FindByIdAsync(account.Id.ToString()))!, "Admin");
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/uzytkownicy")).StatusCode);
    }

    [Fact]
    public async Task EmptyProfileUpdateDoesNotExtendSession()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync();
        Authorize(client, account.Token);
        var response = await client.PutAsJsonAsync("/konto/profil", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var reader = new JwtSecurityTokenHandler();
        Assert.Equal(reader.ReadJwtToken(account.Token).ValidTo, reader.ReadJwtToken(body.GetProperty("token").GetString()).ValidTo);
    }

    [Fact]
    public async Task EmailChangeRequiresPasswordAndMailboxConfirmation()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync();
        Authorize(client, account.Token);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/konto/profil", new { email = "new@example.test" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync("/konto/profil", new { email = "new@example.test", hasloAktualne = "SecurityTest123!" })).StatusCode);
        using (var scope = app.Services.CreateScope())
            Assert.NotEqual("new@example.test", (await scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>().FindByIdAsync(account.Id.ToString()))!.Email);
        var fragment = new Uri(app.ConfirmationLink!).Fragment.TrimStart('#');
        var values = fragment.Split('&').Select(x => x.Split('=', 2)).ToDictionary(x => x[0], x => Uri.UnescapeDataString(x[1]));
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/konto/potwierdz-email", new { userId = account.Id, token = values["token"], email = values["email"] })).StatusCode);
        using (var scope = app.Services.CreateScope())
            Assert.Equal("new@example.test", (await scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>().FindByIdAsync(account.Id.ToString()))!.Email);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/konto/profil")).StatusCode);
    }

    [Fact]
    public async Task LoginLocksAccountAfterFiveFailures()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync();
        string email;
        using (var scope = app.Services.CreateScope())
            email = (await scope.ServiceProvider.GetRequiredService<UserManager<Uzytkownik>>().FindByIdAsync(account.Id.ToString()))!.Email!;
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/konto/login", new { email, password = "incorrect" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/konto/login", new { email, password = "SecurityTest123!" })).StatusCode);
    }

    [Fact]
    public async Task HiddenOfferCommentsCannotBeReadOrWrittenByOthers()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var owner = await app.CreateAccountAsync();
        var offer = await app.CreateOfferAsync(owner.Id, false);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/oferta/{offer}/komentarze")).StatusCode);
        var stranger = await app.CreateAccountAsync();
        Authorize(client, stranger.Token);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/uzytkownik/oferta/{offer}/komentarz", new { tresc = "test" })).StatusCode);
    }

    [Fact]
    public async Task AlternateCommentEndpointFailsClosed()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var owner = await app.CreateAccountAsync();
        var offer = await app.CreateOfferAsync(owner.Id);
        Authorize(client, owner.Token);
        app.Moderation.Setup(x => x.ModerujTekstAsync(It.IsAny<string>())).ReturnsAsync(WynikModeracjiTresci.Niedostepny());
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync($"/api/uzytkownik/oferta/{offer}/komentarz", new { tresc = "test" })).StatusCode);
        using var scope = app.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<TechPromoDbContext>().Komentarze.ToListAsync());
    }

    [Theory]
    [InlineData("attack.html")]
    [InlineData("attack.svg")]
    [InlineData("fake.png")]
    public async Task UploadRejectsActiveOrFakeImages(string filename)
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("<html><script>alert(1)</script></html>"));
        var file = new FormFile(stream, 0, stream.Length, "avatar", filename) { Headers = new HeaderDictionary(), ContentType = "image/png" };
        await Assert.ThrowsAsync<InvalidDataException>(() => SafeImageUploadMiddleware.NormalizeAsync(file));
    }

    [Fact]
    public async Task LogoutRevokesExistingToken()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var account = await app.CreateAccountAsync();
        Authorize(client, account.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/konto/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/konto/profil")).StatusCode);
    }

    [Fact]
    public async Task BlockedEditDoesNotSaveTextOrCreateCategory()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var owner = await app.CreateAccountAsync();
        var offer = await app.CreateOfferAsync(owner.Id);
        Authorize(client, owner.Token);
        app.Moderation.Setup(x => x.ModerujTekstAsync(It.IsAny<string>()))
            .ReturnsAsync(WynikModeracjiTresci.Zablokowany(new List<string> { "Hate" }, null));
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/uzytkownik/oferta/{offer}",
            new { tytul = "Blocked edit", kategoria = "NewCategory", tagi = new[] { "newtag" } })).StatusCode);
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TechPromoDbContext>();
        Assert.Equal("Test", (await db.Oferty.FindAsync(offer))!.Nazwa);
        Assert.False(await db.Kategorie.AnyAsync(x => x.Nazwa == "NewCategory"));
    }

    [Fact]
    public async Task AvatarUploadRejectsFakeMimeTypeBeforeWriting()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        Authorize(client, (await app.CreateAccountAsync()).Token);
        using var form = new MultipartFormDataContent();
        var payload = new ByteArrayContent(Encoding.UTF8.GetBytes("<script>test</script>"));
        payload.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(payload, "avatar", "fake.png");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/konto/profil/avatar", form)).StatusCode);
        app.Moderation.Verify(x => x.ModerujObrazAsync(It.IsAny<byte[]>()), Times.Never);
    }

    [Fact]
    public async Task OfferImageLimitIncludesPreviouslyUploadedImages()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        var owner = await app.CreateAccountAsync();
        var offer = await app.CreateOfferAsync(owner.Id);
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TechPromoDbContext>();
            for (var i = 0; i < 5; i++) db.OfertyZdjecia.Add(new OfertaZdjecie { IdOferta = offer, UrlZdjecia = $"/uploads/oferty/test{i}.png" });
            await db.SaveChangesAsync();
        }
        Authorize(client, owner.Token);
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(new byte[] { 1, 2, 3 }), "zdjecia", "test.png");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/uzytkownik/oferta/{offer}/zdjecia", form)).StatusCode);
        app.Moderation.Verify(x => x.ModerujObrazAsync(It.IsAny<byte[]>()), Times.Never);
    }

    [Fact]
    public async Task ExcessiveAuthenticationRequestsAreLimited()
    {
        using var app = new SecurityFactory();
        using var client = app.CreateClient();
        for (var i = 0; i < 10; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/konto/login", new { email = "missing@example.test", password = "irrelevant" })).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/konto/login", new { email = "missing@example.test", password = "irrelevant" })).StatusCode);
    }

    [Fact]
    public async Task UploadReencodesValidImageAndStripsTrailingContent()
    {
        using var bitmap = new SKBitmap(2, 2);
        bitmap.Erase(SKColors.Red);
        using var encoded = bitmap.Encode(SKEncodedImageFormat.Png, 100);
        using var stream = new MemoryStream();
        stream.Write(encoded.ToArray());
        stream.Write(Encoding.UTF8.GetBytes("<script>untrusted-trailing-data</script>"));
        stream.Position = 0;
        var file = new FormFile(stream, 0, stream.Length, "avatar", "test.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        var result = await SafeImageUploadMiddleware.NormalizeAsync(file);
        Assert.DoesNotContain("untrusted-trailing-data", Encoding.UTF8.GetString(result));
        using var decoded = SKBitmap.Decode(result);
        Assert.Equal(2, decoded.Width);
    }

    [Theory]
    [InlineData(400)]
    [InlineData(429)]
    [InlineData(500)]
    public async Task AzureErrorsNeverApproveImages(int status)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ContentSafety:Endpoint"] = "https://example.test", ["ContentSafety:ApiKey"] = "test-only"
        }).Build();
        using var http = new HttpClient(new ErrorHandler(status));
        var service = new SerwisModeracjiTresci(configuration, Mock.Of<ILogger<SerwisModeracjiTresci>>(), http);
        var result = await service.ModerujObrazAsync(new byte[] { 1, 2, 3 });
        Assert.False(result.CzyBezpieczny);
        Assert.True(result.CzyBlad);
    }

    private sealed class ErrorHandler(int status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage((HttpStatusCode)status) { Content = new StringContent("{}") });
    }
}
