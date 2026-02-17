# BuJo+GTD Todo App – Kompletní zadání

## Koncept
Webová todo aplikace kombinující principy **Bullet Journal** (denní migrace úkolů, signifiers, archiv dnů) a **Getting Things Done** (inbox, kontexty, zpracování). Priorita úkolů je určena pořadím v seznamu (drag & drop). Aplikace je navržena s ohledem na **ADHD uživatele** – minimální tření, prevence overwhelmu, dopaminové odměny.

---

## Tech Stack

### Frontend
- **Next.js 14+** (App Router) s TypeScript
- **Tailwind CSS** + dark mode (systémová preference + manuální přepínání)
- **dnd-kit** pro drag & drop řazení úkolů
- **Dexie.js** pro IndexedDB (offline lokální databáze)
- Responzivní design: sidebar na desktopu, spodní navigace na mobilu

### Backend
- **Next.js API Routes** (Route Handlers)
- **PostgreSQL** databáze
- **Prisma** ORM (zdroj pravdy pro datový model)
- **NextAuth.js** pro autentizaci

### Offline & PWA
- **Service Worker** (Workbox) pro cachování app shell + statických assets
- **IndexedDB** (Dexie.js) jako lokální mirror databáze
- **Background Sync API** pro automatickou synchronizaci

### Sdílené typy
- Prisma model je zdroj pravdy – `prisma generate` generuje TypeScript typy
- Sdílené typy v `/lib/types.ts` používané serverem i klientem
- Dexie.js schéma používá stejné typy – při změně Prisma schématu se musí aktualizovat i Dexie schéma

### Autentizace
- Email + heslo (credentials provider)
- Google OAuth
- GitHub OAuth

---

## Datový model

### User
- id, email, name, password (hashed), image
- preferences (JSON – nastavení ADHD funkcí, vzhledu atd.)
- vztahy: tasks, contexts, taskTemplates, dayLogs

### Task (úkol)
- id, title, description (volitelný popis/poznámka, Markdown)
- status: `inbox` | `today` | `scheduled` | `backlog` | `done` | `cancelled`
- scheduledDate (nullable – datum, na kdy je úkol naplánován)
- deadline (nullable – termín/deadline)
- estimatedMinutes (nullable integer – časový odhad v minutách, ADHD-friendly)
- sortOrder (integer – pořadí v inbox a backlog pohledu)
- isRecurring (boolean)
- recurringRule (nullable – RRULE string pro opakování, např. "FREQ=WEEKLY;BYDAY=MO")
- contextId (FK na Context – vždy povinný, výchozí = Inbox)
- userId (FK na User)
- completedAt, createdAt, updatedAt

**Task.status** je vždy **aktuální stav** úkolu (kde se úkol právě nachází). Historie toho, co se s úkolem dělo v konkrétní den, je uložena v DayLogEntry.

**Task.sortOrder** se používá pro řazení v inbox a backlog pohledu (drag & drop). V denním pohledu se ignoruje – tam platí DayLogEntry.sortOrder.

### Subtask (podúkol – jednoúrovňový checklist)
- id, title, description (nullable – volitelná poznámka/popis)
- isDone (boolean)
- sortOrder (integer – pořadí v checklistu)
- taskId (FK na Task)

**Podúkoly jsou jednoúrovňové** – žádné zanořování. Každý podúkol: název + checkbox + volitelná poznámka + pořadí.

### Context (kontext)
- id, name, icon (emoji), color, sortOrder
- isArchived (boolean, default false) – soft delete
- isSystem (boolean, default false) – systémový kontext (nelze smazat/archivovat)
- userId (FK na User)
- **Inbox** je systémový kontext (isSystem = true), vždy první v pořadí (sortOrder = 0), nelze smazat, přejmenovat ani archivovat. Vytváří se automaticky při registraci uživatele.
- Uživatelské kontexty příklady: @počítač, @telefon, @venku, @práce, @doma

**Soft delete:** Při smazání kontextu se nastaví `isArchived = true`. Kontext zmizí z nabídky pro přiřazení, ale existující úkoly a historické záznamy (DayLogEntry) si ho podrží. Archivované kontexty se nezobrazují v navigaci ani ve filtrech. Systémový kontext Inbox nelze archivovat.

### TaskTemplate (šablona seznamu úkolů)
- id, name, icon (emoji), color, sortOrder
- userId (FK na User)
- Příklady: "Balení na cestu", "Daňové přiznání", "Příprava na schůzku"

### TaskTemplateItem (položka šablony)
- id, title, description (nullable)
- contextId (FK na Context – přednastavený kontext pro položku)
- sortOrder (integer)
- templateId (FK na TaskTemplate)

**Šablony jsou opakovaně použitelné.** Při aktivaci šablony se z každé položky vytvoří samostatný Task s `status = today`, `scheduledDate = dnes`, kontextem z položky šablony. Vytvořené tasky pak žijí vlastním životem. Šablona zůstává nezměněna pro budoucí použití.

### DayLog (denní záznam – BuJo deník)
- id, date (unique per user), userId (FK na User)
- closedAt (nullable – kdy byl den ukončen)
- createdAt

