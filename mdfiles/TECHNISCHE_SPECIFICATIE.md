# Technische en functionele specificatie — Kracht van Voeding

## 1. Documentstatus

| Onderdeel | Waarde |
| --- | --- |
| Product | Kracht van Voeding |
| Appversie | 1.0.6 |
| Packageversie | 1.0.0 |
| Platformen | Android en iOS; web gedeeltelijk |
| Laatst bijgewerkt | 22 augustus 2026 |
| Bron | Huidige repository |

Dit document beschrijft het actuele gedrag van de volledige app en dient als functionele productspecificatie, technische overdracht en testbasis.

## 2. Productdoel en scope

Kracht van Voeding is een lokale tracker voor voeding, supplementen, overige terugkerende items en losse taken. De gebruiker kan:

- een terugkerend item met categorie, naam, tijd en weekdagen toevoegen;
- een losse to-do toevoegen, optioneel gekoppeld aan een week, maand of datum;
- items van vandaag en to-do's afvinken;
- dagvoortgang en aankomende items bekijken;
- to-do's handmatig of automatisch 24 uur na afronding verwijderen;
- geplande items bewerken en met een pincode verwijderen;
- zeven dagen check-inhistorie bekijken;
- lokale meldingen voor alle geplande categorieën ontvangen;
- notificatiestatus bekijken en de systeeminstellingen openen.

Buiten scope zijn accounts, backend, cloudsync, delen tussen apparaten, advertenties, analytics en servergestuurde pushmeldingen. Gebruikersdata blijft lokaal.

## 3. Technische stack

| Onderdeel | Technologie | Versie/range |
| --- | --- | --- |
| Framework | Expo | `~56.0.20` |
| UI | React | `19.2.3` |
| Mobiele runtime | React Native | `0.85.3` |
| Opslag | AsyncStorage | `2.2.0` |
| Lokale meldingen | Expo Notifications | `~56.0.24` |
| Updates | Expo Updates | `~56.0.25` |
| Selectievelden | React Native Picker | `2.11.4` |
| Iconen | Expo Vector Icons | `^15.0.2` |
| Voortgangsring | React Native SVG | `15.15.4` |
| Build/distributie | EAS Build en Submit | `eas.json` |

De repository gebruikt SDK 56. Volgens de projectinstructie wordt voor codewerk eerst de vastgelegde SDK 54-documentatie gelezen; de geïnstalleerde SDK 56-types en builds bepalen daarnaast de compileerbaarheid.

## 4. Repositorystructuur

```text
Kracht-van-Voeding/
├── App.js                         # lifecycle, state, opslag, updates en navigatie
├── index.js                       # entrypoint
├── app.json                       # Expo/native configuratie
├── eas.json                       # build- en submitprofielen
├── package.json / package-lock.json
├── pages/
│   ├── HomeScreen.js              # vandaag, to-do's, aankomend en dagvoortgang
│   ├── AddScreen.js               # gepland item of to-do toevoegen
│   └── SettingsScreen.js          # Overzicht, historie, beheer en meldingen
├── services/
│   └── notifications.js           # lokale notificaties en diagnostiek
├── assets/
└── mdfiles/TECHNISCHE_SPECIFICATIE.md
```

## 5. Architectuur en gegevensstroom

De app is client-only. `App.js` bezit de centrale `pills`-state en geeft `pills` en `setPills` aan alle schermen door.

```text
index.js → App.js
  ├── AsyncStorage: PILLS lezen/schrijven
  ├── Expo Updates controleren/installeren
  ├── lokale meldingen initialiseren/synchroniseren
  ├── handmatige schermstate
  └── HomeScreen / AddScreen / SettingsScreen
```

Er is geen navigatiebibliotheek. `screen` bevat `home`, `add` of `settings`; de zwevende onderste navigatie wisselt deze waarde.

```text
Gebruikersactie
  → setPills(...)
  → React rendert opnieuw
  → AsyncStorage schrijft de volledige PILLS-array
  → gewijzigde planning synchroniseert OS-meldingen
```

