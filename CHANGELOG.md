# Projekt WAP – Dokumentace a Log změn
**Vypracovala:** Kateřina Maršálová

## 📝 Co jsem upravila a přidala (Log změn)
* **Bezpečnost:** Už neberu data z formuláře a neposílám je rovnou do databáze. Místo toho v kódu kontroluji, jestli vstup přesně sedí na moje definované smajlíky. Pokud by mi tam chtěl někdo podstrčit škodlivý kód (SQL Injection), aplikace ho vůbec nepustí.
* **Vzhled a UI/UX:** Sjednotila jsem design podle pravidla 60-30-10. Všude jsem dala stejné fonty, mezery i zaoblení rohů, ať to nevypadá každé jinak. Pomocí flexboxu a gridu jsem udělala responzivitu, takže se to dobře zobrazí na tabletu, mobilu i velké obrazovce učitele.
* **Sekce jen pro učitele:** K celkovým statistikám (`/stats`) jsem přidala novou stránku čistě pro vyučujícího (`/wap`). Jsou tam přehlednější grafy a automatické slovní hodnocení hodin.
* **GDPR a úklid databáze:** Z databáze jsem smazala zbytečný sloupec `emoji`, který jsem reálně nepotřebovala, abych dodržela minimalizaci dat. Úplně dolů na stránku jsem pak přidala patičku s informací o GDPR.
* **Práce s chybami a výpadky (Role: Káťa, Martin, Kapr, Karel):** Přidala jsem funkci `ErrorBoundary`. To znamená, že když mi náhodou spadne připojení k databázi, neukáže se uživateli jen rozbitá bílá obrazovka, ale naskočí hezká chybová hláška s informací o problému a tlačítkem na restart.

---

## 🧠 Proč jsem to udělala zrovna takhle (Moje rozhodnutí a vrstva záměru)

Během vývoje jsem musela udělat pár architektonických rozhodnutí, tady je vysvětlení proč:

**1. Zamezení spamu přes `localStorage` a ne přes databázi:**
Potřebovala jsem, aby mi lidi neklikali na smajlíky stokrát za sebou. Zároveň jsem ale chtěla striktně dodržet GDPR a zachovat 100% anonymitu. Proto neukládám IP adresy, jména ani žádné soubory cookies. Zámek proti spamu ukládám jen lokálně přímo do prohlížeče (kiosku) přes `localStorage` a po skončení hodiny se automaticky sám odemkne. 

**2. Výpočty průměrů a mediánu v JavaScriptu:**
Záměrně nepočítám složitější metriky (jako je medián nebo modus) přímo přes SQL dotazy v databázi. Zbytečně by to zatěžovalo server, navíc čisté SQL na medián nemá úplně jednoduchou funkci. Místo toho si data vytáhnu a všechno spočítám až na straně klienta v JavaScriptu. Pro tyhle objemy školních dat je to mnohem rychlejší.

**3. Spojení hodin u předmětu WAP:**
Když jsem navrhovala grafy pro učitele, zjistila jsem, že ukazovat zvlášť výsledky pro 5. a 6. vyučovací hodinu nedává v praxi smysl. Studenti WAPu hodnotí stejně až úplně na konci dvouhodinovky, když odcházejí z učebny. Takže jsem to v kódu pomocí funkce spojila a graf teď ukazuje reálná data za celý dvouhodinový blok výuky.