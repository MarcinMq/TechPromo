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
    // Pola rozszerzone (opcjonalne) – moderator może zmieniać dodatkowe dane
    public decimal? Cena { get; set; }
    public decimal? CenaPoprzednia { get; set; }
    public string? Kod { get; set; }
    public string? Link { get; set; }
    public bool? Aktywna { get; set; }
    public bool? Zatwierdzona { get; set; }
    }

    public class RozpatrzenieDto
    {
        public string Odpowiedz { get; set; } = string.Empty;
    }

    public class PrzekazanieDto
    {
        public string Komentarz { get; set; } = string.Empty;
    }

    // DTO do zmiany kolejności zdjęć oferty
    public class FotoKolejnoscDto
    {
        public int IdOfertaZdjecie { get; set; }
        public int Kolejnosc { get; set; }
    }

    public class ZmienKolejnoscZdjecDto
    {
        public List<FotoKolejnoscDto> Kolejnosci { get; set; } = new();
    }
}
