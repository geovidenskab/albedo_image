# Changelog

## [v2.3] - 2025-01-15

### ✨ Nye Features
- **Interaktivt Markering System**: Klik og træk for at markere områder på billedet
- **Gul Visualisering**: Markerede områder vises med gul farve og guld kant
- **Automatisk Albedo Beregning**: Gennemsnitlig pixelværdi divideret med 256
- **Navngivning af Målinger**: Prompt for custom navne på markerede områder
- **Debug Logging**: Detaljerede logs for fejlfinding af markering systemet

### 🔧 Forbedringer
- Markering er nu aktiveret som standard når applikationen starter
- Forbedret brugervejledning med klare instruktioner
- Bedre visuelt feedback med emojis og farver
- Automatisk reference felt oprettelse for albedo beregninger

### 🐛 Bug Fixes
- Rettet problem hvor markering systemet ikke var aktiveret som standard
- Forbedret koordinat konvertering mellem stage og billede
- Rettet mouse event håndtering for markering

### 📊 Tekniske Detaljer
- `isMeasurementActive` sat til `true` som standard
- Tilføjet debug logs til mouse down, move og up events
- Forbedret billede bounds tjek for markering
- Opdateret albedo beregning formel til gennemsnitlig pixelværdi / 256

## [v2.2] - Tidligere version
- Grundlæggende React implementation
- Reference felter system
- Multi-år undersøgelser
- Data persistence

---

**Version 2.3** introducerer det komplette interaktive markering system der gør det muligt for brugere at markere områder direkte på billedet, beregne albedo automatisk, og gemme målinger med custom navne.
