# Technische specificatie — Kracht van Voeding

## 1. Documentstatus

- Applicatie: Kracht van Voeding
- Appversie: 1.0.3 (`app.json`)
- Packageversie: 1.0.0 (`package.json`)
- Platformen: Android en iOS; er is ook een webscript, maar niet alle functies zijn daar beschikbaar
- Laatst bijgewerkt: 10 augustus 2026
- Status: beschrijving van de huidige repository, inclusief lokale supplementherinneringen

## 2. Doel en scope

Kracht van Voeding is een lokale mobiele tracker voor voeding, supplementen en overige terugkerende items. Een gebruiker kan:

- een gepland item met naam, categorie, tijd en weekdagen toevoegen;
- een los to-do-item met optionele week-, maand- of datumplanning toevoegen;
- items voor vandaag afvinken;
- de voortgang van vandaag bekijken;
- geplande items wijzigen of met een PIN verwijderen;
- de laatste zeven dagen aan check-ins per gepland item bekijken;
- op de ingestelde dagen en tijd lokale meldingen voor supplementen ontvangen.

De app bevat geen account, backend, synchronisatie tussen apparaten, advertenties of analytics. Alle gebruikersdata blijft lokaal op het apparaat.

## 3. Technische stack

| Onderdeel | Technologie | Huidige versie/range |
| --- | --- | --- |
| Applicatieframework | Expo | `^56.0.12` |
| UI-runtime | React | `19.2.3` |
| Mobiele runtime | React Native | `0.85.3` |
| Lokale opslag | AsyncStorage | `2.2.0` |
| Lokale meldingen | Expo Notifications | `~56.0.23` |
| Selectievelden | React Native Picker | `2.11.4` |
| Iconen | Expo Vector Icons | `^15.0.2` |
| Voortgangsgrafiek | React Native SVG | `15.15.4` |
| Updates | Expo Updates | `~56.0.21` |
| Build en distributie | EAS Build / EAS Submit | configuratie in `eas.json` |

De notificatie-implementatie gebruikt de versiegebonden Expo Notifications-API voor wekelijkse triggers, permissies, foreground-afhandeling en Android-kanalen.

## 4. Repositorystructuur

```text
Kracht-van-Voeding/
├── App.js                         # globale state, opslag, navigatie en notificatiesynchronisatie
├── index.js                       # Expo/React Native entrypoint
├── app.json                       # native Expo-configuratie
├── eas.json                       # EAS build- en submitprofielen
├── package.json                   # scripts en dependencies
├── package-lock.json              # vastgelegde npm dependency-resolutie
├── pages/
│   ├── HomeScreen.js              # vandaag, to-do, aankomend en dagelijkse voortgang
│   ├── AddScreen.js               # nieuw gepland item of to-do-item
│   └── SettingsScreen.js          # totaaloverzicht, geschiedenis, wijzigen en verwijderen
├── services/
│   └── notifications.js           # lokale supplementherinneringen
├── assets/                        # iconen, splash, storebanners en screenshots
├── mdfiles/
│   └── TECHNISCHE_SPECIFICATIE.md
├── privacy-policy.md              # Nederlands en Engels privacybeleid
├── support.md                     # supportinformatie
├── appstore-metadata.md           # Apple App Store-metadata
└── androidstore-metadata.md       # Google Play Store-metadata
```

## 5. Architectuur

De app is een kleine client-only React Native-app met één centrale statecontainer in `App.js`.

```text
index.js
  └── App.js
      ├── centrale pills-state
      ├── AsyncStorage-adapter
      ├── notificatiesynchronisatie
      ├── handmatige schermnavigatie
      ├── HomeScreen
      ├── AddScreen
      └── SettingsScreen
```

Er wordt geen navigatiebibliotheek gebruikt. `App.js` bewaart de actieve schermnaam in de lokale `screen`-state en rendert conditioneel `home`, `add` of `settings`. Een zwevende balk onderaan wijzigt deze state.

`pills` en `setPills` worden als props aan ieder scherm doorgegeven. Wijzigingen in een scherm lopen daardoor terug naar dezelfde centrale state. Na hydratatie schrijft een effect de volledige lijst naar AsyncStorage. Een tweede effect synchroniseert alleen wanneer de supplementplanning inhoudelijk is veranderd.