### DayLogEntry (snapshot úkolu v daném dni)
- id, dayLogId (FK na DayLog), taskId (nullable – FK na Task, pro proklik do detailu)
- taskTitle (string – **kopie názvu úkolu v době záznamu**)
- signifier: `dot` (• otevřený úkol) | `done` (✕ dokončen) | `migrated_forward` (→ přesun na další den) | `migrated_backlog` (← přesun do backlogu) | `cancelled` (— zrušen)
- sortOrder (integer – pořadí v rámci dne a kontextové skupiny)
- contextId (nullable – FK na Context, kontext v době záznamu)
- contextName (nullable – kopie názvu kontextu pro historickou přesnost)
- createdAt, updatedAt (updatedAt se nesmí měnit po uzavření dne – viz pravidla níže)

**DayLogEntry editovatelnost:**
- **Dokud den NENÍ uzavřený** (DayLog.closedAt = null): DayLogEntry je editovatelný – kontext, sortOrder, taskTitle se mohou měnit (např. při přetažení úkolu mezi kontexty v průběhu dne).
- **Po uzavření dne** (DayLog.closedAt != null): DayLogEntry se stává **imutabilním snapshotem**. Žádné změny.

**DayLogEntry je append-only při synchronizaci** – nikdy se nemaže. Při offline konfliktu se záznamy z obou zařízení zachovají.

**DayLogEntry.sortOrder** je per den a per kontext – každý kontext v rámci dne má vlastní nezávislé řazení úkolů.

---

## Navigace & Pohledy

### Sidebar (desktop) / Spodní navigace (mobil)
Hlavní položky:
1. **Dnes** – denní pohled (hlavní pracovní plocha) ← **výchozí stránka po přihlášení**
2. **Nadcházející** – týdenní/měsíční přehled
3. **Backlog** – úkoly bez data
4. **Archiv dnů** – BuJo deník minulých dnů
5. **Kontexty** – rozbalitelný seznam (Inbox vždy první s badge počtem, pak uživatelské kontexty dle sortOrder)
6. **Šablony** – seznam šablon (rozbalitelné)

Inbox je první kontext v seznamu kontextů, vizuálně odlišený (badge s počtem nezpracovaných úkolů).

Na mobilu spodní nav zobrazí: Dnes, Nadcházející, Kontexty, Menu (hamburger se zbytkem).

**Výchozí stránka po přihlášení:** Vždy "Dnes". Pokud existují neuzavřené předchozí dny s nesplněnými úkoly, NEJDŘÍVE se zobrazí povinný review dialog (viz sekce "Otevření nového dne").

---

## Hlavní funkce

### 1. Inbox (systémový kontext)
- Inbox je **systémový kontext**, vždy první v seznamu kontextů
- Každý nový úkol (quick add s kontextem Inbox) se přidá s kontextem = Inbox, status = inbox
- **Zpracování úkolu – Tinder-styl flow:** V inbox pohledu se úkoly zpracovávají jeden po druhém. Zobrazí se jeden úkol s kompaktním dialogem (výběr kontextu + destinace: dnes/datum/backlog). Na mobilu swipe gesta pro rychlé rozhodnutí. Na desktopu klávesové zkratky: `→` nebo `D` = Dnes, `←` nebo `B` = Backlog, `↓` nebo `S` = Přeskočit, `Enter` = Otevřít kompaktní dialog (výběr kontextu + data). Po zpracování se automaticky zobrazí další úkol.
- Klávesová zkratka `Q` nebo `N` otevře quick-add dialog odkudkoli v appce
- Quick-add dialog: název úkolu + volitelně deadline + kontext (výchozí = Inbox) + volitelně odhad času (rychlá tlačítka: 5/15/30/60 min)
  - Pokud kontext zůstane Inbox → status = inbox
  - **Pokud uživatel změní kontext na jiný → status = today, scheduledDate = dnes**, úkol přeskočí inbox a vytvoří se DayLogEntry se signifierem `dot` (•)
- Pohled na Inbox zobrazuje všechny úkoly s kontextem Inbox
- Inbox se zobrazuje i v denním pohledu jako první kontextová skupina (pokud obsahuje úkoly naplánované na dnes)

### 2. Denní pohled ("Dnes")
- Zobrazuje úkoly naplánované na dnešek **seskupené podle kontextů**
- Kontexty se zobrazují v **pevném pořadí** (dle sortOrder kontextu, nastavitelné drag & drop ve správě kontextů)
- V rámci každého kontextu: drag & drop řazení úkolů = priorita (nahoře = nejdůležitější)
- **Drag & drop mezi kontexty mění kontext úkolu** – vizuálně jasné drop zóny mezi skupinami
- **Žádná sekce "Bez kontextu"** – každý úkol musí mít kontext. Úkoly bez kontextu existují pouze v inboxu.
- Kontextové skupiny jsou vizuálně oddělené barvou kontextu
- Prázdné kontextové skupiny se nezobrazují (jen kontexty s úkoly na dnešek)
- **Inline přidání úkolu:** Na konci každé kontextové skupiny tlačítko/řádek "+ Přidat úkol" – kliknutí rozbalí inline formulář (název + volitelně deadline). Úkol se přidá přímo s `status = today`, `scheduledDate = dnes`, `contextId = kontext dané skupiny`. Ihned se vytvoří DayLogEntry se signifierem `dot` (•). Enter = uložit a zobrazit další prázdný řádek pro rychlé přidání více úkolů za sebou. Escape = zavřít formulář.
- **BuJo signifiers** u každého úkolu (vizuální značky):
  - `•` (tečka) – otevřený úkol
  - `✕` – dokončený úkol
  - `→` – migrován na další den
  - `←` – migrován do backlogu
  - `—` – zrušený úkol
