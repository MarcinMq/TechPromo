using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TechPromo.Api.Data;

namespace TechPromo.Testy.Integracyjne
{
    /// <summary>
    /// Custom WebApplicationFactory for integration tests.
    /// Configures in-memory database and test JWT settings.
    /// </summary>
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Set environment variable before configuration
            Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "TestSecretKeyForIntegrationTests1234567890AbCdEf!@#$%");

            builder.ConfigureAppConfiguration((context, config) =>
            {
                // Add test configuration with JWT settings
                var testConfig = new Dictionary<string, string?>
                {
                    ["Jwt:Issuer"] = "TechPromoTest",
                    ["Jwt:Audience"] = "TechPromoTestUsers",
                    ["Jwt:ExpiryInMinutes"] = "60",
                    ["Jwt:Key"] = "TestSecretKeyForIntegrationTests1234567890AbCdEf!@#$%"
                };

                config.AddInMemoryCollection(testConfig);
            });

            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<TechPromoDbContext>));

                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing (unique per factory instance)
                services.AddDbContext<TechPromoDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
                });
            });

            builder.UseEnvironment("Testing");
        }
    }
}
