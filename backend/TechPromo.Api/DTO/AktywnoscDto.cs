// DTO: aktywność użytkownika
namespace TechPromo.Api.DTO
{
    public class AktywnoscDto
    {
        public int Id { get; set; }
    public string Typ { get; set; } = string.Empty; // oferta, komentarz, glos, odznaka
    public string Opis { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
        public int? Punkty { get; set; }
    }
}
