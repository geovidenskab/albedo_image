import React from "react";

const ResultsOverview = ({ investigations, onBack, onOpenInvestigation }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Resultater</h2>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Tilbage
        </button>
      </div>

      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}></div>
        <p>Results overview kommer snart...</p>
      </div>
    </div>
  );
};

export default ResultsOverview;
