namespace TechPromo.Api.DTO
{
    public class OfertaDto
    {
        public int Id { get; set; }
        public string Tytul { get; set; }
        public string Opis { get; set; }
        public decimal? Cena { get; set; }
        public decimal? CenaPoprzednia { get; set; }
        public string Sklep { get; set; }
        public string Kategoria { get; set; }
        public List<string> Tagi { get; set; } = new List<string>();
        public string Autor { get; set; }
        public string DataUtworzenia { get; set; }
        public VotesDto Votes { get; set; } = new VotesDto();
        public int Komentarze { get; set; }
        public string? UserVote { get; set; } // hot, cold lub null
        public List<string> Zdjecia { get; set; } = new List<string>();
    }

    public class VotesDto
    {
        public int Hot { get; set; }
        public int Cold { get; set; }
    }
}
