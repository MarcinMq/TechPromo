using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueVoteConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_KomentarzGlosy_IdUzytkownik",
                table: "KomentarzGlosy");

            migrationBuilder.DropIndex(
                name: "IX_Glosy_IdUzytkownik",
                table: "Glosy");

            migrationBuilder.CreateIndex(
                name: "IX_KomentarzGlosy_IdUzytkownik_IdKomentarz",
                table: "KomentarzGlosy",
                columns: new[] { "IdUzytkownik", "IdKomentarz" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Glosy_IdUzytkownik_IdOferta",
                table: "Glosy",
                columns: new[] { "IdUzytkownik", "IdOferta" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_KomentarzGlosy_IdUzytkownik_IdKomentarz",
                table: "KomentarzGlosy");

            migrationBuilder.DropIndex(
                name: "IX_Glosy_IdUzytkownik_IdOferta",
                table: "Glosy");

            migrationBuilder.CreateIndex(
                name: "IX_KomentarzGlosy_IdUzytkownik",
                table: "KomentarzGlosy",
                column: "IdUzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_Glosy_IdUzytkownik",
                table: "Glosy",
                column: "IdUzytkownik");
        }
    }
}
