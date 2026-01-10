// DTO oferty do API (bez encji EF, tylko dane dla klienta).
namespace TechPromo.Api.DTO
{
    public class OfertaDto
    {
        public int Id { get; set; }
        public string Tytul { get; set; } = string.Empty;
        public string Opis { get; set; } = string.Empty;
        public string Typ { get; set; } = "okazja"; // okazja lub kupon
        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }
        public string? Kod { get; set; } // Kod promocyjny dla kuponów
        public string Sklep { get; set; } = string.Empty;
        public string Kategoria { get; set; } = string.Empty;
        public List<string> Tagi { get; set; } = new List<string>();
        public string Autor { get; set; } = string.Empty;
    public string? AutorAvatarUrl { get; set; }
        public string DataUtworzenia { get; set; } = string.Empty;
        public DateTime? WaznoscOd { get; set; }
        public DateTime? WaznoscDo { get; set; }
        public VotesDto Votes { get; set; } = new VotesDto();
        public int Komentarze { get; set; }
        public string? UserVote { get; set; } // hot, cold lub null
        public List<string> Zdjecia { get; set; } = new List<string>();
        public bool ZatwierdzeniePrzezAI { get; set; } // Oznacza że oferta przeszła automatyczną moderację AI
    }

    public class VotesDto
    {
        public int Hot { get; set; }
        public int Cold { get; set; }
    }
}
