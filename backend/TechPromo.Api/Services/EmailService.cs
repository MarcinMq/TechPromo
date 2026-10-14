using Azure;
using Azure.Communication.Email;

namespace TechPromo.Api.Services;

/// <summary>
/// Serwis do wysyłania emaili przez Azure Communication Services
/// </summary>
public class EmailService : IEmailService
{
    public async Task<bool> WyslijEmailPotwierdzeniaAsync(string email, string confirmationUrl)
    {
        if (_emailClient == null) return false;
        var safeUrl = System.Net.WebUtility.HtmlEncode(confirmationUrl);
        try
        {
            var message = new EmailMessage(senderAddress: _senderAddress,
                content: new EmailContent("TechPromo - Potwierdzenie adresu email")
                {
                    PlainText = $"Potwierdz adres email: {confirmationUrl}",
                    Html = $"<p>Potwierdz adres email konta TechPromo:</p><p><a href=\"{safeUrl}\">Potwierdz adres</a></p>"
                }, recipients: new EmailRecipients(new List<EmailAddress> { new(email) }));
            var operation = await _emailClient.SendAsync(WaitUntil.Completed, message);
            return operation.Value.Status == EmailSendStatus.Succeeded;
        }
        catch (Exception error)
        {
            _logger.LogError(error, "Email confirmation could not be sent.");
            return false;
        }
    }
    private readonly EmailClient? _emailClient;
    private readonly string _senderAddress;
    private readonly ILogger<EmailService> _logger;
    private readonly IWebHostEnvironment _environment;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
        
        var connectionString = configuration["EmailSettings:ConnectionString"];
        _senderAddress = configuration["EmailSettings:SenderAddress"] ?? "DoNotReply@techpromo.local";
        
        // W środowisku deweloperskim można pominąć konfigurację Azure Email
        if (!string.IsNullOrEmpty(connectionString))
        {
            _emailClient = new EmailClient(connectionString);
        }
        else
        {
            _logger.LogWarning("Azure Email nie jest skonfigurowany. Emaile będą tylko logowane.");
        }
    }

    /// <summary>
    /// Wysyła email z linkiem do resetowania hasła
    /// </summary>
    public async Task<bool> WyslijEmailResetowaniaHaslaAsync(string email, string resetUrl)
    {
        resetUrl = System.Net.WebUtility.HtmlEncode(resetUrl);
        try
        {
            var subject = "TechPromo - Resetowanie hasła";
            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🔒 Resetowanie hasła</h1>
        </div>
        <div class=""content"">
            <p>Witaj!</p>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w <strong>TechPromo</strong>.</p>
            <p>Aby ustawić nowe hasło, kliknij poniższy przycisk:</p>
            <div style=""text-align: center;"">
                <a href=""{resetUrl}"" class=""button"">Resetuj hasło</a>
            </div>
            <p style=""font-size: 12px; color: #666;"">Lub skopiuj i wklej ten link do przeglądarki:<br>
            <a href=""{resetUrl}"">{resetUrl}</a></p>
            <p style=""margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;"">
                ⚠️ <strong>Ważne:</strong> Link jest ważny przez <strong>1 godzinę</strong>.<br>
                Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
            </p>
        </div>
        <div class=""footer"">
            <p>TechPromo - Twoje źródło najlepszych promocji<br>
            © 2025 TechPromo. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>";

            // Tryb deweloperski - tylko loguj link
            if (_emailClient == null)
            {
                _logger.LogWarning("Email resetowania hasla nie zostal wyslany: brak konfiguracji.");
                return false;
            }

            var emailMessage = new EmailMessage(
                senderAddress: _senderAddress,
                content: new EmailContent(subject)
                {
                    Html = htmlContent
                },
                recipients: new EmailRecipients(new List<EmailAddress>
                {
                    new EmailAddress(email)
                }));

            EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                WaitUntil.Completed,
                emailMessage);

            _logger.LogInformation("Email resetowania hasła wysłany do {Email}, Status: {Status}", 
                email, emailSendOperation.Value.Status);

            return emailSendOperation.Value.Status == EmailSendStatus.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wysyłania emaila resetowania hasła do {Email}", email);
            return false;
        }
    }

    /// <summary>
    /// Wysyła email powitalny po rejestracji
    /// </summary>
    public async Task<bool> WyslijEmailPowitalnyAsync(string email, string nick)
    {
        nick = System.Net.WebUtility.HtmlEncode(nick);
        try
        {
            var subject = "Witaj w TechPromo! 🎉";
            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎉 Witaj w TechPromo!</h1>
        </div>
        <div class=""content"">
            <p>Cześć <strong>{nick}</strong>!</p>
            <p>Dziękujemy za rejestrację w <strong>TechPromo</strong> - Twoim źródle najlepszych promocji i okazji!</p>
            <p>Teraz możesz:</p>
            <ul>
                <li>✨ Dodawać swoje ulubione promocje</li>
                <li>🔥 Głosować na najlepsze okazje</li>
                <li>💬 Komentować i dyskutować</li>
                <li>🏆 Zdobywać odznaki i punkty</li>
            </ul>
            <p>Życzymy udanych zakupów! 🛍️</p>
        </div>
        <div class=""footer"">
            <p>TechPromo - Twoje źródło najlepszych promocji<br>
            © 2025 TechPromo. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>";

            // Tryb deweloperski - tylko loguj
            if (_emailClient == null)
            {
                _logger.LogWarning("=== TRYB DEWELOPERSKI - EMAIL POWITALNY NIE ZOSTAŁ WYSŁANY ===");
                _logger.LogInformation("Email powitalny dla {Nick} ({Email})", nick, email);
                return true; // Zwracamy sukces w trybie dev
            }

            var emailMessage = new EmailMessage(
                senderAddress: _senderAddress,
                content: new EmailContent(subject)
                {
                    Html = htmlContent
                },
                recipients: new EmailRecipients(new List<EmailAddress>
                {
                    new EmailAddress(email)
                }));

            EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                WaitUntil.Completed,
                emailMessage);

            _logger.LogInformation("Email powitalny wysłany do {Email}, Status: {Status}", 
                email, emailSendOperation.Value.Status);

            return emailSendOperation.Value.Status == EmailSendStatus.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Błąd podczas wysyłania emaila powitalnego do {Email}", email);
            return false;
        }
    }
}