## 6. Datamodel

Alle items staan als JSON-array onder AsyncStorage-sleutel `PILLS`.

### 6.1 Gemeenschappelijke velden

```js
{
  id: string,             // Date.now() als string
  name: string,
  category: "voeding" | "supplement" | "overig",
  type: "scheduled" | "todo",
  completedDates: string[]
}
```

`completedDates` bevat waarden van `Date.prototype.toDateString()`, bijvoorbeeld `"Mon Aug 10 2026"`. Een check-in is daarmee per lokale kalenderdag uniek, maar niet tijdzone-onafhankelijk.

### 6.2 Gepland item

```js
{
  ...common,
  type: "scheduled",
  time: "HH:mm",
  days: ("Ma" | "Di" | "Wo" | "Do" | "Vr" | "Za" | "Zo")[]
}
```

### 6.3 To-do-item

```js
{
  ...common,
  type: "todo",
  todoType: "Geen" | "Week" | "Maand" | "Datum",
  weekNumber: string | null,
  monthNumber: string | null,
  dueDate: string | null
}
```

De invoer voor week, maand en datum is op dit moment vrije tekst. De waarden worden getoond, maar niet gebruikt om de to-do-lijst op vervaldatum te filteren.

## 7. Functioneel gedrag per scherm

### 7.1 Start en globale navigatie

Bij de eerste render start de app op `home`. `App.js` leest daarna `PILLS` uit AsyncStorage. Opslaan en notificatiesynchronisatie blijven geblokkeerd totdat het lezen is afgerond. Deze hydratatiebarrière voorkomt dat een bestaande lijst tijdens het opstarten door de initiële lege state wordt overschreven.

De onderste navigatie bevat:

- huis: `HomeScreen`;
- plus: `AddScreen`;
- voeding: `SettingsScreen`.

### 7.2 HomeScreen

Het beginscherm toont:

- de titel “Mijn Voeding”;
- een SVG-voortgangsring voor het percentage van de geplande items van vandaag dat is afgevinkt;
- geplande items voor vandaag, gegroepeerd als Voeding, Overig en Supplementen en gesorteerd op tijd;
- alle to-do-items;
- een inklapbare sectie met latere geplande items.

Een tik op een item van vandaag wisselt de aanwezigheid van de huidige `toDateString()` in `completedDates`. Items van toekomstige dagen worden gedimd en kunnen niet worden afgevinkt.

Elk uur wordt geprobeerd afgeronde to-do-items ouder dan twee uur te verwijderen. Zie de beperkingen in hoofdstuk 14 voor de huidige tijdregistratie daarvan.

### 7.3 AddScreen

Het toevoegscherm ondersteunt drie categorieën en twee itemtypen.

Voor een gepland item zijn verplicht:

- categorie;
- niet-lege naam;
- minimaal één weekdag.

De gebruiker kiest uur en minuut met twee native pickers. De standaardtijd is 08:00.

Voor een to-do-item wordt afhankelijk van de gekozen planning gecontroleerd of een weeknummer, maandnummer of datum is ingevuld. Na opslaan wordt een nieuw ID op basis van `Date.now()` toegekend, de centrale lijst bijgewerkt en teruggenavigeerd naar home.

### 7.4 SettingsScreen

Dit scherm heet in de UI “Overzicht” en bevat:

- een algemene voortgangskaart;
- het aantal geplande items;
- het totaal aantal opgeslagen check-ins;
- alle geplande items gegroepeerd per categorie;
- een geschiedenisindicator voor de laatste zeven kalenderdagen;
- een bewerkmodus voor tijd en weekdagen;
- verwijdering na invoer van PIN `1234`.

Een wijziging van tijd of dagen werkt de centrale state bij. Bij een supplement leidt dit automatisch tot hersynchronisatie van de lokale meldingen.

## 8. Supplementherinneringen

### 8.1 Scope

Een herinnering wordt alleen aangemaakt wanneer een item aan alle voorwaarden voldoet:

