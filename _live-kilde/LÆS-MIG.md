# Live-kildekoden, gendannet fra sourcemap

## Hvor den kom fra

Appen på **https://geo.sg.dk/albedo** bygges ikke fra `src/App.jsx` i dette repo.
Den bygges fra **`src/SimpleApp.jsx`** og **`src/components/SimpleAlbedo.jsx`** —
to filer der ikke findes i repoet.

Det blev afgjort sådan:

| Spor | Resultat |
|---|---|
| Live-titel | "Albedo Måling - Simpel Version" — findes ingen steder i repoet |
| `index.html` i repoet | Titel "React Version", peger på `src/main.jsx` → `App.jsx` |
| `albedo.html` | Titel "Albedoberegner", helt anden brugerflade |
| Live-bundlens sourcemap | `sources: ["../../src/SimpleApp.jsx", "../../src/components/SimpleAlbedo.jsx"]` |

Vite bygger med `sourcemap: true`, så `index-DNB617nP.js.map` lå offentligt
tilgængelig og indeholdt den fulde kildekode i `sourcesContent`. Filerne her er
udtrukket derfra — det er altså **præcis** den kode der kører live.

## Hvad der mangler før den kan bygges

`src/main.jsx` importerer `App.jsx`, ikke `SimpleApp.jsx`. Køres `npm run build`
som repoet står nu, bygges den *forkerte* app. For at reproducere live skal
enten `main.jsx` pege på `SimpleApp`, eller `index.html` have en anden indgang.

**Det er ikke ændret her** — filerne ligger i `_live-kilde/` og rører ikke repoet.

## Ændringer der er lavet i `components/SimpleAlbedo.jsx`

### 1. To-punkts-kalibrering (hovedrettelsen)

**Før:** ét referencefelt, hårdkodet til albedo 70 %.

```js
const referenceAlbedo = 70;
const albedo = Math.min((targetPixelValue / referencePixelValue) * referenceAlbedo, 100);
```

To problemer: det trykte kort angiver **65 %**, ikke 70 (alle albedoer blev
~7,7 % for høje). Og ét punkt kan ikke fastlægge sammenhængen mellem pixelværdi
og albedo, fordi kameraets eksponering og tonekurve skifter fra billede til billede.

**Efter:** markeres begge felter på kortet (mørkest først), fittes en potenslov
gennem de to punkter. Markeres kun ét, bruges det simple forhold — men med 65 %.

```js
const REFERENCE_PATCHES = [
  { albedo: 34, label: "gråt felt" },
  { albedo: 65, label: "hvidt felt" },
];
```

Kontrolleret mod felt-foto (IMG_5583, kortet målte 116 og 243):

| | Typisk gletsjeroverflade |
|---|---|
| Gammel metode (70 %) | 25,3 % |
| Ét felt med 65 % | 23,5 % |
| To felter, potenslov | 26,6 % |
| *Sentinel-2 samme flade* | *23,1 %* |

Kalibreringen reproducerer kortets egne værdier præcist (34,0 % og 65,0 %).

### 2. Markeringen klemmes til billedets kant

`ctx.getImageData()` returnerer gennemsigtige sorte pixels for den del af en
markering der ligger uden for billedet — og de blev talt med i gennemsnittet.
En markering trukket ud over kanten gav derfor for lav albedo.

### 3. Advarsel ved overeksponeret referencefelt

Er kortet blæst ud, er den sande gråværdi højere end 255, og alle målinger
bliver for høje. I felt-fotoet målte det hvide felt **243 af 255** — tæt på.
Nu advares hvis mere end 2 % af pixels i et referencefelt er i top.

## Observationer der ikke er ændret

**Gråværdien er et rent RGB-gennemsnit** `(r+g+b)/3`. Den tidligere
`albedo.html` brugte Rec.601-luma `0.299r + 0.587g + 0.114b`. For *albedo* er
gennemsnittet faktisk det rigtigere valg — luma vægter grønt højt fordi øjet er
følsomt der, ikke fordi der er mere energi. Ændringen var altså en forbedring.

**`getPixelValues()` tegner hele billedet på et nyt canvas ved hvert kald.** For
et 8064 × 6048-foto er det ~50 MB pr. markering. Kunne hejses ud af løkken.
Kun et hastighedsspørgsmål.

**Referencefelterne dækker ikke mørk is.** Kortets 34 % og 65 % ligger begge
over gletsjeris, som måler gråværdi 45–110 i felten, så man ekstrapolerer nedad
hvor usikkerheden er størst. **Anbefaling: tilføj et felt omkring 10 % ved næste
optryk.** Koden fitter gennem to punkter, men strukturen tåler flere — udvid
blot `REFERENCE_PATCHES`.

## Og en ting mere

Sourcemaps ligger offentligt på serveren. Det er praktisk her, men det betyder
at hele kildekoden kan hentes af enhver. Vil du undgå det, sæt
`build.sourcemap: false` i `vite.config.js` — eller behold det bevidst, da det
er et undervisningsprojekt.
