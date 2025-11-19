namespace TechPromo.Api.Services
{
    public interface ISerwisWykrywaniaDuplikatow
    {
        /// <summary>
        /// Sprawdza czy oferta jest potencjalnym duplikatem
        /// </summary>
        Task<WynikSprawdzaniaDuplikatow> SprawdzDuplikatyAsync(string nazwa, string? link, string? sklep, decimal? cena);
        
        /// <summary>
        /// Znajduje podobne oferty na podstawie nazwy
        /// </summary>
        Task<List<PodobnaOfertaDto>> ZnajdzPodobneOfertyAsync(string nazwa, int maxWynikow = 5);
    }

    public class WynikSprawdzaniaDuplikatow
    {
        public bool CzyPotencjalnyDuplikat { get; set; }
        public List<DopasowanieDuplikatu> PotencjalneDuplikaty { get; set; } = new();
        public string Wiadomosc { get; set; } = string.Empty;
    }

    public class DopasowanieDuplikatu
    {
        public int OfertaId { get; set; }
        public string Tytul { get; set; } = string.Empty;
        public string? LinkDoOferty { get; set; }
        public string? Sklep { get; set; }
        public decimal? Cena { get; set; }
        public DateTime DataDodania { get; set; }
        public string Autor { get; set; } = string.Empty;
        public double WynikPodobienstwa { get; set; } // 0.0 - 1.0
        public string PowodDopasowania { get; set; } = string.Empty;
    }

    public class PodobnaOfertaDto
    {
        public int Id { get; set; }
        public string Tytul { get; set; } = string.Empty;
        public string? Sklep { get; set; }
        public decimal? Cena { get; set; }
        public DateTime DataDodania { get; set; }
        public int GlosyZa { get; set; }
        public int GlosyPrzeciw { get; set; }
        public double WynikPodobienstwa { get; set; }
    }
}