- `type` is `scheduled`;
- `category` is `supplement`, hoofdletterongevoelig;
- `time` heeft formaat `HH:mm`;
- minimaal één geldige weekdag is ingesteld.

Voeding, overige geplande items en to-do-items ontvangen geen melding.

### 8.2 Trigger en bericht

Voor iedere geselecteerde dag wordt één herhalende lokale weektrigger aangemaakt. Expo gebruikt weekdagen 1 tot en met 7, waarbij zondag 1 is. De Nederlandse dagcodes worden als volgt vertaald:

| App | Expo-weekdag |
| --- | ---: |
| Zo | 1 |
| Ma | 2 |
| Di | 3 |
| Wo | 4 |
| Do | 5 |
| Vr | 6 |
| Za | 7 |

De inhoud is:

- titel: `Tijd voor je supplement`;
- body: `Neem {naam} om {HH:mm}.`;
- geluid: standaard systeemgeluid;
- data: `kind: supplement-reminder` en het supplement-ID.

Dit zijn lokale meldingen. De app vraagt geen push-token aan en verstuurt geen supplementgegevens naar een server.

### 8.3 Synchronisatie

`services/notifications.js` beheert de volledige levenscyclus:

1. laad alle geplande OS-meldingen;
2. selecteer alleen meldingen met `data.kind === "supplement-reminder"`;
3. annuleer deze bestaande supplementmeldingen;
4. controleer of er nog geplande supplementen zijn;
5. maak op Android eerst het kanaal `supplement-reminders` aan;
6. controleer en vraag zo nodig notificatiepermissie;
7. plan één wekelijkse melding per supplementdag.

Andere, eventueel later toegevoegde meldingen worden niet geannuleerd. Synchronisaties worden via een promise-wachtrij achter elkaar uitgevoerd, zodat snelle opeenvolgende wijzigingen uiteindelijk altijd in de nieuwste planning eindigen.

Als het plannen halverwege mislukt, worden de in die poging nieuw aangemaakte meldingen weer verwijderd. De app toont vervolgens een waarschuwing.

### 8.4 Permissies en platformgedrag

- Android 8 en hoger gebruikt het kanaal `supplement-reminders` met hoge prioriteit, geluid, vibratie en een groene notificatiekleur.
- Android 12 en hoger krijgt via `app.json` de manifestpermissie `android.permission.SCHEDULE_EXACT_ALARM` voor levering op het ingestelde tijdstip.
- Android 13 en hoger toont de systeemvraag nadat het notificatiekanaal is aangemaakt.
- iOS accepteert `AUTHORIZED`, `PROVISIONAL` en `EPHEMERAL` als bruikbare autorisatiestatus.
- Bij ontvangst in de foreground zorgt de globale handler voor banner, notificatielijst en geluid.
- Bij geweigerde permissie toont de app een gele waarschuwing boven het actieve scherm.
- Web slaat de synchronisatie over; lokale mobiele supplementmeldingen zijn daar niet ondersteund.

### 8.5 Wijzigingen die synchronisatie starten

De synchronisatiesleutel bevat alleen ID, naam, tijd en gesorteerde dagen van geplande supplementen. Daardoor wordt niet opnieuw gepland bij een dagelijkse check-in, maar wel bij:

- toevoegen van een supplement;
- aanpassen van tijd of dagen;
- aanpassen van de naam via toekomstige functionaliteit;
- verwijderen van een supplement;
- laden van de app na installatie of herstart.

## 9. Opslag en gegevensstroom

```text
Gebruikersactie
  → setPills(...)
  → React rendert schermen opnieuw
  → AsyncStorage schrijft volledige PILLS-array
  → alleen bij gewijzigde supplementplanning: OS-meldingen synchroniseren
```

Er is geen schema-versienummer of migratielaag. Nieuwe velden moeten daarom achterwaarts compatibel en optioneel worden behandeld, of er moet eerst een opslagmigratie worden toegevoegd.

Fouten bij laden en opslaan worden gelogd met `console.warn`. De UI toont momenteel geen aparte opslagfoutmelding.

## 10. Native configuratie

Belangrijke waarden uit `app.json`:

