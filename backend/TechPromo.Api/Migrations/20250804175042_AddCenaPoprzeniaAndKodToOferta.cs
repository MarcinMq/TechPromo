using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCenaPoprzeniaAndKodToOferta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CenaPoprzednia",
                table: "Oferty",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kod",
                table: "Oferty",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CenaPoprzednia",
                table: "Oferty");

            migrationBuilder.DropColumn(
                name: "Kod",
                table: "Oferty");
        }
    }
}