Opslag en notificatiesynchronisatie starten pas na de initiële hydratatie, zodat de lege beginstate geen bestaande data overschrijft.

## 6. Datamodel

Alle items staan als JSON-array onder AsyncStorage-sleutel `PILLS`.

### 6.1 Gemeenschappelijk

```js
{
  id: string, // Date.now() als string
  name: string,
  category: "voeding" | "supplement" | "overig",
  type: "scheduled" | "todo",
  completedDates: string[]
}
```

`completedDates` bevat lokale waarden van `Date.prototype.toDateString()`. Een item kan daardoor eenmaal per lokale kalenderdag voltooid zijn.

### 6.2 Gepland item

```js
{
  ...common,
  type: "scheduled",
  time: "HH:mm",
  days: ("Ma" | "Di" | "Wo" | "Do" | "Vr" | "Za" | "Zo")[]
}
```

### 6.3 To-do

```js
{
  ...common,
  type: "todo",
  todoType: "Geen" | "Week" | "Maand" | "Datum",
  weekNumber: string | null,
  monthNumber: string | null,
  dueDate: string | null,
  completedAt?: string | null // ISO-timestamp van afronding
}
```

Bij aanvinken wordt `completedAt` gezet; bij ongedaan maken wordt het `null`. Oudere to-do's zonder timestamp vallen terug op de laatste `completedDates`-waarde. Week-, maand- en datumvelden zijn momenteel alleen zichtbare metadata en sturen geen filtering, sortering, deadline of melding aan.

## 7. Applicatiestart en updates

Bij opstarten:

1. controleert een productiebuild via Expo Updates op een update;
2. wordt een beschikbare update opgehaald en de app herladen;
3. leest de app `PILLS` uit AsyncStorage;
4. initialiseert de app notificatiekanaal en toestemming;
5. synchroniseert de app wekelijkse lokale herinneringen;
6. toont de app HomeScreen.

In development wordt de updatecontrole overgeslagen. Bij een updatefout gaat de app door met de geïnstalleerde versie.

## 8. Schermen en interacties

### 8.1 HomeScreen — Mijn Voeding

Home toont een SVG-ring met het percentage geplande items van vandaag dat vandaag is afgevinkt, geplande items van vandaag per categorie en tijd, alle actieve to-do's en een inklapbare aankomende sectie.

Een tik op een gepland item van vandaag wisselt de check-in. Aankomende items zijn gedimd en niet afvinkbaar.

Bij een to-do:

- wisselt een tik op de inhoud de voltooiing;
- legt aanvinken een exacte `completedAt`-timestamp vast;
- staat rechts een subtiele grijze prullenbakknop;
- vraagt verwijderen om pincode `1234`;
- verwijdert de juiste pincode alleen het gekozen item;
- verwijdert de app een afgeronde to-do automatisch na 24 uur.

Opschonen draait direct bij openen van HomeScreen en daarna ieder uur zolang het scherm actief is. Verwijdering vindt dus bij de eerste controle na 24 uur plaats; bij herstart wordt direct gecontroleerd.

### 8.2 AddScreen — toevoegen

Het scherm gebruikt een compacte, minimalistische typekeuze met twee opties:

- **Gepland item**;
- **To-do**.

De oude onduidelijke Schema-schakelaar is verwijderd. De gekozen optie heeft een subtiele groene status. Overbodige uitlegtekst is weggelaten, terwijl alle invoervelden en validatie behouden blijven. Het formulier is scrollbaar en heeft onderruimte voor navigatie en toetsenbord.

Daarna kiest de gebruiker categorie en naam. Voor een gepland item zijn categorie, naam en minimaal één dag verplicht; standaardtijd is 08:00. Voor een to-do zijn categorie en naam verplicht. Planning staat standaard op **Geen**. Bij Week, Maand of Datum moet het bijbehorende veld gevuld zijn.

Na opslaan wordt een ID aangemaakt, de centrale lijst bijgewerkt en HomeScreen geopend.

