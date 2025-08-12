// DTO: dane moderatora
namespace TechPromo.Api.DTO
{
    public class OstrzezenieDto
    {
        public string Powod { get; set; } = string.Empty;
    }

    public class OdrzucenieDto
    {
        public string Powod { get; set; } = string.Empty;
    }

    public class EdycjaOfertaDto
    {
        public string NowyTytul { get; set; } = string.Empty;
        public string NowyOpis { get; set; } = string.Empty;
        public string Powod { get; set; } = string.Empty;
    }

    public class RozpatrzenieDto
    {
        public string Odpowiedz { get; set; } = string.Empty;
    }

    public class PrzekazanieDto
    {
        public string Komentarz { get; set; } = string.Empty;
    }
}