- U každého úkolu:
  - Signifier ikona (viz výše)
  - Název (kliknutí otevře detail)
  - Kontext badge
  - Deadline indikátor (pokud nastaven, barevně kódovaný)
  - Odhad času badge (pokud nastaven, např. "~5 min")
  - Ikona pro podúkoly (pokud existují)
  - Barevný indikátor stáří úkolu (viz ADHD sekce)
- Akce na úkolu (swipe na mobilu, kontextové menu na desktopu):
  - Dokončit (→ signifier ✕)
  - Přesunout na zítra (→ signifier →, úkol zůstane viditelný v dnešním dni se šipkou)
  - Přesunout do backlogu (→ signifier ←, úkol zůstane viditelný se šipkou)
  - Přiřadit/změnit kontext
  - Nastavit deadline
  - Zrušit / Smazat

**Důležité – BuJo princip:** Při přesunu na zítra/do backlogu úkol ZŮSTÁVÁ v dnešním pohledu s příslušným signifierem (šipkou). V DayLogEntry se zapíše snapshot. V cílovém dni/backlogu se vytvoří nový záznam.

### 3. Otevření nového dne
- Při prvním otevření appky v nový den se automaticky vytvoří nový DayLog
- Úkoly se `scheduledDate = dnes` se automaticky zobrazí v denním pohledu
- **Povinný review neuzavřených dnů:** Pokud existují předchozí dny, které nebyly ukončeny (closedAt = null) a obsahují nesplněné úkoly, appka VYNUTÍ review dialog:
  - **V pondělí:** Na začátku review dialogu se zobrazí **týdenní souhrn** minulého týdne (počet dokončených úkolů, nejproduktivnější den, splněné deadliny, pozitivní tón – zaměření na to co se povedlo)
  - Poté seznam neuzavřených dnů chronologicky
  - U každého dne seznam nesplněných úkolů
  - U každého úkolu volba:
    - → Přesunout na dnes
    - → Přesunout na konkrétní datum
    - ← Přesunout do backlogu
    - — Zrušit úkol
  - Hromadná akce: "Vše na dnes"
  - Uživatel MUSÍ zpracovat všechny neuzavřené dny, než se dostane do dnešního pohledu
  - Po zpracování se neuzavřené dny automaticky uzavřou (nastaví closedAt)

### 4. Ukončení dne (denní migrace – BuJo princip)
- Tlačítko "Ukončit den" (v denním pohledu)
- Otevře review dialog:
  - Seznam nesplněných úkolů z dnešního dne
  - U každého úkolu možnost:
    - → Přesunout na zítřek (výchozí)
    - ← Přesunout do backlogu
    - — Zrušit úkol
    - 📅 Naplánovat na konkrétní datum
  - Hromadná akce: "Vše na zítřek"
- Po potvrzení:
  - DayLogEntry záznamy se aktualizují s příslušnými signifiers
  - DayLog.closedAt se nastaví na aktuální čas (od teď jsou DayLogEntry imutabilní)
  - Úkoly se migrují do cílových destinací

### 5. Archiv dnů (BuJo deník)
- Chronologický seznam minulých dnů
- **Výchozí zobrazení:** posledních 30 dnů
- **Infinite scroll** pro starší dny
- **Kalendářový navigátor** pro rychlý skok na konkrétní den/měsíc
- Kliknutí na den otevře **read-only pohled** daného dne:
  - Všechny úkoly seskupené podle kontextů (dle contextName v DayLogEntry)
  - U každého úkolu BuJo signifier (✕ hotovo, → přesunuto, ← backlog atd.)
  - Pokud task stále existuje (taskId), název je prokliknutelný do detailu
  - Statistika dne: počet dokončených / přesunutých / zrušených
- Vizuální přehled produktivity (barevné tečky v kalendáři – zelená = hodně hotovo, žlutá = málo)
- **Týdenní přehledy** dostupné ručně z archivu

### 6. Nadcházející (týdenní/měsíční přehled)
- Přepínání mezi týdenním a měsíčním pohledem
- Týdenní: 7 sloupců/řádků s úkoly pro každý den
- Měsíční: kalendářový grid s tečkami/počty úkolů
- Kliknutí na den zobrazí úkoly daného dne
- Drag & drop úkolů mezi dny pro přeplánování

### 7. Backlog
- Všechny úkoly se statusem backlog
- **Seskupené podle kontextů** (stejně jako denní pohled, kontexty v pevném pořadí dle sortOrder)
- Drag & drop řazení v rámci kontextové skupiny (používá Task.sortOrder)
- Drag & drop mezi kontexty mění kontext úkolu
- Akce: naplánovat na dnes, na datum

