# Albedo Måling - React Version

En avanceret albedo målingsapplikation bygget med React, der gør det muligt at analysere satellitbilleder og beregne albedo værdier.

## 🚀 Nye Features

### Eksisterende Features (migreret fra vanilla JS)
- ✅ Billede upload og visning
- ✅ Grayscale toggle
- ✅ Koordinat system
- ✅ Albedo beregninger
- ✅ Excel export
- ✅ Undo/Redo funktionalitet

### Nye Features
- 🔄 **Reference Felter**: Definer reference områder med kendte albedo værdier
- 📈 **Multi-år Undersøgelser**: Sammenlign albedo over tid
- 🛰️ **Copernicus Integration**: Hent satellitbilleder direkte fra Copernicus API
- 📊 **Timeline View**: Visualiser udvikling i albedo over tid
- 💾 **Data Persistence**: Automatisk gemning af undersøgelser
- 🎨 **Modern UI**: Baseret på dewpoint design system
- ✨ **Interaktivt Markering System**: Klik og træk for at markere områder med gul farve
- 🧮 **Automatisk Albedo Beregning**: Gennemsnitlig pixelværdi divideret med 256
- 🏷️ **Navngivning af Målinger**: Prompt for custom navne på markerede områder

## 🛠️ Installation

1. **Installer dependencies:**
```bash
npm install
```

2. **Start udviklingsserver:**
```bash
npm run dev
```

3. **Åbn browser:**
```
http://localhost:3000
```

## 📁 Projekt Struktur

```
src/
├── components/          # React komponenter
│   ├── Header.jsx
│   ├── MainMenu.jsx
│   ├── InvestigationWorkspace.jsx
│   ├── ImageUploader.jsx
│   ├── CanvasEditor.jsx
│   ├── ReferenceFieldManager.jsx
│   ├── MeasurementPanel.jsx
│   ├── ResultsPanel.jsx
│   ├── ResultsOverview.jsx
│   └── TimelineView.jsx
├── hooks/              # Custom React hooks
│   ├── useInvestigation.js
│   ├── useLocalStorage.js
│   ├── useCanvas.js
│   └── useCoordinates.js
├── utils/              # Utility funktioner
│   ├── albedoCalculations.js
│   ├── coordinateUtils.js
│   └── copernicusAPI.js
├── styles/             # CSS styling
│   └── index.css
├── App.jsx             # Hovedkomponent
└── main.jsx           # Entry point
```

## 🧪 Test

Kør test scriptet for at verificere funktionalitet:

```bash
# Test nuværende vanilla JS version
node test-albedo.js

# Test React version (kommer snart)
npm test
```

## 🎨 Design System

Applikationen bruger dewpoint design system med:
- **Farver**: Gradient baseret på dewpoint paletten
- **Typografi**: Arial Black for overskrifter
- **Knapper**: Gradient knapper med hover effekter
- **Layout**: Grid baseret layout med kort

## 🔧 Teknologier

- **React 18** - UI framework
- **Vite** - Build tool
- **Konva.js** - Canvas manipulation
- **React-Konva** - React canvas bindings
- **Recharts** - Data visualization
- **Leaflet** - Maps
- **Papa Parse** - CSV handling
- **SheetJS** - Excel export

## 📊 Data Struktur

### Investigation
```javascript
{
  id: string,
  name: string,
  year: number,
  location: {
    lat: number,
    lng: number,
    name: string
  },
  image: {
    url: string,
    dimensions: { width: number, height: number }
  },
  referenceFields: ReferenceField[],
  measurements: Measurement[],
  createdAt: string
}
```

### ReferenceField
```javascript
{
  id: string,
  position: { x: number, y: number },
  size: { width: number, height: number },
  albedoValue: number,
  description: string
}
```

## 🚀 Roadmap

### Phase 1: Core Migration ✅
- [x] React setup
- [x] Basic components
- [x] Design system
- [x] Data persistence

### Phase 2: Canvas Implementation ✅
- [x] Konva.js integration
- [x] Coordinate system
- [x] Selection tools
- [x] Grayscale toggle
- [x] Interactive marking system
- [x] Albedo calculation
- [x] Visual feedback with yellow rectangles

### Phase 3: New Features 📋
- [ ] Reference field management
- [ ] Multi-year investigations
- [ ] Timeline visualization
- [ ] Copernicus API integration

### Phase 4: Advanced Features 🔮
- [ ] Advanced analytics
- [ ] Export improvements
- [ ] Performance optimization
- [ ] Mobile responsiveness

## 🤝 Bidrag

1. Fork projektet
2. Opret feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push til branch (`git push origin feature/AmazingFeature`)
5. Åbn Pull Request

## 📄 Licens

Dette projekt er licenseret under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 👥 Credits

- **Silkeborg Gymnasium** - Original koncept
- **Dewpoint Design System** - UI inspiration
- **Copernicus Programme** - Satellit data
