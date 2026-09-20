/* ---------------------------------------------------------------------------
   Forslag: to-punkts-kalibrering af albedomåling
   ---------------------------------------------------------------------------
   Erstatter den nuværende beregning, som bruger ét referencefelt og antager
   at det har albedo 70 %.

   To problemer med den nuværende metode:

   1) Det trykte referencekort angiver det hvide felt til albedo 65 %
      (pixelværdi 166/255), ikke 70 %. Alle målte albedoer bliver ~7,7 % for høje.

   2) Ét referencepunkt kan ikke fastlægge sammenhængen mellem pixelværdi og
      albedo, fordi kameraet ikke er lineært. Målt i felten (IMG_5583) gav
      kortets grå felt gråværdi 116 og det hvide 243 — forholdet 2,09 mod
      kortets forventede 1,93. Eksponering og telefonens tonekurve flytter sig
      fra billede til billede.

   Løsningen: brug BEGGE referencefelter. To kendte albedoer og to målte
   gråværdier fastlægger sammenhængen empirisk, uanset hvad kameraet har gjort.

   Kontrolmålinger på gletsjeren ved Sermilik (7. august 2026):
     nuværende metode (ét felt, 70 %)  0,253
     to-punkts potenslov              0,266
     Sentinel-2 samme flade           0,231
   --------------------------------------------------------------------------- */

// Kortets trykte felter, mørkest først. Rettes hvis kortet genoptrykkes.
// Fysisk forsvarlige ankre (aug 2026): et trykt GRÅT felt kan ikke tildeles en
// albedo (rastermønster + printerens tonekurve), men fuld toner og upåtrykt
// mat papir kan. Sort ≈ 0,05 (±0,03), hvidt kontorpapir ≈ 0,75 (±0,05).
const REFERENCE_PATCHES = [
  { albedo: 0.05, label: "sort felt" },
  { albedo: 0.75, label: "hvidt papir" },
];

/**
 * Fastlægger sammenhængen pixelværdi -> albedo ud fra referencefelterne.
 *
 * @param {number[]} grayValues  målte gråværdier, samme rækkefølge som
 *                               REFERENCE_PATCHES (mørkest først)
 * @returns {{toAlbedo:(v:number)=>number, mode:string, range:[number,number]}}
 */
function buildCalibration(grayValues) {
  const n = Math.min(grayValues.length, REFERENCE_PATCHES.length);

  // To eller flere referencefelter: potenslov gennem de to yderpunkter.
  // Potensloven vælges frem for en ret linje, fordi kameraets tonekurve er
  // en potensfunktion (sRGB-gamma ~2,2) og fordi den går gennem (0,0).
  if (n >= 2) {
    const v1 = grayValues[0],
      v2 = grayValues[n - 1];
    const a1 = REFERENCE_PATCHES[0].albedo,
      a2 = REFERENCE_PATCHES[n - 1].albedo;

    if (v1 > 0 && v2 > 0 && Math.abs(v2 - v1) > 1) {
      const b = Math.log(a2 / a1) / Math.log(v2 / v1);
      const a = a1 / Math.pow(v1, b);
      return {
        toAlbedo: (v) => (v > 0 ? Math.max(0, Math.min(1, a * Math.pow(v, b))) : 0),
        mode: "to-punkts potenslov",
        range: [Math.min(v1, v2), Math.max(v1, v2)],
      };
    }
  }

  // Kun ét referencefelt: simpelt forhold. Bruger kortets 65 %, ikke 70 %.
  const vRef = grayValues[grayValues.length - 1];
  const aRef = REFERENCE_PATCHES[REFERENCE_PATCHES.length - 1].albedo;
  return {
    toAlbedo: (v) =>
      vRef > 0 ? Math.max(0, Math.min(1, (v / vRef) * aRef)) : 0,
    mode: "ét referencefelt (mindre pålideligt)",
    range: [vRef, vRef],
  };
}

/* ---------------------------------------------------------------------------
   Sådan kobles den ind i calculateCurrentMeasurement() i albedo.html.

   FØR:
     const referencePixels = getPixelValues(selections[0]);
     const expectedWhiteValue = 179;                        // 0.7 * 255
     const correctionFactor = referencePixels.averageGray / expectedWhiteValue;
     ...
     albedo: Math.min(measured / referencePixels.averageGray * 70, 100)

   EFTER: marker referencefelterne som de FØRSTE udvalg — mørkest først —
   og lad resten være måleområder.
   --------------------------------------------------------------------------- */

function calculateCurrentMeasurementV2(selections, getPixelValues) {
  const nRef = Math.min(REFERENCE_PATCHES.length, selections.length);
  if (nRef < 1 || selections.length <= nRef) return [];

  const refPixels = [];
  for (let i = 0; i < nRef; i++) refPixels.push(getPixelValues(selections[i]));
  const cal = buildCalibration(refPixels.map((p) => p.averageGray));

  const results = [];

  // Referencefelterne rapporteres med deres kendte albedo, så man kan se
  // om kalibreringen ser fornuftig ud.
  refPixels.forEach((p, i) => {
    results.push({
      area: `Reference: ${REFERENCE_PATCHES[i].label}`,
      rawPixelValue: p.averageGray,
      albedo: REFERENCE_PATCHES[i].albedo * 100,
      isReference: true,
      pixelCount: p.pixelCount,
      calibration: cal.mode,
      rgb: { r: p.averageRed, g: p.averageGreen, b: p.averageBlue },
    });
  });

  // Måleområderne
  selections.slice(nRef).forEach((sel, i) => {
    const p = getPixelValues(sel);
    const v = p.averageGray;

    // Advarsel hvis vi ekstrapolerer langt uden for referencefelternes område.
    // Kortets felter (34 % og 65 %) daekker ikke mørk is, så det sker ofte.
    let note = null;
    if (v < cal.range[0] * 0.7) note = "under referencefelterne — usikker";
    else if (v > cal.range[1] * 1.3) note = "over referencefelterne — usikker";

    results.push({
      area: sel.label || `Måleområde ${i + 1}`,
      rawPixelValue: v,
      albedo: cal.toAlbedo(v) * 100,
      isReference: false,
      pixelCount: p.pixelCount,
      calibration: cal.mode,
      note,
      rgb: { r: p.averageRed, g: p.averageGreen, b: p.averageBlue },
    });
  });

  return results;
}

/* ---------------------------------------------------------------------------
   Anbefaling til kortet ved næste optryk

   Kortets to felter (34 % og 65 %) ligger begge OVER mørk gletsjeris, som
   måler gråværdi 45-110 i felten. Man ekstrapolerer altså nedad, hvor
   usikkerheden er størst.

   Tilføj et tredje felt omkring 10 %, så kalibreringen dækker hele det
   interval man faktisk måler i. Så kan buildCalibration() desuden fitte
   gennem tre punkter i stedet for to.
   --------------------------------------------------------------------------- */

export { REFERENCE_PATCHES, buildCalibration, calculateCurrentMeasurementV2 };
