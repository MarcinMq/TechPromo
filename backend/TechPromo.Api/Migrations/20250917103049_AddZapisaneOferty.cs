using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddZapisaneOferty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ZapisaneOferty",
                columns: table => new
                {
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false),
                    DataZapisania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZapisaneOferty", x => new { x.IdUzytkownik, x.IdOferta });
                    table.ForeignKey(
                        name: "FK_ZapisaneOferty_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ZapisaneOferty_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ZapisaneOferty_DataZapisania",
                table: "ZapisaneOferty",
                column: "DataZapisania");

            migrationBuilder.CreateIndex(
                name: "IX_ZapisaneOferty_IdOferta",
                table: "ZapisaneOferty",
                column: "IdOferta");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ZapisaneOferty");
        }
    }
}
