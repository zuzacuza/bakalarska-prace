# SELECT: Zločin
## o hře
SELECT: Zločin je interaktivní vzdělávací hra navržená pro výuku základů jazyka SQL (především příkazu SELECT) v rámci detektivního prostředí. Hráč se ocitá v roli nováčka kriminální policie ve fiktivním městě Virtus, kde pod dohledem zkušeného inspektora Paxe řeší kriminální případy analýzou databázových archivů.
## spuštění 
server: node index.js, client npm run
## historické verze 
- **verze 0.0.1** - základní struktura, express a cors na serveru, react app na clientu, test jednoduchého fetche a zobrazení zprávy přes react
- **verze 0.1.0** - přidání databáze a sql.js, logika pro validaci SQL dotazů v backendu,
- **verze 0.2.0** - textové pole pro dotazy student, validace viditelná na frontendu, tabulka viditelná na frontendu, tlačítko pro zobrazení výsledků
- **verze 0.3.0** - přidány základní dialogy inspektora Paxe, úvodní text a hinty, nastaveny css styly a zprovoznena vizualizace schematu 
- **verze 0.3.1** - prohozena karta s validací a počtem řádků pro lepší orientaci
- **verze 0.3.2** - přidána historie dotazů
- **verze 0.4.0** - přidány další části úrovně 1
- **verze 0.4.1** - oprava databáze - smazán sloupec pohlaví
- **verze 0.5.0** - přidána koncová obrazovka, obrázky paxe a upraveny styly
- **vezre 0.5.1** - přidán typewriter
- **verze 0.6.0** - přepsán herní text, přídáno automatické zobrazení výpisu dat při odeslání query
- **verze 0.7.0** - dodány všechny bezpečnostní prvky a url pro uživatelské testování
