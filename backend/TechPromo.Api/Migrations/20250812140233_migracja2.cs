using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class migracja2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LiczbaDown",
                table: "Komentarze",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LiczbaUp",
                table: "Komentarze",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "KomentarzGlosy",
                columns: table => new
                {
                    IdKomentarzGlos = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdKomentarz = table.Column<int>(type: "integer", nullable: false),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    TypGlosu = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DataGlosu = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KomentarzGlosy", x => x.IdKomentarzGlos);
                    table.ForeignKey(
                        name: "FK_KomentarzGlosy_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KomentarzGlosy_Komentarze_IdKomentarz",
                        column: x => x.IdKomentarz,
                        principalTable: "Komentarze",
                        principalColumn: "IdKomentarz",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KomentarzGlosy_IdKomentarz",
                table: "KomentarzGlosy",
                column: "IdKomentarz");

            migrationBuilder.CreateIndex(
                name: "IX_KomentarzGlosy_IdUzytkownik",
                table: "KomentarzGlosy",
                column: "IdUzytkownik");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KomentarzGlosy");

            migrationBuilder.DropColumn(
                name: "LiczbaDown",
                table: "Komentarze");

            migrationBuilder.DropColumn(
                name: "LiczbaUp",
                table: "Komentarze");
        }
    }
}
