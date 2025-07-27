namespace TechPromo.Api.DTO
{
    public class AktywnoscDto
    {
        public int Id { get; set; }
        public string Typ { get; set; } // oferta, komentarz, glos, odznaka
        public string Opis { get; set; }
        public string Data { get; set; }
        public int? Punkty { get; set; }
    }
}