### 8. Šablony seznamů
- Uživatel si vytváří **opakovaně použitelné šablony** (např. "Balení na cestu", "Daňové přiznání")
- Každá šablona má položky (TaskTemplateItem) s: název, volitelný popis, přednastavený kontext
- **Aktivace šablony:** Tlačítko "Použít šablonu" → z každé položky se vytvoří samostatný Task s `status = today`, `scheduledDate = dnes`, kontextem z položky šablony. Ihned se vytvoří DayLogEntry pro každý úkol.
- Vytvořené tasky pak žijí vlastním životem v denním pohledu (lze přesouvat, měnit kontext, migrovat atd.)
- **Šablona zůstává nezměněna** po aktivaci – lze použít znovu
- Šablony lze editovat (přidávat/odebírat/měnit položky) a mazat

### 9. Kontexty
- Pohled filtrovaný podle kontextu
- Zobrazí všechny úkoly daného kontextu (across all statuses)
- Uživatel si vytváří/edituje/archivuje kontexty
- Každý kontext: název, emoji ikona, barva
- **Řazení kontextů:** drag & drop ve správě kontextů (sortOrder), toto pořadí se používá i v denním pohledu

### 10. Detail úkolu
- Otevírá se jako slide-over panel (zprava) nebo modal
- Pole: název, popis (Markdown), kontext, deadline, odhad času, opakování
- Podúkoly (checklist) – přidávání, odškrtávání, řazení, volitelná poznámka u každého
- Inline editace názvu – klik přímo na text, editace na místě

### 11. Opakující se úkoly
- Při vytváření/editaci úkolu: nastavení opakování
- Možnosti: denně, týdně (vybrané dny), měsíčně, vlastní
- **Nová instance se vytvoří AŽ PO DOKONČENÍ staré instance**
- Dokud není stará instance dokončena, chová se jako normální úkol (lze migrovat na zítra, do backlogu atd.)
- **Generování nové instance je výhradně serverová operace** – offline se úkol označí jako dokončený, nová instance se vytvoří při synchronizaci. Uživatel offline uvidí info "Další opakování se vytvoří po připojení"
- Nová instance zdědí kontext a popis z původního úkolu

### 12. Filtrování a hledání
- Globální vyhledávání (Ctrl+K / Cmd+K)
- Filtr podle: kontext, deadline (dnes, tento týden, po deadline)
- Kombinovatelné filtry

---

## ADHD-friendly funkce

Všechny funkce v této sekci slouží ke snížení tření, prevenci overwhelmu a poskytování dopaminových odměn. **Každá funkce je jednotlivě vypínatelná v nastavení** (sekce "Motivace & feedback"). Všechny zapnuté by default.

### Prevence overwhelmu
- **Progress bar dne:** V horní části denního pohledu vizualizace progresu – kolik úkolů z dnešního dne je hotovo (např. "3/7 ✕"). Plynulá animace při dokončení úkolu.
- **Focus mód:** Tlačítko v denním pohledu přepne do režimu, který zobrazí POUZE jeden úkol. Velký, čistý design, žádné rozptylování.
  - Pořadí úkolů: kontexty dle sortOrder, v rámci kontextu úkoly dle DayLogEntry.sortOrder
  - Volitelný filtr na kontext (dropdown v horní části) – např. "Focus: jen @práce"
  - Tlačítka: **Hotovo** (dokončí, zobrazí další) / **Přeskočit** (zobrazí další, přeskočený úkol se zařadí na konec fronty) / **Ukončit focus mód**
  - Přeskočené úkoly se nezobrazí znovu dokud neprojdu ostatní
  - Pokud jsou všechny úkoly přeskočeny, zobrazí se zpráva "Všechny úkoly přeskočeny" s volbami: **Začít znovu** (resetuje frontu) / **Ukončit focus mód**

### Snížení tření a rozhodovací paralysis
- **Časové odhady:** Volitelné pole `estimatedMinutes` u úkolu. Zobrazuje se jako badge "~5 min", "~30 min". Pomáhá vybrat úkol podle dostupného času. V denním pohledu se u kontextové skupiny zobrazí součet odhadů zbývajících úkolů.
- **Quick actions:** Všechny hlavní akce na úkolu (dokončit, přesunout na zítra, backlog) dostupné na 1 klik/tap. Na mobilu swipe gesta. Žádné vnořené menu pro běžné operace.
- **Barevné kódování deadline:** Deadline badge má barvu podle urgence:
  - 🟢 Zelená: deadline za více než 3 dny
  - 🟡 Žlutá: deadline za 1-3 dny
  - 🔴 Červená: deadline dnes nebo po termínu
  - Pulsující animace u úkolů po deadline
- **Barevné kódování stáří úkolu:** Úkoly, které se dlouho odkládají (počítáno od createdAt), vizuálně stárnou:
  - Bez indikátoru: úkol mladší než 7 dní
  - 🟡 Žlutý indikátor: úkol starší než 7 dní
  - 🟠 Oranžový indikátor: úkol starší než 14 dní
  - 🔴 Červený indikátor: úkol starší než 30 dní
  - Zobrazuje se jako nenápadný boční proužek nebo tečka u úkolu (jemná připomínka, ne stres)

### Dopaminové odměny
- **Mikro-oslavy při dokončení:** Při zaškrtnutí úkolu krátká animace (confetti efekt, checkmark animace). Různé intenzity – větší oslava při dokončení posledního úkolu dne nebo všech úkolů v kontextu.
- **Povzbudivé zprávy:** Při dokončení úkolu se na krátkou dobu zobrazí náhodná povzbudivá zpráva (toast notifikace). Různé zprávy pro různé situace. Příklady: "Skvělý start!", "Jedeš!", "Poslední! Dnes jsi to dal/a!".
- **Týdenní souhrn:** Součást pondělního review dialogu. Pozitivní tón – počet dokončených úkolů, nejproduktivnější den, splněné deadliny. Zaměření na to co se povedlo. Dostupný i ručně z Archivu dnů.

