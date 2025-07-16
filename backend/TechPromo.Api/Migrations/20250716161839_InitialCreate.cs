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
                    DataRejestracji = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    Nazwa = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Opis = table.Column<string>(type: "text", nullable: false)
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
                    Nazwa = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Opis = table.Column<string>(type: "text", nullable: false),
                    Ikona = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Odznaki", x => x.IdOdznaka);
                });

            migrationBuilder.CreateTable(
                name: "Tagi",
                columns: table => new
                {
                    IdTag = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nazwa = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tagi", x => x.IdTag);
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
                    TypAktywnosci = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IdElementu = table.Column<int>(type: "integer", nullable: true),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aktywnosci", x => x.IdAktywnosc);
                    table.ForeignKey(
                        name: "FK_Aktywnosci_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "Oferty",
                columns: table => new
                {
                    IdOferta = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nazwa = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Cena = table.Column<decimal>(type: "numeric", nullable: true),
                    Opis = table.Column<string>(type: "text", nullable: false),
                    Link = table.Column<string>(type: "text", nullable: false),
                    DataDodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LiczbaHot = table.Column<int>(type: "integer", nullable: false),
                    LiczbaCold = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Aktywna = table.Column<bool>(type: "boolean", nullable: false),
                    Zatwierdzona = table.Column<bool>(type: "boolean", nullable: false),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    IdKategoria = table.Column<int>(type: "integer", nullable: true),
                    Embedding = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oferty", x => x.IdOferta);
                    table.ForeignKey(
                        name: "FK_Oferty_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Oferty_Kategorie_IdKategoria",
                        column: x => x.IdKategoria,
                        principalTable: "Kategorie",
                        principalColumn: "IdKategoria");
                });

            migrationBuilder.CreateTable(
                name: "UzytkownikOdznaki",
                columns: table => new
                {
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    IdOdznaka = table.Column<int>(type: "integer", nullable: false),
                    DataPrzyznania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UzytkownikOdznaki", x => new { x.IdUzytkownik, x.IdOdznaka });
                    table.ForeignKey(
                        name: "FK_UzytkownikOdznaki_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UzytkownikOdznaki_Odznaki_IdOdznaka",
                        column: x => x.IdOdznaka,
                        principalTable: "Odznaki",
                        principalColumn: "IdOdznaka",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Glosy",
                columns: table => new
                {
                    IdGlos = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    TypGlosu = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DataGlosu = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Glosy", x => x.IdGlos);
                    table.ForeignKey(
                        name: "FK_Glosy_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Glosy_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Komentarze",
                columns: table => new
                {
                    IdKomentarz = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    Tresc = table.Column<string>(type: "text", nullable: false),
                    DataDodania = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Komentarze", x => x.IdKomentarz);
                    table.ForeignKey(
                        name: "FK_Komentarze_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Komentarze_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OfertaTagi",
                columns: table => new
                {
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    IdTag = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfertaTagi", x => new { x.IdOferta, x.IdTag });
                    table.ForeignKey(
                        name: "FK_OfertaTagi_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfertaTagi_Tagi_IdTag",
                        column: x => x.IdTag,
                        principalTable: "Tagi",
                        principalColumn: "IdTag",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OfertyZdjecia",
                columns: table => new
                {
                    IdOfertaZdjecie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdOferta = table.Column<int>(type: "integer", nullable: false),
                    UrlZdjecia = table.Column<string>(type: "text", nullable: false),
                    Kolejnosc = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfertyZdjecia", x => x.IdOfertaZdjecie);
                    table.ForeignKey(
                        name: "FK_OfertyZdjecia_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Powiadomienia",
                columns: table => new
                {
                    IdPowiadomienie = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdUzytkownik = table.Column<int>(type: "integer", nullable: false),
                    Typ = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Tresc = table.Column<string>(type: "text", nullable: false),
                    DataUtworzenia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Przeczytane = table.Column<bool>(type: "boolean", nullable: false),
                    IdOferta = table.Column<int>(type: "integer", nullable: true),
                    IdKomentarz = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Powiadomienia", x => x.IdPowiadomienie);
                    table.ForeignKey(
                        name: "FK_Powiadomienia_AspNetUsers_IdUzytkownik",
                        column: x => x.IdUzytkownik,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Powiadomienia_Komentarze_IdKomentarz",
                        column: x => x.IdKomentarz,
                        principalTable: "Komentarze",
                        principalColumn: "IdKomentarz");
                    table.ForeignKey(
                        name: "FK_Powiadomienia_Oferty_IdOferta",
                        column: x => x.IdOferta,
                        principalTable: "Oferty",
                        principalColumn: "IdOferta");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Aktywnosci_IdUzytkownik",
                table: "Aktywnosci",
                column: "IdUzytkownik");

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
                name: "IX_Glosy_IdOferta",
                table: "Glosy",
                column: "IdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Glosy_IdUzytkownik",
                table: "Glosy",
                column: "IdUzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_Komentarze_IdOferta",
                table: "Komentarze",
                column: "IdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Komentarze_IdUzytkownik",
                table: "Komentarze",
                column: "IdUzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_OfertaTagi_IdTag",
                table: "OfertaTagi",
                column: "IdTag");

            migrationBuilder.CreateIndex(
                name: "IX_Oferty_IdKategoria",
                table: "Oferty",
                column: "IdKategoria");

            migrationBuilder.CreateIndex(
                name: "IX_Oferty_IdUzytkownik",
                table: "Oferty",
                column: "IdUzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_OfertyZdjecia_IdOferta",
                table: "OfertyZdjecia",
                column: "IdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_IdKomentarz",
                table: "Powiadomienia",
                column: "IdKomentarz");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_IdOferta",
                table: "Powiadomienia",
                column: "IdOferta");

            migrationBuilder.CreateIndex(
                name: "IX_Powiadomienia_IdUzytkownik",
                table: "Powiadomienia",
                column: "IdUzytkownik");

            migrationBuilder.CreateIndex(
                name: "IX_UzytkownikOdznaki_IdOdznaka",
                table: "UzytkownikOdznaki",
                column: "IdOdznaka");
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
                name: "OfertaTagi");

            migrationBuilder.DropTable(
                name: "OfertyZdjecia");

            migrationBuilder.DropTable(
                name: "Powiadomienia");

            migrationBuilder.DropTable(
                name: "UzytkownikOdznaki");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Tagi");

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
