import React from "react";

const Header = ({
  currentView,
  onNavigate,
  investigations = [],
  currentInvestigation,
  onNewInvestigation,
  onShowResults,
  onSave,
}) => {
  const hasInvestigations = investigations.length > 0;

  return (
    <header className="header">
      <div className="header-content">
        <div className="title-section">
          <div className="earth-emoji">🌍</div>
          <div className="title-text">
            <h1 className="main-title">Albedomåling</h1>
            <p className="main-subtitle">Analyse af Satellitbilleder</p>
            <div
              className="version-text"
              style={{
                color: "#6c757d",
                fontSize: "0.7rem",
                fontWeight: "400",
                display: "inline-block",
                marginTop: "4px",
                opacity: "0.7",
              }}
            >
              v2.3
            </div>
          </div>
        </div>

        <div className="nav-buttons">
          {currentView !== "mainMenu" && (
            <button className="nav-btn" onClick={() => onNavigate("mainMenu")}>
              ← Tilbage
            </button>
          )}
          {hasInvestigations && onSave && (
            <button className="nav-btn nav-btn-secondary" onClick={onSave}>
              Gem
            </button>
          )}
          <button
            className="nav-btn nav-btn-primary"
            onClick={onNewInvestigation}
          >
            Ny Undersøgelse
          </button>
          {hasInvestigations && currentView === "mainMenu" && (
            <button className="nav-btn" onClick={() => onNavigate("results")}>
              Se Resultater
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
