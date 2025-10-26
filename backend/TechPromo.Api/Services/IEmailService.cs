namespace TechPromo.Api.Services;

/// <summary>
/// Interfejs serwisu do wysyłania emaili przez Azure Communication Services
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Wysyła email z linkiem do resetowania hasła
    /// </summary>
    Task<bool> WyslijEmailResetowaniaHaslaAsync(string email, string resetUrl);
    
    /// <summary>
    /// Wysyła email powitalny po rejestracji (opcjonalnie)
    /// </summary>
    Task<bool> WyslijEmailPowitalnyAsync(string email, string nick);
}
