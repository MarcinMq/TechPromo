using FluentAssertions;
using Xunit;

namespace TechPromo.Testy.Unit
{
    /// <summary>
    /// Unit tests for text similarity algorithms.
    /// Tests Levenshtein and Jaccard algorithms used for duplicate detection.
    /// </summary>
    public class TestSimilarityAlgorithms
    {
        /// <summary>
        /// Oblicza odleglosc Levenshteina miedzy dwoma ciagami znakow.
        /// </summary>
        private int ObliczOdlegloscLevenshtein(string zrodlo, string cel)
        {
            if (string.IsNullOrEmpty(zrodlo))
                return cel?.Length ?? 0;

            if (string.IsNullOrEmpty(cel))
                return zrodlo.Length;

            var dlugoscZrodla = zrodlo.Length;
            var dlugoscCelu = cel.Length;
            var odleglosc = new int[dlugoscZrodla + 1, dlugoscCelu + 1];

            for (var i = 0; i <= dlugoscZrodla; i++)
                odleglosc[i, 0] = i;

            for (var j = 0; j <= dlugoscCelu; j++)
                odleglosc[0, j] = j;

            for (var i = 1; i <= dlugoscZrodla; i++)
            {
                for (var j = 1; j <= dlugoscCelu; j++)
                {
                    var koszt = cel[j - 1] == zrodlo[i - 1] ? 0 : 1;

                    odleglosc[i, j] = Math.Min(
                        Math.Min(odleglosc[i - 1, j] + 1, odleglosc[i, j - 1] + 1),
                        odleglosc[i - 1, j - 1] + koszt
                    );
                }
            }

            return odleglosc[dlugoscZrodla, dlugoscCelu];
        }

        /// <summary>
        /// Oblicza podobienstwo Jaccard miedzy dwoma zbiorami slow.
        /// </summary>
        private double ObliczPodobienstwoJaccard(string tekst1, string tekst2)
        {
            var slowa1 = tekst1.ToLower().Split(' ').ToHashSet();
            var slowa2 = tekst2.ToLower().Split(' ').ToHashSet();

            var czescWspolna = slowa1.Intersect(slowa2).Count();
            var suma = slowa1.Union(slowa2).Count();

            return suma > 0 ? (double)czescWspolna / suma : 0.0;
        }

        // Testy Levenshtein

        [Fact]
        public void Levenshtein_IdentyczneNapisy_ZwracaZero()
        {
            // Arrange
            var tekst = "iPhone 15 Pro Max";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst, tekst);

            // Assert
            odleglosc.Should().Be(0);
        }

        [Fact]
        public void Levenshtein_JednaLiteraRoznicy_ZwracaJeden()
        {
            // Arrange
            var tekst1 = "kot";
            var tekst2 = "kos";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst1, tekst2);

