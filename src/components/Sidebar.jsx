import React from "react";

const Sidebar = ({
  currentView,
  onNavigate,
  investigations = [],
  currentInvestigation,
  onOpenInvestigation,
}) => {
  const hasInvestigations = investigations.length > 0;

  const menuItems = [
    { text: "Hovedmenu", view: "mainMenu" },
    {
      text: "Albedoanalyse",
      view: "workspace",
      disabled: !currentInvestigation,
    },
    {
      text: "Resultater",
      view: "results",
      disabled: !hasInvestigations,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Navigation</h3>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <h4>Hovedfunktioner</h4>
          {menuItems.map((item) => (
            <button
              key={item.text}
              className={`sidebar-btn ${
                currentView === item.view ? "active" : ""
              }`}
              onClick={() => onNavigate(item.view)}
              disabled={item.disabled}
            >
              {item.text}
            </button>
          ))}
        </div>

        {hasInvestigations && (
          <div className="nav-group">
            <h4>Seneste Undersøgelser</h4>
            {investigations
              .slice(-5)
              .reverse()
              .map((investigation) => (
                <button
                  key={investigation.id}
                  className={`sidebar-btn ${
                    currentInvestigation?.id === investigation.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => onOpenInvestigation(investigation)}
                  title={`${investigation.name} (${investigation.year})`}
                >
                  <div style={{ textAlign: "left", width: "100%" }}>
                    <div
                      style={{
                        fontWeight: 500,
                        marginBottom: "2px",
                        lineHeight: "1.3",
                        fontSize: "0.875rem",
                      }}
                    >
                      {investigation.name.length > 20
                        ? `${investigation.name.substring(0, 20)}...`
                        : investigation.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        fontWeight: 400,
                      }}
                    >
                      {investigation.year} • {investigation.measurements.length}{" "}
                      mål.
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