---

## Klávesové zkratky
- `Q` nebo `N` – Quick add (odkudkoli)
- `Ctrl/Cmd + K` – Globální hledání
- `1-6` – Navigace mezi pohledy (v sidebar)
- `Enter` – Otevřít detail vybraného úkolu
- `Space` – Označit úkol jako hotový
- `Backspace/Delete` – Smazat úkol (s undo toastem)
- `↑/↓` – Navigace mezi úkoly v seznamu
- `Tab` – Přesun mezi úkoly
- `Escape` – Zavřít modal/dialog/inline formulář (konzistentní)

---

## UI/UX požadavky

### Design
- Čistý, minimalistický design
- Dark mode + light mode (přepínání + systémová preference)
- Barvy: neutrální základ, akcenty přes barvy kontextů
- Plynulé animace (přesuny, dokončení úkolu)
- Jasně vizuálně oddělené drop zóny při drag & drop mezi kontexty

### Vizuální hierarchie
- Název úkolu výrazný, metadata (kontext, deadline, odhad) tlumené a menší – oči jdou okamžitě k tomu důležitému
- Dokončené úkoly vizuálně ustoupí (opacity 50%, přeškrtnutí) aby neodváděly pozornost od zbývajících
- Sekundární informace (deadline, odhad času, stáří) zobrazovat jako malé badge/ikony, ne plný text – méně vizuálního šumu
- Prázdné kontextové skupiny se v denním pohledu nezobrazují

### Vizuální feedback
- **Optimistické updaty** – UI se změní okamžitě, nečeká na server. Pokud operace selže, vrátí se zpět s chybovou hláškou
- **Undo akce** – po dokončení/přesunu/smazání úkolu se na 5 sekund zobrazí "Zpět" toast. ADHD uživatelé často kliknou impulzivně
- **Skeleton loading** místo spinnerů – appka nikdy nepůsobí "prázdně" při načítání
- Každá akce má okamžitou vizuální odezvu

### Prevence chyb
- Smazání vždy s undo toastem (5s) nebo potvrzovacím dialogem. Nikdy nevratná akce na 1 klik
- Při ukončení dne jasné shrnutí co se stane ("3 úkoly přesuneš na zítra, 1 do backlogu") před potvrzením
- Rozepsaný inline formulář se neztratí při náhodném kliknutí mimo – zůstane otevřený

### Prázdné stavy a onboarding
- Prázdný denní pohled: motivační zpráva + velké CTA "Přidej první úkol" nebo "Přetáhni z inboxu"
- Prázdný inbox: "Všechno zpracováno! 🎉" – pozitivní zpětná vazba
- **Onboarding (3-4 kroky max):**
  1. Uvítání + výběr šablony kontextů: "GTD klasika" (@počítač, @telefon, @venku, @obchod), "Oblasti života" (@práce, @doma, @rodina, @zdraví), "Vlastní" (prázdné), nebo přeskočit
  2. Přidej první úkol
  3. Dokonči ho (ukázka confetti)
  4. Hotovo!

### Klávesnicová efektivita (desktop)
- Tab mezi úkoly, Enter otevřít detail, Space dokončit. Šipky nahoru/dolů pro navigaci v seznamu
- Quick add: po přidání úkolu kurzor zůstane v textovém poli pro další úkol (batch režim)
- Escape vždy zavře modal/dialog/inline formulář – konzistentní chování
- Inline editace názvu úkolu – klik přímo na text, editace na místě, žádný modal pro jednoduchou změnu

### Navigace
- Maximálně 2 úrovně hloubky – nikdy podmenu podmenu
- Zpět tlačítko/gesto vždy funguje a vrací na předchozí pohled
- Aktuální pozice v navigaci jasně zvýrazněná

### Responzivita
- **Desktop (>1024px):** Sidebar vlevo (collapsible), hlavní obsah vpravo
- **Tablet (768-1024px):** Sidebar jako overlay
- **Mobil (<768px):** Spodní navigace (4 hlavní položky + menu), swipe akce na úkolech

### Mobilní specifika
- Swipe doprava = dokončit úkol (nejčastější akce), swipe doleva = menu s dalšími akcemi. Jedna ruka, jeden palec
- Dlouhý stisk = drag & drop (přeřazení)
- Velké klikací/tapovací zóny (min 44px)
- Pull-to-refresh na všech seznamech
- Sticky header s progress barem a quick add tlačítkem – vždy dostupné při scrollu
- Haptic feedback při dokončení úkolu (na zařízeních které to podporují)

### Přístupnost
- Klávesová navigace
- ARIA labels
- Dostatečný kontrast

---

## Offline podpora & synchronizace

### Architektura
- **PWA (Progressive Web App)** – Service Worker pro cachování appky, manifest pro instalaci na homescreen
- **IndexedDB** (Dexie.js) jako lokální databáze
- Všechna data se ukládají lokálně I na server – IndexedDB je primární zdroj pro UI, server je zdroj pravdy pro sync
- Dexie.js schéma zrcadlí Prisma model, používá sdílené TypeScript typy

