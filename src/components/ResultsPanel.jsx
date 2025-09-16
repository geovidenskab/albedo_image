import React from "react";

const ResultsPanel = ({ investigation, onUpdate }) => {
  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px" }}>Resultater</h3>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Se og eksporter måleresultater
      </p>

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
        <p>Results panel kommer snart...</p>
      </div>
    </div>
  );
};

export default ResultsPanel;