            // Assert
            odleglosc.Should().Be(1);
        }

        [Fact]
        public void Levenshtein_DodanaLitera_ZwracaJeden()
        {
            // Arrange
            var tekst1 = "iPhone";
            var tekst2 = "iPhones";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst1, tekst2);

            // Assert
            odleglosc.Should().Be(1);
        }

        [Fact]
        public void Levenshtein_UsunietaLitera_ZwracaJeden()
        {
            // Arrange
            var tekst1 = "Samsung";
            var tekst2 = "Samsun";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst1, tekst2);

            // Assert
            odleglosc.Should().Be(1);
        }

        [Fact]
        public void Levenshtein_ZupelnieRozneNapisy_ZwracaDuzaWartosc()
        {
            // Arrange
            var tekst1 = "iPhone";
            var tekst2 = "Lodowka";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst1, tekst2);

            // Assert
            odleglosc.Should().BeGreaterThan(4);
        }

        [Fact]
        public void Levenshtein_PustyNapis_ZwracaDlugoscDrugiego()
        {
            // Arrange
            var tekst1 = "";
            var tekst2 = "Test";

            // Act
            var odleglosc = ObliczOdlegloscLevenshtein(tekst1, tekst2);

            // Assert
            odleglosc.Should().Be(4);
        }

        [Fact]
        public void Levenshtein_ObaListyPuste_ZwracaZero()
        {
            // Arrange & Act
            var odleglosc = ObliczOdlegloscLevenshtein("", "");

            // Assert
            odleglosc.Should().Be(0);
        }

        // Testy Jaccard

        [Fact]
        public void Jaccard_IdentyczneZdania_ZwracaJeden()
        {
            // Arrange
            var tekst = "iPhone 15 Pro Max";

            // Act
            var podobienstwo = ObliczPodobienstwoJaccard(tekst, tekst);

            // Assert
            podobienstwo.Should().Be(1.0);
        }

        [Fact]
        public void Jaccard_CzesciowoWspolneSlowa_ZwracaWartosc()
        {
            // Arrange
            var tekst1 = "iPhone 15 Pro Max 256GB";
            var tekst2 = "iPhone 15 Pro 128GB";

            // Act
            var podobienstwo = ObliczPodobienstwoJaccard(tekst1, tekst2);

            // Assert
            podobienstwo.Should().BeGreaterThan(0.4);
            podobienstwo.Should().BeLessThan(1.0);
        }

        [Fact]
        public void Jaccard_BrakWspolnychSlow_ZwracaZero()
        {
            // Arrange
            var tekst1 = "iPhone Apple smartfon";
            var tekst2 = "Lodowka Samsung kuchnia";

            // Act
            var podobienstwo = ObliczPodobienstwoJaccard(tekst1, tekst2);

            // Assert
            podobienstwo.Should().Be(0.0);
        }

        [Fact]
        public void Jaccard_ZamienionaPozycjaSlow_ZwracaJeden()
        {
            // Arrange
            var tekst1 = "PlayStation 5 Slim Digital";
            var tekst2 = "Digital Slim 5 PlayStation";

            // Act
            var podobienstwo = ObliczPodobienstwoJaccard(tekst1, tekst2);

            // Assert
            podobienstwo.Should().Be(1.0);
        }

        [Fact]
        public void Jaccard_DodatkoweSlowa_ZwracaWysokaPodobienstwo()
        {
            // Arrange
            var tekst1 = "Samsung Galaxy S24 Ultra";
            var tekst2 = "Samsung Galaxy S24 Ultra 256GB Czarny";

            // Act
            var podobienstwo = ObliczPodobienstwoJaccard(tekst1, tekst2);

            // Assert
            podobienstwo.Should().BeGreaterThan(0.5);
        }

        // Testy kombinacji algorytmow

        [Fact]
        public void KombinacjaAlgorytmow_PodobneProdukty_WysokiWynik()
        {
            // Arrange
            var tekst1 = "PlayStation 5 Slim Digital Edition 1TB";
            var tekst2 = "PlayStation 5 Slim 1TB Digital";

            // Act
            var levenshtein = 1.0 - (double)ObliczOdlegloscLevenshtein(tekst1.ToLower(), tekst2.ToLower()) 
                / Math.Max(tekst1.Length, tekst2.Length);
            var jaccard = ObliczPodobienstwoJaccard(tekst1, tekst2);
            var kombinacja = (levenshtein * 0.4) + (jaccard * 0.6);

            // Assert
            kombinacja.Should().BeGreaterOrEqualTo(0.6);
        }

        [Fact]
        public void KombinacjaAlgorytmow_RozneProdukty_NiskiWynik()
        {
            // Arrange
            var tekst1 = "iPhone 15 Pro Max";
            var tekst2 = "Telewizor LG OLED 55";

            // Act
            var levenshtein = 1.0 - (double)ObliczOdlegloscLevenshtein(tekst1.ToLower(), tekst2.ToLower()) 
                / Math.Max(tekst1.Length, tekst2.Length);
            var jaccard = ObliczPodobienstwoJaccard(tekst1, tekst2);
            var kombinacja = (levenshtein * 0.4) + (jaccard * 0.6);

            // Assert
            kombinacja.Should().BeLessThan(0.3);
        }
    }
}