### 8.3 SettingsScreen — Overzicht

Overzicht bevat:

- algemene voortgang, aantal geplande items en totaal check-ins;
- een compacte notificatieregel met statusbol en Aan/Uit-status;
- een link naar de systeeminstellingen;
- geplande items per categorie;
- zeven kalenderdagen historie per item;
- bewerken van tijd en dagen;
- verwijderen met pincode `1234`.

De ScrollView heeft 180 punten onderruimte. De algemene voortgang is:

```text
min(100, historische check-ins / totaal ingestelde weekdagen × 100)
```

Dit is geen dag-, week- of periodegebonden therapietrouwpercentage.

## 9. Lokale meldingen

### 9.1 Scope en inhoud

Een melding wordt gepland als `type === "scheduled"`, `time` het formaat `HH:mm` heeft en `days` minimaal één waarde bevat. Categorie maakt niet uit: voeding, supplementen en overig krijgen meldingen. To-do's niet, omdat zij geen meldingstijd hebben.

Iedere gekozen dag krijgt een herhalende weektrigger:

| Appdag | Expo-weekdag |
| --- | ---: |
| Zo | 1 |
| Ma | 2 |
| Di | 3 |
| Wo | 4 |
| Do | 5 |
| Vr | 6 |
| Za | 7 |

Titel is `Tijd voor {naam}`; body is `Dit item staat om {HH:mm} op je planning.` Data bevat `kind: scheduled-item-reminder` en `itemId`. Dit zijn lokale meldingen zonder push-token of server.

### 9.2 Synchronisatie

De app leest alle OS-meldingen, annuleert eigen huidige `scheduled-item-reminder`- en oudere `supplement-reminder`-triggers, controleert toestemming en maakt alle geldige triggers opnieuw. Het legacytype voorkomt dubbele meldingen na upgrades.

Synchronisaties lopen via één promise-wachtrij. Bij een fout worden triggers uit de mislukte ronde verwijderd. De sleutel bevat ID, naam, categorie, tijd en gesorteerde dagen, zodat check-ins geen herplanning veroorzaken maar toevoegen, wijzigen en verwijderen wel.

### 9.3 Permissies en diagnostiek

- Android-kanaal-ID blijft `supplement-reminders`; zichtbare naam is “Geplande herinneringen”.
- Android declareert `POST_NOTIFICATIONS` en `SCHEDULE_EXACT_ALARM`.
- Het kanaal gebruikt hoge prioriteit, geluid, vibratie en groen licht.
- iOS accepteert Authorized, Provisional en Ephemeral.
- Foreground toont banner en lijst en speelt geluid.
- Geweigerde toestemming toont een waarschuwing.
- Overzicht toont de toestemming als een subtiele statusbol met Aan/Uit en kan de systeeminstellingen openen.
- Web retourneert `unsupported`.

## 10. Opslag, privacy en beveiliging

AsyncStorage bewaart de itemlijst onversleuteld. Er is geen schemaversie, migratieraamwerk, export, back-up of cloudsync. Nieuwe velden moeten optioneel en achterwaarts compatibel zijn. Opslagfouten worden alleen met `console.warn` gelogd.

Een notificatie kan de itemnaam op het vergrendelscherm tonen. Pincode `1234` staat hardcoded en is alleen een UI-drempel tegen per ongeluk verwijderen, geen beveiliging. De app is geen medisch hulpmiddel; het OS kan meldingen beïnvloeden via focus-, batterij-, alarm- en notificatie-instellingen.

## 11. Native configuratie en distributie

| Instelling | Waarde |
| --- | --- |
| Expo owner | `yourfutureteam` |
| EAS project-ID | `d040475e-4dd2-42f9-bd41-15846e0437ee` |
| iOS bundle-ID / build | `com.casper.krachtvvoeding` / `6` |
| Android package / versionCode | `com.casper.krachtvoeding` / `6` |
| Oriëntatie / thema | portrait / light |
| New Architecture | ingeschakeld |
| Runtimeversion | appversie 1.0.6 |
| Productiekanaal | `production` |

