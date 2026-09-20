import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text } from "react-konva";
import * as XLSX from "xlsx";

const SimpleAlbedo = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [image, setImage] = useState(null);
  const [selections, setSelections] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [savedMeasurements, setSavedMeasurements] = useState([]);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [areaName, setAreaName] = useState("");

  // Referencekortets trykte felter, mørkest først.
  // Kortet angiver 34 % og 65 % — ikke 70 %, som tidligere blev antaget.
  // Markeres begge felter, kalibreres med en potenslov gennem de to punkter,
  // hvilket fjerner kameraets eksponering og tonekurve fra regnestykket.
  // Referencefelterne kan redigeres: standard er det officielle kort
  // (sort toner ≈5 %, upåtrykt mat papir ≈75 %), men man kan bruge sit eget
  // referencepapir med 1-3 felter og selv angive de officielle albedo-værdier.
  const STANDARD_PATCHES = [
    { albedo: 5, label: "sort felt" },
    { albedo: 75, label: "hvidt papir" },
  ];
  const [refPatches, setRefPatches] = useState(STANDARD_PATCHES);
  // Kalibreringen forudsætter mørkest-først; sortér altid efter albedo
  const REFERENCE_PATCHES = [...refPatches].sort((a, b) => a.albedo - b.albedo);
  const [showImageTypeDialog, setShowImageTypeDialog] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [imageType, setImageType] = useState(null); // 'satellite' or 'photo'
  const [measurementInfo, setMeasurementInfo] = useState({
    location: "",
    comments: "",
  });

  // Albedo vises som decimaltal med komma, som på satellitkortet og i vejledningen.
  // Internt regnes der i procent.
  const fmtAlbedo = (pct) => (pct / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const stageRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Lyt på resize/rotation, så layout og canvas følger med på telefon
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load image using direct Image object (more reliable)
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        // Skaler til den plads der faktisk er — på telefon hele bredden,
        // på desktop pladsen ved siden af sidepanelet. Intet minimum, så
        // billedet aldrig løber ud over en lille skærm.
        // clientWidth frem for innerWidth: innerWidth vokser med siden, hvis noget
        // løber ud over skærmen på en telefon, og så bliver billedet også for bredt.
        const skaermBredde = document.documentElement.clientWidth || window.innerWidth;
        const mobile = skaermBredde < 700;
        const maxWidth = mobile
          ? skaermBredde - 24
          : Math.max(window.innerWidth - 300 - 80, 480);
        const maxHeight = mobile
          ? window.innerHeight * 0.55
          : Math.max(window.innerHeight - 160, 400);
        const scale = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1
        );
        setStageSize({
          width: img.width * scale,
          height: img.height * scale,
        });
        setImageScale(scale);
      };
      img.onerror = (error) => {
        console.error("Image loading failed:", error);
      };
      img.src = imageUrl;
    } else {
      setImage(null);
    }
  }, [imageUrl]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingImageUrl(url);
      setImageFile(file);
      setShowImageTypeDialog(true);
    }
  };

  const handleImageTypeSelection = (type) => {
    setImageType(type);
    setShowImageTypeDialog(false);
    
    if (pendingImageUrl) {
      setImageUrl(pendingImageUrl);
      setSelections([]);
      setSavedMeasurements([]);
      
      if (type === 'satellite') {
        // Satellitbilleder er allerede reflektans-kalibrerede: albedo aflæses
        // direkte af pixelværdien (V/255). Intet referencekort — bare markér.
        alert('Satellit-tilstand: albedo aflæses direkte af pixelværdierne.\n\nForudsætter et kalibreret reflektansbillede (f.eks. Sentinel-2 fra Copernicus Browser).\n\nMarkér blot de områder du vil måle.');
      }
    }
  };

  const handleStageMouseDown = (e) => {
    if (!image) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const x = pointerPos.x - imagePosition.x;
    const y = pointerPos.y - imagePosition.y;

    // Check if click is within image bounds
    if (x >= 0 && y >= 0 && x <= image.width * imageScale && y <= image.height * imageScale) {
      setIsDrawing(true);
      setDrawingStart({ x: x / imageScale, y: y / imageScale });
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || !drawingStart || !image) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const x = (pointerPos.x - imagePosition.x) / imageScale;
    const y = (pointerPos.y - imagePosition.y) / imageScale;

    const width = x - drawingStart.x;
    const height = y - drawingStart.y;

    setCurrentRect({
      x: Math.min(drawingStart.x, x),
      y: Math.min(drawingStart.y, y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || !currentRect || !image) return;

    // Only create if big enough
    if (currentRect.width > 10 && currentRect.height > 10) {
      // De første N markeringer bliver automatisk referencefelterne (N = antal
      // felter i listen, mørkest først). Derefter er alt måleområder.
      const refCount = selections.filter((s) => s.isReference).length;
      const isReference = imageType === 'photo' && refCount < REFERENCE_PATCHES.length;
      const newSelection = {
        id: Date.now(),
        ...currentRect,
        isReference,
        areaName: isReference
          ? `Reference: ${
              (REFERENCE_PATCHES[
                selections.filter((s) => s.isReference).length
              ] || REFERENCE_PATCHES[REFERENCE_PATCHES.length - 1]).label
            }`
          : null,
      };

      if (isReference) {
        setSelections([...selections, newSelection]);
      } else {
        // For measurement areas, ask for name before adding
        setPendingSelection(newSelection);
        setShowNameDialog(true);
      }
    }

    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentRect(null);
  };

  const handleNameSubmit = () => {
    if (pendingSelection) {
      const newSelection = {
        ...pendingSelection,
        areaName: areaName.trim() || `Måleområde ${selections.length}`,
      };
      setSelections([...selections, newSelection]);
      setShowNameDialog(false);
      setAreaName("");
      setPendingSelection(null);
    }
  };

  const handleNameSkip = () => {
    if (pendingSelection) {
      const newSelection = {
        ...pendingSelection,
        areaName: `Måleområde ${selections.length}`,
      };
      setSelections([...selections, newSelection]);
      setShowNameDialog(false);
      setAreaName("");
      setPendingSelection(null);
    }
  };

  // Get pixel values from image
  const getPixelValues = (selection) => {
    if (!image) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Klam til billedets kant. Uden dette returnerer getImageData gennemsigtige
    // sorte pixels for den del af markeringen der ligger uden for billedet,
    // og de taelles med i gennemsnittet og traekker det nedad.
    const x = Math.max(0, Math.min(Math.round(selection.x), image.width - 1));
    const y = Math.max(0, Math.min(Math.round(selection.y), image.height - 1));
    const width = Math.max(1, Math.min(Math.round(selection.width), image.width - x));
    const height = Math.max(1, Math.min(Math.round(selection.height), image.height - y));

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    let totalGray = 0;
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    let pixelCount = 0;
    let saturatedCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;

      // Overeksponering: en kanal i top betyder at den sande vaerdi er ukendt
      if (r >= 250 || g >= 250 || b >= 250) saturatedCount++;

      totalGray += gray;
      totalRed += r;
      totalGreen += g;
      totalBlue += b;
      pixelCount++;
    }

    return {
      averageGray: totalGray / pixelCount,
      averageRed: totalRed / pixelCount,
      averageGreen: totalGreen / pixelCount,
      averageBlue: totalBlue / pixelCount,
      pixelCount: pixelCount,
      saturatedFraction: pixelCount > 0 ? saturatedCount / pixelCount : 0,
    };
  };

  // Calculate albedo based on reference card
  // Fælles kalibrering: bygger en pixelværdi→albedo-funktion.
  // Foto: potenslov gennem sort (5 %) og hvidt papir (75 %) — eller ét felt.
  // Satellit: direkte V/255 (billedet er allerede reflektans-kalibreret).
  const buildToAlbedo = () => {
    if (imageType === 'satellite') {
      return { toAlbedo: (v) => Math.min((v / 255) * 100, 100), mode: 'direkte (kalibreret satellitbillede)' };
    }
    const refSelections = selections.filter((sel) => sel.isReference);
    if (refSelections.length === 0) return null;
    // Parvis (målt gråværdi, kendt albedo) — i markeringsrækkefølge, som
    // følger felt-listen (mørkest først)
    const pairs = refSelections.map((r, i) => ({
      v: getPixelValues(r).averageGray,
      a: REFERENCE_PATCHES[Math.min(i, REFERENCE_PATCHES.length - 1)].albedo,
    })).filter((pt) => pt.v > 0 && pt.a > 0);
    if (pairs.length === 0) return null;
    if (pairs.length >= 2 && Math.abs(pairs[0].v - pairs[pairs.length - 1].v) > 1) {
      // Potenslov albedo = a·V^b, fittet i log-log-rum over alle felter
      // (2 felter = eksakt løsning, 3 felter = mindste kvadraters regression)
      const lx = pairs.map((pt) => Math.log(pt.v));
      const ly = pairs.map((pt) => Math.log(pt.a));
      const n = pairs.length;
      const mx = lx.reduce((q, w) => q + w, 0) / n;
      const my = ly.reduce((q, w) => q + w, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (lx[i] - mx) * (ly[i] - my); den += (lx[i] - mx) ** 2; }
      if (den > 0) {
        const b = num / den;
        const a = Math.exp(my - b * mx);
        const mode = n === 2 ? 'to referencefelter (potenslov)' : `${n} referencefelter (potenslov-fit)`;
        return { toAlbedo: (v) => (v > 0 ? Math.min(a * Math.pow(v, b), 100) : 0), mode };
      }
    }
    // Ét felt kan ikke fastlægge kameraets tonekurve, så her antages standard
    // sRGB-kodning: pixelværdierne regnes om til lysmængde, før forholdet tages.
    // Uden det overvurderes mørke flader groft (ægte 10 % → ca. 30 %).
    const srgbToLinear = (v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const last = pairs[pairs.length - 1];
    const lastLin = srgbToLinear(last.v);
    return { toAlbedo: (v) => (lastLin > 0 ? Math.min((srgbToLinear(v) / lastLin) * last.a, 100) : 0), mode: 'ét referencefelt (sRGB-lineariseret)' };
  };

  const calculateAlbedo = () => {
    const measurementSelections = selections.filter(s => !s.isReference);

    if (imageType === 'photo' && !selections.find(s => s.isReference)) {
      alert("Markér referencekortets sorte og hvide felt først — og derefter mindst ét måleområde");
      return;
    }
    if (measurementSelections.length === 0) {
      alert("Markér mindst ét måleområde");
      return;
    }

    const cal = buildToAlbedo();
    if (!cal) return;
    const { toAlbedo, mode: calMode } = cal;

    const results = [];

    // Foto: referencefelterne rapporteres med deres kendte albedo, så man kan
    // se om kalibreringen ser fornuftig ud
    if (imageType === 'photo') {
      selections.filter((sel) => sel.isReference).forEach((r, i) => {
        const p = getPixelValues(r);
        const patch = REFERENCE_PATCHES[Math.min(i, REFERENCE_PATCHES.length - 1)];
        results.push({
          area: `Reference: ${patch.label}`,
          rawPixelValue: p.averageGray,
          correctedPixelValue: p.averageGray,
          albedo: patch.albedo,
          pixelCount: p.pixelCount,
          correctionFactor: p.averageGray / patch.albedo,
          calibration: calMode,
          rgb: { r: p.averageRed, g: p.averageGreen, b: p.averageBlue },
        });
      });
    }

    // Target areas - Calculate albedo based on ratio to reference card
    // Formula: Albedo = (pixel_måleområde / pixel_reference) * 70
    measurementSelections.forEach((selection, idx) => {
      const targetPixels = getPixelValues(selection);
      const targetPixelValue = targetPixels.averageGray;
      
      const albedo = toAlbedo(targetPixelValue);
      const correctionFactor = 1;
      const correctedPixelValue = targetPixelValue;

      const areaName = selection.areaName || `Måleområde ${idx + 1}`;

      results.push({
        area: areaName,
        rawPixelValue: targetPixelValue,
        correctedPixelValue: correctedPixelValue,
        albedo: albedo,
        pixelCount: targetPixels.pixelCount,
        correctionFactor: correctionFactor,
        calibration: calMode,
        rgb: {
          r: targetPixels.averageRed,
          g: targetPixels.averageGreen,
          b: targetPixels.averageBlue,
        },
      });
    });

    return results;
  };

  // Calculate albedo for a single selection (for display on canvas)
  const calculateAlbedoForSelection = (selection) => {
    if (selection.isReference) return null;
    const cal = buildToAlbedo();
    if (!cal) return null;
    return cal.toAlbedo(getPixelValues(selection).averageGray);
  };

  const handleSaveMeasurement = () => {
    const results = calculateAlbedo();
    if (!results || results.length === 0) return;

    const measurement = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      location: measurementInfo.location,
      comments: measurementInfo.comments,
      results: results,
      selections: [...selections],
    };

    setSavedMeasurements([...savedMeasurements, measurement]);
    
    // Reset for next measurement
    setSelections([]);
    setMeasurementInfo({ location: "", comments: "" });
  };

  const handleUndoLast = () => {
    if (selections.length > 0) {
      setSelections(selections.slice(0, -1));
    }
  };

  const handleClearAll = () => {
    setSelections([]);
    setCurrentRect(null);
  };

  const handleFinishMeasurements = () => {
    if (selections.length >= 2) {
      handleSaveMeasurement();
    }
  };

  const handleExportCSV = () => {
    if (savedMeasurements.length === 0) {
      alert("Ingen gemte målinger at eksportere");
      return;
    }

    let csvContent = "Måling;Område;Albedo (%);Pixel værdi;Korrigeret pixel værdi;Antal pixels;Lokation;Kommentarer;Tidspunkt\n";

    savedMeasurements.forEach((measurement, idx) => {
      measurement.results.forEach((result) => {
        // Use comma as decimal separator and semicolon as field delimiter
        const albedo = result.albedo.toFixed(2).replace(".", ",");
        const rawPixel = result.rawPixelValue.toFixed(2).replace(".", ",");
        const correctedPixel = result.correctedPixelValue.toFixed(2).replace(".", ",");
        csvContent += `${idx + 1};${result.area};${albedo};${rawPixel};${correctedPixel};${result.pixelCount};${measurement.location || ""};${measurement.comments || ""};${measurement.timestamp}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `albedo_målinger_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (savedMeasurements.length === 0) {
      alert("Ingen gemte målinger at eksportere");
      return;
    }

    const wsData = [
      [
        "Måling",
        "Område",
        "Albedo (%)",
        "Pixel værdi",
        "Korrigeret pixel værdi",
        "Antal pixels",
        "Lokation",
        "Kommentarer",
        "Tidspunkt",
      ],
    ];

    savedMeasurements.forEach((measurement, idx) => {
      measurement.results.forEach((result) => {
        wsData.push([
          idx + 1,
          result.area,
          result.albedo.toFixed(2),
          result.rawPixelValue.toFixed(2),
          result.correctedPixelValue.toFixed(2),
          result.pixelCount,
          measurement.location || "",
          measurement.comments || "",
          measurement.timestamp,
        ]);
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Albedo Målinger");
    XLSX.writeFile(wb, `albedo_målinger_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(248, 250, 252, 0.6) 0%, rgba(226, 232, 240, 0.6) 50%, rgba(203, 213, 225, 0.6) 100%), url('https://earth.org/wp-content/uploads/2020/08/Webp.net-resizeimage-2020-08-21T120227.985.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        color: "#1e293b",
        lineHeight: 1.6,
      }}
    >
      {/* Header med jordkloden */}
      <header
        style={{
          background: "linear-gradient(135deg, #F8F9FA 0%, #E8F4FD 50%, #D6EBFD 100%)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          borderBottom: "1px solid #E9ECEF",
          position: "relative",
          zIndex: 100,
          padding: "0.75rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            // På telefon skal knapperne ned under titlen — ellers løber de ud over
            // skærmen, og siden bliver bredere end telefonen.
            flexWrap: "wrap",
            gap: isMobile ? "10px" : "1rem",
            width: "100%",
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ fontSize: isMobile ? "2.4rem" : "3.75rem", lineHeight: 1 }}>🌍</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              <h1
                style={{
                  color: "#2C3E50",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  margin: 0,
                  padding: 0,
                  lineHeight: 1.1,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                }}
              >
                Albedomåling
              </h1>
              <p
                style={{
                  color: "#495057",
                  fontSize: "0.9rem",
                  margin: 0,
                  padding: 0,
                  fontWeight: 400,
                }}
              >
                Mål albedo fra foto eller satellitbillede
              </p>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6C757D",
                  fontWeight: 400,
                  display: "inline-block",
                  marginTop: "4px",
                  opacity: 0.7,
                }}
              >
                v3.0
              </div>
            </div>
          </div>
          {imageUrl && (
            <div style={{ display: "flex", gap: isMobile ? "6px" : "10px", alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <button
                onClick={handleUndoLast}
                disabled={selections.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: selections.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Fortryd sidste
              </button>
              <button
                onClick={handleFinishMeasurements}
                disabled={selections.length < 2}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: selections.length < 2 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Afslut opmålinger
              </button>
              <button
                onClick={handleClearAll}
                disabled={selections.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: selections.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Ryd alt
              </button>
              {savedMeasurements.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Eksporter CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Eksporter Excel
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setImageUrl(null);
                  setImageFile(null);
                  setSelections([]);
                  setSavedMeasurements([]);
                  setMeasurementInfo({ location: "", comments: "" });
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Upload nyt billede
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", width: "100%", minHeight: "calc(100vh - 120px)" }}>

      {!imageUrl ? (
        <div
          style={{
            width: "100%",
            padding: isMobile ? "16px" : "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div style={{ maxWidth: "560px", width: "100%", backgroundColor: "rgba(255,255,255,0.94)", padding: isMobile ? "18px" : "28px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem", color: "#0A0F3C" }}>Sådan måler du albedo</h2>
            <ol style={{ margin: "0 0 16px", paddingLeft: "1.3rem", lineHeight: 1.6, fontSize: "0.98rem" }}>
              <li>Læg <a href="/sermilik/undervisning/referencekort.html">referencekortet</a> på overfladen, og tag et foto <b>lige ned ovenfra</b>.</li>
              <li>Læg fotoet ind herunder.</li>
              <li>Markér kortets <b>sorte</b> felt, så det <b>hvide</b> — og til sidst den overflade, du vil måle.</li>
            </ol>
            <div
              style={{
                border: "2px dashed #9aa5b1",
                padding: isMobile ? "22px 12px" : "30px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
              }}
              onClick={() => document.getElementById("imageUpload").click()}
            >
              <p style={{ fontSize: "1.6rem", margin: "0 0 6px" }}>📷</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{isMobile ? "Tryk for at tage eller vælge et foto" : "Klik for at vælge et foto — eller træk det hertil"}</p>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
            <p style={{ margin: "14px 0 0", fontSize: "0.85rem", color: "#555" }}>
              <b>Albedo</b> er et tal mellem 0 og 1: hvor stor en del af sollyset en overflade kaster tilbage.
              Sne omkring 0,85 · asfalt omkring 0,10.{" "}
              <a href="/sermilik/undervisning/oevelsesvejledning.html">Øvelsesvejledningen</a>
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar til venstre */}
          <div
            style={{
              width: isMobile ? "100%" : "300px",
              backgroundColor: "#f9fafb",
              borderRight: isMobile ? "none" : "1px solid #e5e7eb",
              borderBottom: isMobile ? "1px solid #e5e7eb" : "none",
              padding: isMobile ? "14px 16px" : "20px",
              overflowY: isMobile ? "visible" : "auto",
              height: isMobile ? "auto" : "calc(100vh - 120px)",
              order: isMobile ? 2 : 0,
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Sådan gør du:</h3>
              {imageType === 'photo' ? (
                <ol style={{ marginLeft: "20px", fontSize: "0.9rem" }}>
                  {REFERENCE_PATCHES.map((patch, i) => (
                    <li key={i} style={{ marginBottom: "8px" }}>
                      Markér <strong>{patch.label}</strong> (albedo {patch.albedo} %)
                    </li>
                  ))}
                  <li style={{ marginBottom: "8px" }}>
                    Markér derefter dine <strong>måleområder</strong>
                  </li>
                </ol>
              ) : (
                <ol style={{ marginLeft: "20px", fontSize: "0.9rem" }}>
                  <li style={{ marginBottom: "8px" }}>
                    Markér de <strong>områder</strong> du vil måle — albedo aflæses
                    direkte af pixelværdierne
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Brug et <strong>kalibreret reflektansbillede</strong>, fx
                    Sentinel-2 fra Copernicus Browser
                  </li>
                </ol>
              )}
            </div>

            {imageType === 'photo' && (
              <details style={{ marginBottom: "16px", padding: "10px 12px", backgroundColor: "#fafaf4", borderRadius: 0, border: "1px solid #e3dfc8" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                  Avanceret: eget referencekort
                </summary>
                <p style={{ margin: "8px 0", fontWeight: 600, fontSize: "0.9rem" }}>
                  Referencefelter <span style={{ fontWeight: 400, color: "#666" }}>(officiel albedo i %)</span>
                </p>
                {refPatches.map((patch, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                    <input
                      type="text"
                      value={patch.label}
                      onChange={(e) => {
                        const next = [...refPatches];
                        next[i] = { ...next[i], label: e.target.value };
                        setRefPatches(next);
                      }}
                      style={{ flex: 1, minWidth: 0, padding: "5px 8px", border: "1px solid #ccc", borderRadius: 0, fontSize: "0.85rem" }}
                    />
                    <input
                      type="number" min="1" max="99" step="1"
                      value={patch.albedo}
                      onChange={(e) => {
                        const next = [...refPatches];
                        next[i] = { ...next[i], albedo: Math.max(1, Math.min(99, Number(e.target.value) || 0)) };
                        setRefPatches(next);
                      }}
                      style={{ width: "58px", padding: "5px 6px", border: "1px solid #ccc", borderRadius: 0, fontSize: "0.85rem", textAlign: "right" }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>%</span>
                    {refPatches.length > 1 && (
                      <button
                        onClick={() => setRefPatches(refPatches.filter((_, j) => j !== i))}
                        title="Fjern felt"
                        style={{ border: "none", background: "none", color: "#b04040", cursor: "pointer", fontSize: "1rem", padding: "0 2px" }}
                      >✕</button>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  {refPatches.length < 3 && (
                    <button
                      onClick={() => setRefPatches([...refPatches, { albedo: 34, label: `felt ${refPatches.length + 1}` }])}
                      style={{ padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #999", borderRadius: 0, background: "#fff", cursor: "pointer" }}
                    >+ felt</button>
                  )}
                  <button
                    onClick={() => setRefPatches(STANDARD_PATCHES)}
                    style={{ padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #999", borderRadius: 0, background: "#fff", cursor: "pointer" }}
                  >standardkort</button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#777" }}>
                  Standard er det officielle kort (sort 5 %, hvidt papir 75 %). Bruger du
                  eget referencepapir, så ret felterne — markér dem altid mørkest først.
                </p>
              </details>
            )}
            {/* «Markér nu»-prompten står nu i guide-striben over billedet */}

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: 600, marginBottom: "8px" }}>
                Markeringer: {selections.length}
              </p>
              {selections.length === 0 && (
                <p style={{ fontSize: "0.85rem", color: "#dc2626", margin: 0 }}>
                  ⚠ {imageType === 'photo' ? `Start med det mørkeste referencefelt (${REFERENCE_PATCHES[0].label})` : 'Markér et område på billedet'}
                </p>
              )}
              {selections.length > 0 && selections.find(s => s.isReference) && (
                <p style={{ fontSize: "0.85rem", color: "#059669", margin: 0 }}>
                  ✓ Referencekort markeret ({selections.filter(s => !s.isReference).length} måleområde{selections.filter(s => !s.isReference).length !== 1 ? "r" : ""})
                </p>
              )}
              {selections.length > 0 && !selections.find(s => s.isReference) && (
                <p style={{ fontSize: "0.85rem", color: "#dc2626", margin: 0 }}>
                  ⚠ Du skal have et referencekort!
                </p>
              )}
            </div>

            {/* Oplysninger for måling */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "15px",
                borderRadius: 0,
                marginBottom: "20px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "1rem" }}>Oplysninger</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Lokation/Sted:</label>
                  <input
                    type="text"
                    value={measurementInfo.location}
                    onChange={(e) =>
                      setMeasurementInfo({
                        ...measurementInfo,
                        location: e.target.value,
                      })
                    }
                    style={{ width: "100%", padding: "6px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Kommentarer:</label>
                  <textarea
                    value={measurementInfo.comments}
                    onChange={(e) =>
                      setMeasurementInfo({
                        ...measurementInfo,
                        comments: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "0.85rem",
                      minHeight: "60px",
                      border: "1px solid #d1d5db",
                      borderRadius: 0,
                      resize: "vertical",
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveMeasurement}
                  disabled={selections.length < 2}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: 0,
                    cursor: selections.length < 2 ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                >
                  Gem måling
                </button>
              </div>
            </div>

            {/* Gemte målinger */}
            {savedMeasurements.length > 0 && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "1rem" }}>Gemte målinger</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {savedMeasurements.map((measurement, idx) => (
                    <div
                      key={measurement.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "10px",
                        borderRadius: 0,
                        backgroundColor: "white",
                        fontSize: "0.85rem",
                      }}
                    >
                      <strong>Måling {idx + 1}</strong>
                      {measurement.location && (
                        <p style={{ margin: "4px 0", fontSize: "0.8rem" }}>{measurement.location}</p>
                      )}
                      <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#059669" }}>
                        {measurement.results.filter(r => !r.area.includes("reference")).length} område{measurement.results.filter(r => !r.area.includes("reference")).length !== 1 ? "r" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hovedindhold - billede og målinger */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px", padding: isMobile ? "12px" : "20px", overflow: "hidden" }}>
            {/* Guide: det næste skridt — og resultaterne — står lige over billedet */}
            {(() => {
              const refCount = selections.filter((sel) => sel.isReference).length;
              const maalinger = selections.filter((sel) => !sel.isReference);
              const iAlt = imageType === 'photo' ? REFERENCE_PATCHES.length + 1 : 1;
              let trin = null;
              if (imageType === 'photo' && refCount < REFERENCE_PATCHES.length) {
                trin = <>Trin {refCount + 1} af {iAlt}: Træk en firkant på <b>{REFERENCE_PATCHES[refCount].label}</b> på referencekortet</>;
              } else if (maalinger.length === 0) {
                trin = <>Trin {iAlt} af {iAlt}: Træk en firkant på den <b>overflade, du vil måle</b></>;
              }
              return (
                <div style={{ border: "1px solid #0A0F3C", backgroundColor: "#fff" }}>
                  {trin && (
                    <div style={{ backgroundColor: "#0A0F3C", color: "#fff", padding: "10px 14px", fontSize: "0.95rem" }}>{trin}</div>
                  )}
                  {maalinger.length > 0 && (
                    <div style={{ padding: "10px 14px" }}>
                      {maalinger.map((sel, i) => {
                        const a = calculateAlbedoForSelection(sel);
                        if (a === null) return null;
                        return (
                          <div key={sel.id} style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", padding: "4px 0", borderTop: i ? "1px solid #e5e7eb" : "none" }}>
                            <span style={{ fontWeight: 600, minWidth: "7rem" }}>{sel.areaName || `Måleområde ${i + 1}`}</span>
                            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0A0F3C", fontVariantNumeric: "tabular-nums" }}>{fmtAlbedo(a)}</span>
                            <span style={{ fontSize: "0.85rem", color: "#555" }}>kaster {Math.round(a)} % af lyset tilbage, beholder {100 - Math.round(a)} %</span>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "6px" }}>
                        Træk flere firkanter for at måle flere overflader. Notér tallene — eller tryk «Gem måling» nederst.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", minWidth: 0 }}>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 0,
                overflow: "hidden",
                flex: "1",
              }}
            >
              <Stage
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onTouchStart={handleStageMouseDown}
              onTouchMove={handleStageMouseMove}
              onTouchEnd={handleStageMouseUp}
              style={{ touchAction: "none" }}
              ref={stageRef}
            >
              <Layer>
                {image && (
                  <KonvaImage
                    image={image}
                    x={imagePosition.x}
                    y={imagePosition.y}
                    scaleX={imageScale}
                    scaleY={imageScale}
                  />
                )}
                {selections.map((selection, idx) => {
                  if (false) {
                    return null;
                  }

                  // Regular selection rendering
                  return (
                    <React.Fragment key={selection.id}>
                      <Rect
                        x={selection.x * imageScale + imagePosition.x}
                        y={selection.y * imageScale + imagePosition.y}
                        width={selection.width * imageScale}
                        height={selection.height * imageScale}
                        stroke={selection.isReference ? "#ff0000" : "#4a90e2"}
                        strokeWidth={2}
                        fill={
                          selection.isReference
                            ? "rgba(255, 0, 0, 0.1)"
                            : "rgba(74, 144, 226, 0.1)"
                        }
                      />
                      {selection.isReference && !selection.isStandard && (
                        <Text
                          x={selection.x * imageScale + imagePosition.x}
                          y={Math.max(selection.y * imageScale + imagePosition.y - 17, 2)}
                          text={(selection.areaName || "reference").replace("Reference: ", "")}
                          fontSize={13}
                          fontFamily="Arial"
                          fontStyle="bold"
                          fill="#ffffff"
                          shadowColor="#000000"
                          shadowBlur={4}
                          shadowOpacity={0.9}
                        />
                      )}
                      {!selection.isReference && (() => {
                        const albedo = calculateAlbedoForSelection(selection);
                        const displayText = selection.areaName
                          ? `${selection.areaName}\n${albedo !== null ? fmtAlbedo(albedo) : ''}`
                          : (albedo !== null ? fmtAlbedo(albedo) : '');
                        return displayText ? (
                          <Text
                            x={selection.x * imageScale + imagePosition.x}
                            y={selection.y * imageScale + imagePosition.y}
                            width={selection.width * imageScale}
                            height={selection.height * imageScale}
                            text={displayText}
                            fontSize={15}
                            fontFamily="Arial"
                            fill="#ffffff"
                            shadowColor="#000000"
                            shadowBlur={5}
                            shadowOpacity={0.95}
                            align="center"
                            verticalAlign="middle"
                            fontStyle="bold"
                          />
                        ) : null;
                      })()}
                    </React.Fragment>
                  );
                })}
                {currentRect && !showNameDialog && (
                  <Rect
                    x={currentRect.x * imageScale + imagePosition.x}
                    y={currentRect.y * imageScale + imagePosition.y}
                    width={currentRect.width * imageScale}
                    height={currentRect.height * imageScale}
                    stroke="#4a90e2"
                    strokeWidth={2}
                    dash={[5, 5]}
                    fill="rgba(74, 144, 226, 0.1)"
                  />
                )}
                {currentRect && showNameDialog && (
                  <Rect
                    x={currentRect.x * imageScale + imagePosition.x}
                    y={currentRect.y * imageScale + imagePosition.y}
                    width={currentRect.width * imageScale}
                    height={currentRect.height * imageScale}
                    stroke="#4a90e2"
                    strokeWidth={2}
                    fill="rgba(74, 144, 226, 0.1)"
                  />
                )}
              </Layer>
            </Stage>
            </div>

            {/* Detaljerede målinger til højre */}
            {savedMeasurements.length > 0 && (
              <div style={{ flex: isMobile ? "1 1 auto" : "0 0 500px", overflowY: "auto", maxHeight: isMobile ? "none" : "calc(100vh - 160px)" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: 0, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ marginTop: 0 }}>Detaljerede resultater</h3>
                  {savedMeasurements.map((measurement, idx) => (
                    <div
                      key={measurement.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: "15px",
                        marginBottom: "15px",
                        borderRadius: 0,
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <h4 style={{ marginTop: 0 }}>Måling {idx + 1}</h4>
                      {measurement.location && (
                        <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                          <strong>Lokation:</strong> {measurement.location}
                        </p>
                      )}
                      {measurement.comments && (
                        <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                          <strong>Kommentarer:</strong> {measurement.comments}
                        </p>
                      )}
                      <div style={{ marginTop: "12px" }}>
                        <h5 style={{ marginTop: 0, marginBottom: "10px", fontSize: "0.95rem" }}>Resultater:</h5>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.85rem",
                            marginBottom: "15px",
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: "#f0f0f0" }}>
                              <th style={{ padding: "6px", textAlign: "left", border: "1px solid #ddd" }}>
                                Område
                              </th>
                              <th style={{ padding: "6px", textAlign: "left", border: "1px solid #ddd" }}>
                                Albedo (%)
                              </th>
                              <th style={{ padding: "6px", textAlign: "left", border: "1px solid #ddd" }}>
                                Pixel værdi
                              </th>
                              <th style={{ padding: "6px", textAlign: "left", border: "1px solid #ddd" }}>
                                Korrigeret
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {measurement.results.map((result, rIdx) => (
                              <tr key={rIdx}>
                                <td style={{ padding: "6px", border: "1px solid #ddd" }}>{result.area}</td>
                                <td style={{ padding: "6px", border: "1px solid #ddd", fontWeight: 600, color: "#059669" }}>
                                  {result.albedo.toFixed(2)}%
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                                  {result.rawPixelValue.toFixed(2)}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                                  {result.correctedPixelValue.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: 0, border: "1px solid #bae6fd" }}>
                        <h5 style={{ marginTop: 0, marginBottom: "10px", fontSize: "0.95rem", color: "#1e40af" }}>Beregninger:</h5>
                        {measurement.results.map((result, rIdx) => {
                          if (result.area.includes("referencekort") || result.area.includes("Reference")) {
                            return (
                              <div key={rIdx} style={{ marginTop: "10px", padding: "8px", backgroundColor: "white", borderRadius: 0, fontSize: "0.85rem" }}>
                                <strong style={{ color: "#dc2626" }}>{result.area}:</strong>
                                <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "0.8rem", color: "#374151" }}>
                                  <div>Pixel værdi: <strong>{result.rawPixelValue.toFixed(2)}</strong></div>
                                  <div style={{ marginTop: "4px", color: "#059669", fontWeight: 600 }}>Kendt albedo: {result.albedo}% (referencefelt)</div>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={rIdx} style={{ marginTop: "10px", padding: "8px", backgroundColor: "white", borderRadius: 0, fontSize: "0.85rem" }}>
                                <strong style={{ color: "#1e40af" }}>{result.area}:</strong>
                                <div style={{ marginTop: "4px", marginLeft: "8px", fontSize: "0.8rem", color: "#374151" }}>
                                  <div>Pixel værdi: <strong>{result.rawPixelValue.toFixed(2)}</strong></div>
                                  <div>Kalibrering: <strong>{result.calibration || "—"}</strong></div>
                                  <div>Albedo: <strong>{fmtAlbedo(result.albedo)}</strong> ({result.albedo.toFixed(1)} %)</div>
                                  <div style={{ marginTop: "4px", color: "#059669", fontWeight: 600 }}>Resultat: {result.albedo.toFixed(2)}% albedo</div>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </>
      )}

      {showImageTypeDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: 0,
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "15px" }}>Vælg billedtype</h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Hvad er det for et billede?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <button
                onClick={() => handleImageTypeSelection('photo')}
                style={{
                  padding: "15px 20px",
                  backgroundColor: "#0A0F3C",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                📷 Selvtaget foto
                <div style={{ fontSize: "0.85rem", fontWeight: 400, marginTop: "5px", opacity: 0.9 }}>
                  Mit eget foto med referencekortet i billedet — det skal du vælge, hvis du har målt i skolegården
                </div>
              </button>
              <button
                onClick={() => handleImageTypeSelection('satellite')}
                style={{
                  padding: "15px 20px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                🛰️ Satellitbillede
                <div style={{ fontSize: "0.85rem", fontWeight: 400, marginTop: "5px", opacity: 0.9 }}>
                  Et satellitbillede uden referencekort (fx Sentinel-2 fra Copernicus Browser)
                </div>
              </button>
            </div>
          </div>
        </div>
      )}


      {showNameDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: 0,
              minWidth: "300px",
            }}
          >
            <h3>Navngiv måleområde</h3>
            <input
              type="text"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Indtast navn eller lad stå tomt for automatisk nummerering"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                marginBottom: "10px",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleNameSubmit();
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleNameSkip}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ccc",
                  color: "black",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                Spring over
              </button>
              <button
                onClick={handleNameSubmit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SimpleAlbedo;