| Instelling | Waarde |
| --- | --- |
| Expo owner | `yourfutureteam` |
| EAS project-ID | `d040475e-4dd2-42f9-bd41-15846e0437ee` |
| iOS bundle identifier | `com.casper.krachtvvoeding` |
| Android package | `com.casper.krachtvoeding` |
| Android versionCode | `5` |
| Oriëntatie | portrait |
| UI-thema | light |
| New Architecture | ingeschakeld |
| Runtime version | volgt appversie |
| OTA update-URL | `https://u.expo.dev/d040475e-4dd2-42f9-bd41-15846e0437ee` |

De configplugins zijn `expo-status-bar` en `expo-notifications`. De notificatieplugin en exact-alarmpermissie zijn native buildconfiguratie. Na deze wijziging is daarom een nieuwe Android- en iOS-binary nodig; alleen een EAS Update is niet voldoende om de native module aan een oudere installatie toe te voegen.

## 11. Build, run en distributie

### 11.1 Lokale commando’s

```powershell
npm install
npm run start
npm run android
npm run ios
npm run web
```

`npm run ios` vereist macOS/Xcode. Lokale meldingen moeten bij voorkeur op fysieke apparaten en in een release- of developmentbuild worden getest.

### 11.2 EAS-profielen

- `development`: development client, interne distributie;
- `preview`: interne distributie;
- `production`: automatische buildnummerverhoging en legacy peer dependency-resolutie;
- `submit.production.ios`: gebruikt App Store Connect-app-ID `6787330475`.

Aanbevolen releasecontrole voor notificaties:

1. maak een nieuwe development- of previewbuild;
2. voeg een supplement toe met een tijd enkele minuten in de toekomst;
3. accepteer notificatiepermissie;
4. sluit of background de app;
5. controleer banner, geluid, naam, tijd en gekozen weekdag;
6. wijzig tijd/dagen en controleer dat alleen de nieuwe trigger actief blijft;
7. verwijder het supplement en controleer dat de trigger verdwijnt;
8. herhaal met geweigerde permissie en vanuit foreground.

## 12. Privacy en beveiliging

De app bewaart ingevoerde namen, tijden, dagen, planning en check-ins lokaal in AsyncStorage. Er worden geen gegevens naar een eigen backend of de Expo Push Service verstuurd. De lokale notificatiebody bevat wel de supplementnaam en kan, afhankelijk van de systeeminstellingen van de gebruiker, op het vergrendelscherm zichtbaar zijn.

AsyncStorage is niet versleuteld. Het huidige verwijder-PIN `1234` staat hardcoded in de JavaScript-bundel en is daarom alleen een UI-drempel, geen beveiligingsmaatregel. Het PIN beschermt de opgeslagen data niet tegen iemand met apparaat- of bestandstoegang.

De app presenteert zichzelf in de storemetadata niet als gereguleerd medisch hulpmiddel. Herinneringen zijn ondersteunend en mogen niet als garantie op medische therapietrouw worden beschouwd; het besturingssysteem kan levering beïnvloeden door focus-, batterij- of notificatie-instellingen.

## 13. Verificatie en kwaliteit

Voor deze versie zijn uitgevoerd:

- dependency-resolutie met `npm ls --depth=0`;
- validatie van de geëxpandeerde Expo-configuratie met `expo config --type public`;
- succesvolle productie-achtige Metro-export voor Android met `expo export --platform android`.
- succesvolle productie-achtige Metro-export voor iOS met `expo export --platform ios`.

`expo install --check` meldt twee reeds aanwezige SDK-afwijkingen: `expo` staat op 56.0.12 waar de huidige controle `~56.0.19` verwacht, en `expo-updates` staat op 56.0.21 waar `~56.0.24` wordt verwacht. `expo-notifications` wordt door deze controle niet als afwijkend gemeld. De Android- en iOS-bundels slagen met de huidige versies.

Er is momenteel geen geautomatiseerde unit-, component- of end-to-end-testset in de repository. De belangrijkste kandidaten voor unit tests zijn:

- omzetting van Nederlandse dagcode naar Expo-weekdag;
- selectie van alleen geplande supplementen;
- berekening van de notificatiesynchronisatiesleutel;
- dagelijkse voortgangsberekening;
- datum- en to-do-validatie;
- opslagmigraties.

