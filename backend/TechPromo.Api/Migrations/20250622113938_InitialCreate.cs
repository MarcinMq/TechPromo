using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TechPromo.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NazwaUzytkownika = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Haslo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DataRejestracji = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Rola = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Punkty = table.Column<int>(type: "integer", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kategorie",
                columns: table => new
                {
                    IdKategoria = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Opis = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kategorie", x => x.IdKategoria);
                });

            migrationBuilder.CreateTable(
                name: "Odznaki",
                columns: table => new
                {
                    IdOdznaka = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Opis = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Ikona = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Odznaki", x => x.IdOdznaka);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<int>(type: "integer", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Aktywnosci",
                columns: table => new
                {
                    IdAktywnosc = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    TypAktywnosci = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IdElementu = table.Column<int>(type: "integer", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aktywnosci", x => x.IdAktywnosc);
                    table.ForeignKey(
                        name: "FK_Aktywnosci_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Zgloszenia",
                columns: table => new
                {
                    IdZgloszenie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    TypElementu = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IdElementu = table.Column<int>(type: "integer", nullable: false),
                    Opis = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DataZgloszenia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zgloszenia", x => x.IdZgloszenie);
                    table.ForeignKey(
                        name: "FK_Zgloszenia_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Oferty",
                columns: table => new
                {
                    IdOferta = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Cena = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IdKategoria = table.Column<int>(type: "integer", nullable: false),
                    KategoriaIdKategoria = table.Column<int>(type: "integer", nullable: true),
                    Opis = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Link = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Zdjecie = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DataDodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LiczbaHot = table.Column<int>(type: "integer", nullable: false),
                    LiczbaCold = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Tagi = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oferty", x => x.IdOferta);
                    table.ForeignKey(
                        name: "FK_Oferty_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Oferty_Kategorie_KategoriaIdKategoria",
                        column: x => x.KategoriaIdKategoria,
                        principalTable: "Kategorie",
                        principalColumn: "IdKategoria");
                });

            migrationBuilder.CreateTable(
                name: "UzytkownikOdznaki",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    IdOdznaka = table.Column<int>(type: "integer", nullable: false),
                    OdznakaIdOdznaka = table.Column<int>(type: "integer", nullable: true),
                    DataPrzyznania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UzytkownikOdznaki", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UzytkownikOdznaki_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UzytkownikOdznaki_Odznaki_OdznakaIdOdznaka",
                        column: x => x.OdznakaIdOdznaka,
                        principalTable: "Odznaki",
                        principalColumn: "IdOdznaka");
                });

            migrationBuilder.CreateTable(
                name: "Glosy",
                columns: table => new
                {
                    IdGlos = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    OfertaIdOferta = table.Column<int>(type: "integer", nullable: true),
                    TypGlosu = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DataGlosu = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Glosy", x => x.IdGlos);
                    table.ForeignKey(
                        name: "FK_Glosy_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Glosy_Oferty_OfertaIdOferta",
                        column: x => x.OfertaIdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta");
                });

            migrationBuilder.CreateTable(
                name: "Komentarze",
                columns: table => new
                {
                    IdKomentarz = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    OfertaIdOferta = table.Column<int>(type: "integer", nullable: true),
                    Tresc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DataDodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Komentarze", x => x.IdKomentarz);
                    table.ForeignKey(
                        name: "FK_Komentarze_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Komentarze_Oferty_OfertaIdOferta",
                        column: x => x.OfertaIdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta");
                });

            migrationBuilder.CreateTable(
                name: "Powiadomienia",
                columns: table => new
                {
                    IdPowiadomienie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    UzytkownikId = table.Column<int>(type: "integer", nullable: true),
                    Typ = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tresc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DataUtworzenia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IdOferta = table.Column<int>(type: "integer", nullable: true),
                    OfertaIdOferta = table.Column<int>(type: "integer", nullable: true),
                    IdKomentarz = table.Column<int>(type: "integer", nullable: true),
                    KomentarzIdKomentarz = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Powiadomienia", x => x.IdPowiadomienie);
                    table.ForeignKey(
                        name: "FK_Powiadomienia_AspNetUsers_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Powiadomienia_Komentarze_KomentarzIdKomentarz",
                        column: x => x.KomentarzIdKomentarz,
                        principalTable: "Komentarze",
                        principalColumn: "IdKomentarz");
                    table.ForeignKey(
                        name: "FK_Powiadomienia_Oferty_OfertaIdOferta",
                        column: x => x.OfertaIdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Aktywnosci_UzytkownikId",
                table: "Aktywnosci",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Glosy_OfertaIdOferta",
                table: "Glosy",
                column: "OfertaIdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Glosy_UzytkownikId",
                table: "Glosy",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_Komentarze_OfertaIdOferta",
                table: "Komentarze",
                column: "OfertaIdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Komentarze_UzytkownikId",
                table: "Komentarze",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_Oferty_KategoriaIdKategoria",
                table: "Oferty",
                column: "KategoriaIdKategoria");

            migrationBuilder.CreateIndex(
                name: "IX_Oferty_UzytkownikId",
                table: "Oferty",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_KomentarzIdKomentarz",
                table: "Powiadomienia",
                column: "KomentarzIdKomentarz");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_OfertaIdOferta",
                table: "Powiadomienia",
                column: "OfertaIdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_UzytkownikId",
                table: "Powiadomienia",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_UzytkownikOdznaki_OdznakaIdOdznaka",
                table: "UzytkownikOdznaki",
                column: "OdznakaIdOdznaka");

            migrationBuilder.CreateIndex(
                name: "IX_UzytkownikOdznaki_UzytkownikId",
                table: "UzytkownikOdznaki",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_Zgloszenia_UzytkownikId",
                table: "Zgloszenia",
                column: "UzytkownikId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Aktywnosci");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Glosy");

            migrationBuilder.DropTable(
                name: "Powiadomienia");

            migrationBuilder.DropTable(
                name: "UzytkownikOdznaki");

            migrationBuilder.DropTable(
                name: "Zgloszenia");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Komentarze");

            migrationBuilder.DropTable(
                name: "Odznaki");

            migrationBuilder.DropTable(
                name: "Oferty");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Kategorie");
        }
    }
}
