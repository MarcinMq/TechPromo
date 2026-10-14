using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SkiaSharp;
using TechPromo.Api.Data;

namespace TechPromo.Api.Services;

public sealed class SafeImageUploadMiddleware(RequestDelegate next)
{
    private static readonly SemaphoreSlim[] Gates = Enumerable.Range(0, 128).Select(_ => new SemaphoreSlim(1)).ToArray();
    private static readonly SemaphoreSlim Decoders = new(2);
    private const long MaxBytes = 5 * 1024 * 1024;
    private static readonly HashSet<string> Extensions = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

    public static async Task<byte[]> NormalizeAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file.Length <= 0 || file.Length > MaxBytes || !Extensions.Contains(Path.GetExtension(file.FileName)))
            throw new InvalidDataException("Dozwolone sa obrazy jpg, png i webp do 5 MB.");

        await using var input = new MemoryStream();
        await file.CopyToAsync(input, cancellationToken);
        input.Position = 0;
        using var managedStream = new SKManagedStream(input);
        using var codec = SKCodec.Create(managedStream);
        if (codec == null || codec.EncodedFormat is not (SKEncodedImageFormat.Png or SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Webp))
            throw new InvalidDataException("Nieobslugiwany format obrazu.");
        var info = codec.Info;
        if (info.Width <= 0 || info.Height <= 0 || info.Width > 4096 || info.Height > 4096 || (long)info.Width * info.Height > 12_000_000)
            throw new InvalidDataException("Obraz przekracza limit wymiarow (4096 px, 12 megapikseli).");
        using var bitmap = new SKBitmap(new SKImageInfo(info.Width, info.Height, SKColorType.Rgba8888, SKAlphaType.Premul));
        if (codec.GetPixels(bitmap.Info, bitmap.GetPixels()) != SKCodecResult.Success)
            throw new InvalidDataException("Nieprawidlowe dane obrazu.");
        using var image = SKImage.FromBitmap(bitmap);
        // Re-encoding removes active content and prevents trusting client MIME headers.
        using var output = image.Encode(SKEncodedImageFormat.Png, 100);
        if (output == null || output.Size > MaxBytes)
            throw new InvalidDataException("Obraz po przetworzeniu przekracza 5 MB.");
        return output.ToArray();
    }

    public async Task InvokeAsync(HttpContext context, TechPromoDbContext db, ISerwisModeracjiTresci moderation)
    {
        if (!context.Request.HasFormContentType || context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var form = await context.Request.ReadFormAsync(context.RequestAborted);
        if (form.Files.Count == 0) { await next(context); return; }
        if (form.Files.Count > 5)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { message = "Maksymalnie 5 zdjec." });
            return;
        }

        var userId = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        int.TryParse(context.Request.RouteValues.GetValueOrDefault("id")?.ToString(), out var offerId);
        var isOffer = context.Request.Path.Value?.Contains("oferta", StringComparison.OrdinalIgnoreCase) == true;
        if (!await Decoders.WaitAsync(0, context.RequestAborted))
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsJsonAsync(new { message = "Przesylanie zdjec jest zajete. Sprobuj ponownie." });
            return;
        }
        // Lock both account and offer in a stable order to serialize quota checks.
        var indexes = new[] { userId % Gates.Length, isOffer && offerId > 0 ? offerId % Gates.Length : userId % Gates.Length };
        var held = new List<SemaphoreSlim>();
        var streams = new List<MemoryStream>();
        try
        {
            foreach (var index in indexes.Distinct().Order())
            {
                var gate = Gates[index];
                await gate.WaitAsync(context.RequestAborted);
                held.Add(gate);
            }
            if (isOffer)
            {
                var existing = offerId > 0 ? await db.OfertyZdjecia.CountAsync(z => z.IdOferta == offerId, context.RequestAborted) : 0;
                var userImages = await db.OfertyZdjecia.CountAsync(z => z.Oferta.IdUzytkownik == userId, context.RequestAborted);
                if (existing + form.Files.Count > 5 || userImages + form.Files.Count > 100)
                    throw new InvalidDataException("Przekroczono limit zdjec: 5 na oferte, 100 na konto.");
            }

            var files = new FormFileCollection();
            foreach (var file in form.Files)
            {
                var bytes = await NormalizeAsync(file, context.RequestAborted);
                var check = await moderation.ModerujObrazAsync(bytes);
                if (!check.CzyBezpieczny)
                {
                    context.Response.StatusCode = check.CzyBlad ? 503 : 400;
                    await context.Response.WriteAsJsonAsync(new { message = check.KomunikatDlaUzytkownika });
                    return;
                }
                var stream = new MemoryStream(bytes);
                streams.Add(stream);
                files.Add(new FormFile(stream, 0, bytes.Length, file.Name, $"{Guid.NewGuid():N}.png")
                {
                    Headers = new HeaderDictionary(), ContentType = "image/png"
                });
            }
            context.Request.Form = new FormCollection(form.ToDictionary(x => x.Key, x => x.Value), files);
            await next(context);
        }
        catch (InvalidDataException)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { message = "Nieprawidlowy obraz lub przekroczony limit zdjec." });
        }
        finally
        {
            foreach (var stream in streams) stream.Dispose();
            foreach (var gate in held) gate.Release();
            Decoders.Release();
        }
    }
}
