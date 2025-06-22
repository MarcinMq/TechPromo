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
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "kategorie",
                columns: table => new
                {
                    id_kategoria = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    opis = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kategorie", x => x.id_kategoria);
                });

            migrationBuilder.CreateTable(
                name: "odznaki",
                columns: table => new
                {
                    id_odznaka = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    opis = table.Column<string>(type: "text", nullable: false),
                    ikona = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_odznaki", x => x.id_odznaka);
                });

            migrationBuilder.CreateTable(
                name: "uzytkownicy",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    nazwa_uzytkownika = table.Column<string>(type: "text", nullable: false),
                    data_rejestracji = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    rola = table.Column<string>(type: "text", nullable: false),
                    punkty = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_uzytkownicy", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
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
                name: "aktywnosci",
                columns: table => new
                {
                    id_aktywnosc = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    typ_aktywnosci = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    id_elementu = table.Column<int>(type: "integer", nullable: true),
                    data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aktywnosci", x => x.id_aktywnosc);
                    table.ForeignKey(
                        name: "FK_aktywnosci_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_uzytkownicy_UserId",
                        column: x => x.UserId,
                        principalTable: "uzytkownicy",
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
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_uzytkownicy_UserId",
                        column: x => x.UserId,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
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
                        name: "FK_AspNetUserRoles_uzytkownicy_UserId",
                        column: x => x.UserId,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_uzytkownicy_UserId",
                        column: x => x.UserId,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "oferty",
                columns: table => new
                {
                    id_oferta = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nazwa = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    cena = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    id_kategoria = table.Column<int>(type: "integer", nullable: false),
                    opis = table.Column<string>(type: "text", nullable: false),
                    link = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    zdjecie = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    data_dodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    liczba_hot = table.Column<int>(type: "integer", nullable: false),
                    liczba_cold = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    tagi = table.Column<string>(type: "text", nullable: false),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_oferty", x => x.id_oferta);
                    table.ForeignKey(
                        name: "FK_oferty_kategorie_id_kategoria",
                        column: x => x.id_kategoria,
                        principalTable: "kategorie",
                        principalColumn: "id_kategoria",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_oferty_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "uzytkownik_odznaki",
                columns: table => new
                {
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    id_odznaka = table.Column<int>(type: "integer", nullable: false),
                    data_przyznania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_uzytkownik_odznaki", x => new { x.id_uzytkownik, x.id_odznaka });
                    table.ForeignKey(
                        name: "FK_uzytkownik_odznaki_odznaki_id_odznaka",
                        column: x => x.id_odznaka,
                        principalTable: "odznaki",
                        principalColumn: "id_odznaka",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_uzytkownik_odznaki_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "glosy",
                columns: table => new
                {
                    id_glos = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    id_oferta = table.Column<int>(type: "integer", nullable: false),
                    typ_glosu = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    data_glosu = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_glosy", x => x.id_glos);
                    table.ForeignKey(
                        name: "FK_glosy_oferty_id_oferta",
                        column: x => x.id_oferta,
                        principalTable: "oferty",
                        principalColumn: "id_oferta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_glosy_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "komentarze",
                columns: table => new
                {
                    id_komentarz = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    id_oferta = table.Column<int>(type: "integer", nullable: false),
                    tresc = table.Column<string>(type: "text", nullable: false),
                    data_dodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_komentarze", x => x.id_komentarz);
                    table.ForeignKey(
                        name: "FK_komentarze_oferty_id_oferta",
                        column: x => x.id_oferta,
                        principalTable: "oferty",
                        principalColumn: "id_oferta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_komentarze_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "zgloszenia",
                columns: table => new
                {
                    id_zgloszenie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    typ_elementu = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    id_elementu = table.Column<int>(type: "integer", nullable: false),
                    opis = table.Column<string>(type: "text", nullable: false),
                    data_zgloszenia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Ofertaid_oferta = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zgloszenia", x => x.id_zgloszenie);
                    table.ForeignKey(
                        name: "FK_zgloszenia_oferty_Ofertaid_oferta",
                        column: x => x.Ofertaid_oferta,
                        principalTable: "oferty",
                        principalColumn: "id_oferta");
                    table.ForeignKey(
                        name: "FK_zgloszenia_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "powiadomienia",
                columns: table => new
                {
                    id_powiadomienie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_uzytkownik = table.Column<string>(type: "text", nullable: false),
                    typ = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    tresc = table.Column<string>(type: "text", nullable: false),
                    data_utworzenia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    id_oferta = table.Column<int>(type: "integer", nullable: true),
                    id_komentarz = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_powiadomienia", x => x.id_powiadomienie);
                    table.ForeignKey(
                        name: "FK_powiadomienia_komentarze_id_komentarz",
                        column: x => x.id_komentarz,
                        principalTable: "komentarze",
                        principalColumn: "id_komentarz",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_powiadomienia_oferty_id_oferta",
                        column: x => x.id_oferta,
                        principalTable: "oferty",
                        principalColumn: "id_oferta",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_powiadomienia_uzytkownicy_id_uzytkownik",
                        column: x => x.id_uzytkownik,
                        principalTable: "uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_aktywnosci_id_uzytkownik",
                table: "aktywnosci",
                column: "id_uzytkownik");

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
                name: "IX_glosy_id_oferta",
                table: "glosy",
                column: "id_oferta");

            migrationBuilder.CreateIndex(
                name: "IX_glosy_id_uzytkownik_id_oferta",
                table: "glosy",
                columns: new[] { "id_uzytkownik", "id_oferta" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_komentarze_id_oferta",
                table: "komentarze",
                column: "id_oferta");

            migrationBuilder.CreateIndex(
                name: "IX_komentarze_id_uzytkownik",
                table: "komentarze",
                column: "id_uzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_oferty_id_kategoria",
                table: "oferty",
                column: "id_kategoria");

            migrationBuilder.CreateIndex(
                name: "IX_oferty_id_uzytkownik",
                table: "oferty",
                column: "id_uzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_powiadomienia_id_komentarz",
                table: "powiadomienia",
                column: "id_komentarz");

            migrationBuilder.CreateIndex(
                name: "IX_powiadomienia_id_oferta",
                table: "powiadomienia",
                column: "id_oferta");

            migrationBuilder.CreateIndex(
                name: "IX_powiadomienia_id_uzytkownik",
                table: "powiadomienia",
                column: "id_uzytkownik");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "uzytkownicy",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "uzytkownicy",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uzytkownik_odznaki_id_odznaka",
                table: "uzytkownik_odznaki",
                column: "id_odznaka");

            migrationBuilder.CreateIndex(
                name: "IX_zgloszenia_id_uzytkownik",
                table: "zgloszenia",
                column: "id_uzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_zgloszenia_Ofertaid_oferta",
                table: "zgloszenia",
                column: "Ofertaid_oferta");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aktywnosci");

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
                name: "glosy");

            migrationBuilder.DropTable(
                name: "powiadomienia");

            migrationBuilder.DropTable(
                name: "uzytkownik_odznaki");

            migrationBuilder.DropTable(
                name: "zgloszenia");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "komentarze");

            migrationBuilder.DropTable(
                name: "odznaki");

            migrationBuilder.DropTable(
                name: "oferty");

            migrationBuilder.DropTable(
                name: "kategorie");

            migrationBuilder.DropTable(
                name: "uzytkownicy");
        }
    }
}