Native meldingaflevering moet aanvullend op echte apparaten worden getest, omdat een JavaScript-bundeltest geen permissiedialogen, exacte alarmen, Android-kanalen of iOS Notification Center valideert.

## 14. Bekende beperkingen en technische schuld

1. De repository gebruikt Expo SDK 56, terwijl projectinstructies expliciet naar SDK 54-documentatie verwijzen. De gebruikte notificatie-API is gecontroleerd op de versiegebonden documentatie en op de geïnstalleerde SDK 56-types, maar de projectinstructie moet bij een volgende upgrade worden bijgewerkt.
2. To-do-week, -maand en -datum worden alleen getoond; ze bepalen nog niet wanneer een item zichtbaar of vervallen is.
3. Een afgeronde to-do bewaart alleen een datum zonder tijd. De opruimlogica vergelijkt vervolgens de geparste kalenderdag met de huidige tijd. Daardoor betekent “na twee uur verwijderen” feitelijk niet betrouwbaar twee uur na de check-in.
4. De statistiek met label “Supplementen” telt alle geplande categorieën, niet uitsluitend categorie `supplement`.
5. Het voortgangspercentage in Settings vergelijkt alle historische check-ins met het aantal ingestelde weekdagen en kapt af op 100%. Dit is geen periodegebonden therapietrouwpercentage.
6. De PIN is hardcoded en kan niet door de gebruiker worden gewijzigd.
7. Er is geen scherm voor notificatiestatus, testmelding of directe link naar systeeminstellingen; alleen de waarschuwing bij mislukte of geweigerde permissie is aanwezig.
8. Wekelijkse OS-triggers blijven op het ingestelde moment afgaan, ook wanneer een gebruiker het supplement die dag al eerder heeft afgevinkt.
9. Tijdzone- of zomertijdwijzigingen zijn niet expliciet gemigreerd of getest. De wekelijkse kalendertrigger volgt het platformgedrag.
10. Er is geen centrale design-systemlaag; stijlen staan inline en schermen bevatten deels dubbele UI-logica.
11. De schermnavigatie heeft geen routes, deep links of herstel van de actieve pagina.
12. De app gebruikt vaste top- en bottomafstanden in plaats van een volledige Safe Area-oplossing.
13. Opslagfouten zijn alleen zichtbaar in ontwikkellogs.
14. Web ondersteunt geen supplementherinneringen. Bovendien kan de huidige webexport niet worden gebouwd totdat de ontbrekende bestaande webdependencies `react-dom` en `react-native-web` worden toegevoegd.
15. `expo` en `expo-updates` lopen enkele patchversies achter op de versie die de actuele SDK-controle adviseert.

## 15. Aanbevolen vervolgstappen

Prioriteit hoog:

- voer een fysieke Android- en iOS-test uit met een nieuw gebouwde binary;
- vervang de hardcoded PIN door een instelbare, veilig opgeslagen waarde of verwijder de schijnbeveiliging;
- voeg een timestamp toe aan to-do-check-ins en corrigeer de opruimlogica;
- voeg schema-versies en migraties toe aan lokale opslag;
- voeg unit tests toe voor notificatieplanning en datumberekeningen.

Prioriteit middel:

- voeg een instellingenpaneel toe om herinneringen per supplement aan of uit te zetten;
- bied een testmelding en een link naar systeeminstellingen;
- maak statistieken periodegebonden en categoriezuiver;
- valideer datum, maand en weeknummer inhoudelijk;
- centraliseer kleuren, spacing en herbruikbare componenten.

Prioriteit laag:

- introduceer formele navigatie als deep links of meer schermen nodig zijn;
- voeg export, back-up of versleutelde opslag toe als de productscope dat vereist;
- voeg optioneel interactieve notificatieacties toe, bijvoorbeeld “Genomen”, met passende achtergrondverwerking.

## 16. Technische referenties

- [Expo Notifications — SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)
- [Expo app-configuratie — SDK 54](https://docs.expo.dev/versions/v54.0.0/config/app/)
- [Expo Notifications — SDK 56](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/)
