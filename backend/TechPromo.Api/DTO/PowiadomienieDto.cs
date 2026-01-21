namespace TechPromo.Api.DTO
{
    public class PowiadomienieDto
    {
        public int Id { get; set; }
        public string Typ { get; set; } = string.Empty;
        public string Tresc { get; set; } = string.Empty;
        public DateTime DataUtworzenia { get; set; }
        public bool Przeczytane { get; set; }
        public int? IdOferta { get; set; }
        public int? IdKomentarz { get; set; }
    }
}