### Offline fungování
- **Všechny funkce fungují plně offline** – přidávání, editace, dokončování, přesouvání úkolů, ukončení dne, review
- **Výjimka:** Generování nové instance opakujícího se úkolu je serverová operace – offline se úkol označí jako dokončený, nová instance se vytvoří při sync. Uživatel uvidí info "Další opakování se vytvoří po připojení"
- Změny provedené offline se ukládají do **fronty operací** (operation queue) v IndexedDB
- Každá operace ve frontě obsahuje: typ operace, data, timestamp, stav (pending/synced/failed)

### Synchronizace
- Po obnovení připojení se fronta operací odešle na server chronologicky (FIFO)
- **Last-write-wins** strategie pro konflikty – každý záznam má `updatedAt` timestamp, novější zápis přepíše starší
- **DayLogEntry je append-only při sync** – nikdy se nemažou, pouze přidávají. Při offline konfliktu (ukončení dne na dvou zařízeních) se záznamy z obou zařízení zachovají
- **DayLog.closedAt** – last-write-wins (poslední uzavření platí)
- Sync probíhá na pozadí, uživatel není blokován
- Vizuální indikátor stavu synchronizace v UI:
  - 🟢 Online & synced
  - 🟡 Synchronizuji... (počet čekajících operací)
  - 🔴 Offline (změny se uloží lokálně)
- Po úspěšné synchronizaci se stáhnou aktuální data ze serveru (pull) pro případ změn z jiného zařízení

### Sync pull detail
- `GET /api/sync/pull?since=timestamp` vrací všechny entity kde `updatedAt > since` nebo `createdAt > since`
- Formát odpovědi: `{ tasks: [...], subtasks: [...], contexts: [...], taskTemplates: [...], taskTemplateItems: [...], dayLogs: [...], dayLogEntries: [...] }`
- Pro append-only entity (DayLogEntry) se vrací záznamy s `createdAt > since`

### Technická implementace
- Service Worker: cachování app shell + statických assets (Workbox)
- IndexedDB: mirror celé databáze lokálně (tasks, subtasks, contexts, taskTemplates, taskTemplateItems, daylogs, daylogentries)
- Background Sync API pro automatickou synchronizaci po obnovení připojení
- Periodic Background Sync pro pravidelné stahování změn (pokud prohlížeč podporuje)
- Fallback: manuální sync tlačítko v UI

---

## Nastavení (Settings)

### Profil
- Jméno, email, avatar

### Kontexty
- Správa kontextů (řazení, editace, archivace)
- Zobrazení archivovaných kontextů s možností obnovení

### Šablony
- Správa šablon seznamů

### Vzhled
- Dark / Light mode přepínání
- Systémová preference (auto)

### Motivace & feedback
Toggle pro každou funkci zvlášť:
- Confetti animace při dokončení
- Povzbudivé zprávy (toast)
- Haptic feedback (mobil)
- Barevné kódování stáří úkolu
- Progress bar dne

### Offline & sync
- Stav synchronizace
- Manuální sync tlačítko
- Vymazat lokální data

### Data
- **Export dat** – stažení všech dat jako JSON (kompletní export všech entit: tasks, subtasks, contexts, templates, daylogs, daylogentries)
- Smazání účtu

### Účet
- Změna hesla
- Odhlášení

---

## API Endpoints (REST)

### Auth
- `POST /api/auth/register` – registrace (automaticky vytvoří systémový kontext Inbox + volitelně kontexty ze šablony)
- `POST /api/auth/[...nextauth]` – NextAuth handling

### Tasks
- `GET /api/tasks` – seznam (query params: status, contextId, scheduledDate, hasDeadline)
- `POST /api/tasks` – vytvoření
- `PATCH /api/tasks/:id` – úprava (včetně změny statusu, kontextu)
- `DELETE /api/tasks/:id` – smazání
- `POST /api/tasks/reorder` – hromadná změna pořadí (Task.sortOrder pro inbox/backlog)

### Subtasks
- `GET /api/tasks/:id/subtasks`
- `POST /api/tasks/:id/subtasks`
- `PATCH /api/subtasks/:id`
- `DELETE /api/subtasks/:id`
- `POST /api/tasks/:id/subtasks/reorder` – změna pořadí

### DayLogs
- `GET /api/daylogs` – seznam dnů (s paginací, výchozí posledních 30)
- `GET /api/daylogs/:date` – detail konkrétního dne (entries se signifiers, seskupené podle kontextů)
- `POST /api/daylogs/open` – otevření nového dne (vytvoří DayLog, vrátí neuzavřené dny pokud existují)
- `POST /api/daylogs/close` – ukončení dne (bulk migrace + nastavení closedAt → DayLogEntry se stane imutabilní)
- `POST /api/daylogs/review` – zpracování neuzavřených dnů (bulk operace)
- `POST /api/daylogs/:date/entries/reorder` – změna pořadí úkolů v rámci dne a kontextu
- `GET /api/daylogs/weekly-summary` – týdenní souhrn pro pondělní review

