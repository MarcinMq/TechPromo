using System.Collections.Generic;

namespace TechPromo.Api.DTO
{
    public class PublicznyProfilDto
    {
        public int IdUzytkownik { get; set; }
        public string Nick { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int Punkty { get; set; }
        public string DataRejestracji { get; set; } = string.Empty;
        public List<OdznakaDto> Odznaki { get; set; } = new List<OdznakaDto>();
        public List<AktywnoscDto> OstatnieKomentarze { get; set; } = new List<AktywnoscDto>();
        public List<OfertaDto> DodaneOferty { get; set; } = new List<OfertaDto>();
        public int LiczbaKomentarzy { get; set; }
        public int LiczbaDodanychOfert { get; set; }
        public int LiczbaGlosow { get; set; }
    }
}
