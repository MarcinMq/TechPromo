namespace TechPromo.Api.DTO
{
    public class OdznakaDto
    {
        public int idOdznaka { get; set; }
        public string nazwa { get; set; } = string.Empty;
        public string opis { get; set; } = string.Empty;
        public string ikona { get; set; } = string.Empty;
        public string dataPrzyznania { get; set; } = string.Empty;
    }
}