### Contexts
- `GET /api/contexts` – seznam (jen nearchivované)
- `POST /api/contexts` – vytvoření
- `PATCH /api/contexts/:id` – úprava (Inbox nelze upravit)
- `DELETE /api/contexts/:id` – archivace (soft delete, Inbox nelze)
- `POST /api/contexts/reorder` – změna pořadí kontextů (Inbox vždy první)

### Task Templates
- `GET /api/templates` – seznam šablon
- `POST /api/templates` – vytvoření šablony
- `PATCH /api/templates/:id` – úprava šablony
- `DELETE /api/templates/:id` – smazání šablony
- `GET /api/templates/:id/items` – položky šablony
- `POST /api/templates/:id/items` – přidání položky
- `PATCH /api/template-items/:id` – úprava položky
- `DELETE /api/template-items/:id` – smazání položky
- `POST /api/templates/:id/activate` – aktivace šablony (vytvoří tasky na dnes)

### Search
- `GET /api/search?q=...` – globální fulltext hledání

### Sync
- `POST /api/sync/push` – odeslání fronty offline operací na server
- `GET /api/sync/pull?since=timestamp` – stažení všech změněných entit od posledního sync

### Export
- `GET /api/export` – export všech dat jako JSON (tasks, subtasks, contexts, templates, daylogs, daylogentries)

### User Settings
- `GET /api/settings` – načtení uživatelských preferencí
- `PATCH /api/settings` – uložení preferencí (ADHD funkce toggles, vzhled atd.)

---

## Struktura projektu

```
/app
  /api
    /auth/[...nextauth]/route.ts
    /auth/register/route.ts
    /tasks/route.ts
    /tasks/[id]/route.ts
    /tasks/[id]/subtasks/route.ts
    /tasks/reorder/route.ts
    /subtasks/[id]/route.ts
    /daylogs/route.ts
    /daylogs/open/route.ts
    /daylogs/close/route.ts
    /daylogs/review/route.ts
    /daylogs/weekly-summary/route.ts
    /daylogs/[date]/route.ts
    /daylogs/[date]/entries/reorder/route.ts
    /contexts/route.ts
    /contexts/[id]/route.ts
    /contexts/reorder/route.ts
    /templates/route.ts
    /templates/[id]/route.ts
    /templates/[id]/items/route.ts
    /templates/[id]/activate/route.ts
    /template-items/[id]/route.ts
    /search/route.ts
    /sync/push/route.ts
    /sync/pull/route.ts
    /export/route.ts
    /settings/route.ts
  /(auth)
    /login/page.tsx
    /register/page.tsx
    /onboarding/page.tsx
  /(app)
    /layout.tsx          (sidebar + main layout + neuzavřené dny check)
    /today/page.tsx
    /upcoming/page.tsx
    /backlog/page.tsx
    /archive/page.tsx
    /archive/[date]/page.tsx
    /templates/page.tsx
    /templates/[id]/page.tsx
    /contexts/[id]/page.tsx
    /settings/page.tsx
/components
  /ui (shadcn/ui komponenty)
  /tasks
    TaskItem.tsx
    TaskList.tsx
    TaskDetail.tsx
    TaskContextGroup.tsx
    InlineAddTask.tsx
    QuickAdd.tsx
    SubtaskList.tsx
  /inbox
    InboxProcessing.tsx   (Tinder-styl zpracování)
    ProcessDialog.tsx     (kompaktní dialog: kontext + destinace)
  /daylog
    DayEndReview.tsx
    UnclosedDaysReview.tsx
    WeeklySummary.tsx
    DayArchiveView.tsx
    DayCalendarNav.tsx
    SignifierIcon.tsx
  /templates
    TemplateManager.tsx
    TemplateActivate.tsx
  /focus
    FocusMode.tsx
  /layout
    Sidebar.tsx
    BottomNav.tsx
    SearchDialog.tsx
    SyncIndicator.tsx
  /contexts
    ContextBadge.tsx
    ContextManager.tsx
  /feedback
    ConfettiAnimation.tsx
    EncouragingToast.tsx
    ProgressBar.tsx
    UndoToast.tsx
  /onboarding
    OnboardingFlow.tsx
    ContextTemplateSelector.tsx
/lib
  prisma.ts
  auth.ts
  utils.ts
  types.ts             (sdílené TypeScript typy)
  db.ts                (Dexie.js IndexedDB setup)
  sync.ts              (synchronizační logika)
  operationQueue.ts    (fronta offline operací)
/prisma
  schema.prisma
/public
  manifest.json        (PWA manifest)
  sw.js                (Service Worker)
```

---

## Klíčová pravidla implementace

