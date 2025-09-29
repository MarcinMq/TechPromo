namespace TechPromo.Api.Search.Models
{
    // Operacje na indeksie Azure AI Search
    public enum OperacjaIndeksu
    {
        // Dodaj dokument
        Upload,

        // Dodaj lub zaktualizuj
        Merge,

        // Dodaj lub zamień
        MergeOrUpload,

        // Usuń dokument
        Delete
    }

    // Dokument do operacji
    public class DokumentIndeksu<T>
    {
        // Dokument do operacji
        public T Document { get; set; } = default!;

        // Typ operacji
        public OperacjaIndeksu Operation { get; set; } = OperacjaIndeksu.MergeOrUpload;
    }

    // Wynik operacji na indeksie
    public class WynikIndeksu
    {
        // Czy operacja się powiodła
        public bool Success { get; set; }

        // Liczba pomyślnie przetworzonych
        public int SuccessCount { get; set; }

        // Liczba dokumentów z błędami
        public int ErrorCount { get; set; }

        // Lista błędów
        public List<string> Errors { get; set; } = new();

        // Czas wykonania w ms
        public double ExecutionTimeMs { get; set; }
    }
}