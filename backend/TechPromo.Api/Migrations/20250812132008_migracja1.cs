using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class migracja1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "Komentarze",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Komentarze_ParentId",
                table: "Komentarze",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Komentarze_Komentarze_ParentId",
                table: "Komentarze",
                column: "ParentId",
                principalTable: "Komentarze",
                principalColumn: "IdKomentarz");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Komentarze_Komentarze_ParentId",
                table: "Komentarze");

            migrationBuilder.DropIndex(
                name: "IX_Komentarze_ParentId",
                table: "Komentarze");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "Komentarze");
        }
    }
}