1. **Task.status = aktuální stav.** DayLogEntry = historický snapshot. DayLogEntry je editovatelný dokud den není uzavřený. Po uzavření dne (closedAt != null) se DayLogEntry stává imutabilním.
2. **DayLogEntry obsahuje:** taskTitle (kopie), signifier, sortOrder, contextId + contextName (kopie). Plus taskId jako FK pro proklik (nullable – task mohl být smazán).
3. **DayLogEntry je append-only při sync** – nikdy se nemaže. Záznamy z více zařízení se sloučí.
4. **Dva systémy řazení:** Task.sortOrder pro inbox/backlog pohled. DayLogEntry.sortOrder pro denní pohled (per den, per kontext).
5. **Kontexty v denním pohledu** se řadí dle Context.sortOrder (stabilní pořadí). Drag & drop v rámci kontextu = řazení priority. Drag & drop mezi kontexty = změna kontextu úkolu.
6. **Opakující se úkoly:** nová instance se generuje AŽ po dokončení staré. Generování je výhradně serverová operace (offline se vytvoří při sync).
7. **Smazání kontextu = archivace** (soft delete). Kontext zmizí z nabídky, úkoly a DayLogEntry záznamy si ho podrží.
8. **Povinný review neuzavřených dnů** – uživatel musí zpracovat všechny neuzavřené dny před přístupem k dnešnímu pohledu. V pondělí obsahuje týdenní souhrn.
9. **Poznámky jako entita neexistují** – popis/poznámka je součástí Task.description (Markdown).
10. **Kontext je vždy povinný** – každý úkol má vždy kontext. Nové úkoly dostávají systémový kontext Inbox. Zpracování úkolu (GTD) = přeřazení z Inbox do uživatelského kontextu + volba destinace (dnes/datum/backlog) v jednom kompaktním dialogu (Tinder-styl flow). Inbox je systémový kontext (isSystem = true), nelze smazat ani archivovat, vždy první v pořadí.
11. **Quick add pravidlo:** Kontext = Inbox → status inbox. Kontext = jiný → status today, scheduledDate = dnes, vytvoří se DayLogEntry.
12. **Inline přidání v denním pohledu:** Přeskočí inbox – status = today, scheduledDate = dnes, kontext = kontext skupiny, ihned se vytvoří DayLogEntry.
13. **Last-write-wins** pro všechny sync konflikty na Task a DayLog. DayLogEntry je append-only.
14. **Focus mód:** Pořadí dle kontextů (sortOrder) → úkoly (DayLogEntry.sortOrder). Filtr na kontext. Přeskočené úkoly na konec fronty.
15. **Šablony jsou opakovaně použitelné.** Aktivace vytvoří samostatné tasky na dnes s kontexty z položek šablony. Šablona zůstane nezměněna. Pokud některá položka šablony odkazuje na archivovaný kontext, tento kontext se při aktivaci automaticky obnoví (isArchived = false).
16. **ADHD funkce jsou jednotlivě vypínatelné** v nastavení (User.preferences).

---

## Fáze implementace (vše najednou, ale logické pořadí)

### Krok 1 – Infrastruktura
1. Projekt setup (Next.js, Tailwind, Prisma, PostgreSQL, Dexie.js)
2. Kompletní datový model a migrace (všechny tabulky)
3. Sdílené TypeScript typy (Prisma → types.ts → Dexie schéma)
4. Autentizace (NextAuth – email + Google + GitHub, automatické vytvoření Inbox kontextu)
5. User preferences model (JSON pole pro nastavení ADHD funkcí, vzhledu)

### Krok 2 – Core workflow
6. CRUD pro úkoly (API + UI)
7. Kontexty CRUD + správa pořadí + Inbox jako systémový kontext
8. Inbox pohled + quick add dialog
9. Inbox zpracování – Tinder-styl flow (kompaktní dialog: kontext + destinace, swipe na mobilu, klávesové zkratky na desktopu)
10. Denní pohled s kontextovými skupinami + drag & drop (v rámci i mezi kontexty)
11. Inline přidání úkolu v denním pohledu
12. BuJo signifiers zobrazení

### Krok 3 – BuJo lifecycle
13. Otevření nového dne + DayLog vytvoření
14. Povinný review neuzavřených dnů (s týdenním souhrnem v pondělí)
15. Ukončení dne + migrace dialog (DayLogEntry se stane imutabilní)
16. DayLogEntry snapshot vytváření
17. Archiv dnů (read-only pohled + kalendář + statistiky + infinite scroll)

### Krok 4 – Rozšíření
18. Backlog pohled
19. Šablony seznamů (CRUD + aktivace → vytvoření tasků)
20. Podúkoly (checklist s poznámkami)
21. Opakující se úkoly (serverová generace nových instancí)
22. Nadcházející pohled (týden/měsíc)
23. Detail úkolu (slide-over panel, Markdown popis, inline editace)

### Krok 5 – ADHD funkce
24. Progress bar dne
25. Focus mód (s filtrem na kontext, přeskakování)
26. Časové odhady (estimatedMinutes) + badge + součty
27. Barevné kódování deadline (zelená/žlutá/červená + pulsující animace)
28. Barevné kódování stáří úkolu
29. Confetti animace + povzbudivé zprávy
30. Undo toast (5s) pro všechny destruktivní akce
31. Settings stránka (všechny sekce + ADHD toggles)

### Krok 6 – Offline & PWA
32. Service Worker + PWA manifest
33. IndexedDB mirror (Dexie.js)
34. Fronta offline operací (operation queue)
35. Sync logika (push/pull, last-write-wins, DayLogEntry append-only)
36. Background Sync API
37. Sync indikátor v UI (🟢🟡🔴)

### Krok 7 – Polish
38. Dark mode
39. Klávesové zkratky
40. Globální hledání (Ctrl+K)
41. Filtr podle deadline
42. Swipe akce na mobilu
43. Haptic feedback
44. Animace a transitions
45. Skeleton loading
46. Responzivní fine-tuning
47. Onboarding (šablony kontextů + tutorial)
48. Export dat (JSON)
