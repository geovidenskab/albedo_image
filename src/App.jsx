import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import InvestigationWorkspace from "./components/InvestigationWorkspace";
import ResultsOverview from "./components/ResultsOverview";
import { useInvestigation } from "./hooks/useInvestigation";
import { useLocalStorage } from "./hooks/useLocalStorage";

function App() {
  const [currentView, setCurrentView] = useState("mainMenu");
  const [currentInvestigation, setCurrentInvestigation] = useState(null);

  const {
    investigations,
    addInvestigation,
    updateInvestigation,
    deleteInvestigation,
    saveInvestigations,
  } = useInvestigation();

  // Debug logging for investigations
  console.log("App - investigations:", investigations);
  console.log("App - currentInvestigation:", currentInvestigation);

  // Sync currentInvestigation with updated investigations
  useEffect(() => {
    if (currentInvestigation && investigations.length > 0) {
      const updatedInvestigation = investigations.find(
        (inv) => inv.id === currentInvestigation.id
      );
      if (
        updatedInvestigation &&
        updatedInvestigation !== currentInvestigation
      ) {
        console.log("App - Syncing currentInvestigation with updated data");
        setCurrentInvestigation(updatedInvestigation);
      }
    }
  }, [investigations, currentInvestigation]);

  // Set first investigation as current if none is selected
  useEffect(() => {
    if (!currentInvestigation && investigations.length > 0) {
      console.log("App - Setting first investigation as current");
      setCurrentInvestigation(investigations[0]);
    }
  }, [investigations, currentInvestigation]);

  // Note: Auto-save is handled by useInvestigation hook

  const handleNewInvestigation = () => {
    const name = window.prompt(
      "Indtast navn for undersøgelsen:",
      `Undersøgelse ${investigations.length + 1}`
    );

    if (name === null) {
      // User cancelled
      return;
    }

    if (name.trim() === "") {
      alert("Navnet kan ikke være tomt");
      return;
    }

    const newInvestigation = {
      id: Date.now().toString(),
      name: name.trim(),
      year: new Date().getFullYear(),
      location: {
        lat: 56.1572,
        lng: 10.2107,
        name: "Aarhus",
      },
      image: null,
      referenceFields: [],
      measurements: [],
      createdAt: new Date().toISOString(),
    };

    addInvestigation(newInvestigation);
    setCurrentInvestigation(newInvestigation);
    setCurrentView("workspace");
  };

  const handleOpenInvestigation = (investigation) => {
    console.log("Opening investigation:", investigation);
    setCurrentInvestigation(investigation);
    setCurrentView("workspace");
  };

  const handleDeleteInvestigation = (investigationId) => {
    console.log("Deleting investigation:", investigationId);
    deleteInvestigation(investigationId);
    // If we're currently viewing the deleted investigation, go back to menu
    if (currentInvestigation && currentInvestigation.id === investigationId) {
      setCurrentView("mainMenu");
      setCurrentInvestigation(null);
    }
  };

  const handleBackToMenu = () => {
    setCurrentView("mainMenu");
    setCurrentInvestigation(null);
  };

  const handleInvestigationUpdate = (updatedInvestigation) => {
    console.log("App - handleInvestigationUpdate:", updatedInvestigation);
    updateInvestigation(updatedInvestigation);
    // Also update currentInvestigation immediately
    setCurrentInvestigation(updatedInvestigation);
  };

  const handleShowResults = () => {
    setCurrentView("results");
  };

  const handleImageUpload = (imageData) => {
    // Create a new investigation with the uploaded image
    const newInvestigation = {
      id: `inv_${Date.now()}`,
      name: `Undersøgelse ${investigations.length + 1}`,
      year: new Date().getFullYear(),
      location: {
        name: "Uploadet billede",
        coordinates: { lat: 0, lng: 0 },
      },
      image: imageData,
      referenceFields: [],
      measurements: [],
      createdAt: new Date().toISOString(),
    };

    addInvestigation(newInvestigation);
    setCurrentInvestigation(newInvestigation);
    setCurrentView("workspace");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "mainMenu":
        return (
          <MainMenu
            investigations={investigations}
            onNewInvestigation={handleNewInvestigation}
            onOpenInvestigation={handleOpenInvestigation}
            onDeleteInvestigation={handleDeleteInvestigation}
            onShowResults={handleShowResults}
            onImageUpload={handleImageUpload}
          />
        );

      case "workspace":
        return (
          <InvestigationWorkspace
            investigation={currentInvestigation}
            onUpdate={handleInvestigationUpdate}
            onBack={handleBackToMenu}
            onImageUpload={handleImageUpload}
          />
        );

      case "results":
        return (
          <ResultsOverview
            investigations={investigations}
            onBack={handleBackToMenu}
            onOpenInvestigation={handleOpenInvestigation}
          />
        );

      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="geoseis-app">
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        investigations={investigations}
        currentInvestigation={currentInvestigation}
        onNewInvestigation={handleNewInvestigation}
        onShowResults={handleShowResults}
        onSave={saveInvestigations}
      />
      <main className="main-content">{renderCurrentView()}</main>
    </div>
  );
}

export default App;
