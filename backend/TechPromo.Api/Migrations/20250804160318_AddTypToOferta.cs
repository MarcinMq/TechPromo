using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTypToOferta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Typ",
                table: "Oferty",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Typ",
                table: "Oferty");
        }
    }
}