EAS gebruikt remote appversiebeheer en automatische ophoging voor productiebuilds. Plugins zijn `expo-status-bar` en `expo-notifications`. Plugin-, permissie- en andere native wijzigingen vereisen een nieuwe storebinary; een EAS Update is dan niet voldoende.

## 12. Build- en runcommando's

```powershell
npm install
npm run start
npm run android
npm run ios
npm run web
eas build --platform all --profile production
```

Lokale meldingen moeten op echte apparaten en bij voorkeur met een release- of developmentbuild worden getest.

## 13. Acceptatiecriteria

### Toevoegen

- Gepland item en To-do zijn expliciet zichtbaar en de keuze is duidelijk gemarkeerd.
- To-do start met planning Geen.
- Verplichte velden blokkeren opslaan met begrijpelijke feedback.
- Het formulier is volledig bereikbaar door te scrollen.

### To-do's

- Inhoud aantikken vinkt aan/uit en bewaart/verwijdert de timestamp.
- De prullenbakknop staat los van het vinkvlak en opent pincodebevestiging.
- Verkeerde pincode verwijdert niets; correcte pincode verwijdert alleen het gekozen item.
- Een afgeronde to-do blijft 24 uur bestaan en verdwijnt bij de eerstvolgende controle.

### Meldingen

- Voeding, supplementen en overige geplande items krijgen meldingen; to-do's niet.
- Wijzigen en verwijderen laten geen oude of dubbele triggers achter.
- De statusbol in Overzicht komt overeen met de OS-toestemming.
- De instellingenknop opent de systeeminstellingen van de app.

### Buildkwaliteit

- `npx expo install --check` meldt uitgelijnde dependencies.
- Android- en iOS-Metro-export slagen.
- Native permissies staan in de geïntrospecteerde configuratie.
- Fysieke tests dekken foreground, background, gesloten app en geweigerde toestemming.

## 14. Bekende beperkingen en technische schuld

1. To-do-week, -maand en -datum zijn labels zonder deadlinegedrag.
2. Aankomend gebruikt eenvoudige weekdaglogica en is geen chronologische kalender.
3. Het label “Supplementen” in Overzicht telt feitelijk alle geplande categorieën.
4. Algemene voortgang is niet periodegebonden en kan door historie 100% blijven.
5. De hardcoded pincode is niet instelbaar of veilig opgeslagen.
6. Navigatie heeft geen routes, deep links of schermherstel.
7. Er is geen centraal design system; stijlen staan vooral inline.
8. De app gebruikt vaste afstanden in plaats van volledige Safe Area-afhandeling.
9. Tijdzone- en zomertijdwijzigingen hebben geen expliciete migratie.
10. Meldingen blijven afgaan als een item eerder die dag al is afgevinkt.
11. Er is geen geautomatiseerde unit-, component- of end-to-end-testset.
12. Web ondersteunt niet alle mobiele functies en kan extra webdependencies vereisen.
13. De repository gebruikt SDK 56 terwijl de projectregel SDK 54-documentatie voorschrijft.

## 15. Aanbevolen vervolgstappen

Hoge prioriteit:

- unit tests voor to-do-opruiming, notificatiefilters en weekdagconversie;
- inhoudelijke validatie van week, maand en datum;
- pincode veilig instelbaar maken of verwijderen;
- opslag voorzien van schema- en migratieversies.

Daarna:

- to-do-planning echte deadline-, sorteer- en herinneringssemantiek geven;
- statistieken periodegebonden en categoriezuiver maken;
- design tokens, herbruikbare componenten en Safe Area toevoegen;
- formele navigatie en optionele export/back-up toevoegen.

## 16. Referenties

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- [Expo Notifications — SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/)
- [Expo app-configuratie — SDK 54](https://docs.expo.dev/versions/v54.0.0/config/app/)
- [Expo Notifications — SDK 56](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/)
