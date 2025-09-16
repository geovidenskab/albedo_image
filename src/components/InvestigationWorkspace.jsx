import React, { useState, useEffect } from "react";
import CanvasEditor from "./CanvasEditor";
import MeasurementPanel from "./MeasurementPanel";

const InvestigationWorkspace = ({
  investigation,
  onUpdate,
  onBack,
  onImageUpload,
}) => {
  const [activeTab, setActiveTab] = useState("canvas");

  const handleImageLoad = (imageData) => {
    console.log("InvestigationWorkspace - handleImageLoad:", imageData);
    const updatedInvestigation = {
      ...investigation,
      image: imageData,
    };
    onUpdate(updatedInvestigation);
  };

  const handleReferenceFieldsUpdate = (referenceFields) => {
    const updatedInvestigation = {
      ...investigation,
      referenceFields,
    };
    onUpdate(updatedInvestigation);
  };

  const handleMeasurementsUpdate = (measurements) => {
    console.log(
      "InvestigationWorkspace - handleMeasurementsUpdate:",
      measurements
    );
    const updatedInvestigation = {
      ...investigation,
      measurements,
    };
    onUpdate(updatedInvestigation);
  };

  // Debug logging
  console.log("InvestigationWorkspace - investigation:", investigation);

  // Handle case where investigation is null or undefined
  if (!investigation) {
    return (
      <div className="info-card">
        <div className="card-header">
          <h2 className="card-title">Ingen Undersøgelse Valgt</h2>
        </div>
        <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>
          <p>Der er ingen undersøgelse valgt. Gå tilbage til hovedmenuen.</p>
          <button
            className="btn btn-primary"
            onClick={onBack}
            style={{ marginTop: "20px" }}
          >
            ← Tilbage til Hovedmenu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="investigation-workspace">
      <div className="workspace-header">
        <div className="header-content">
          <h1 className="workspace-title">{investigation.name}</h1>
          <p className="workspace-subtitle">
            {investigation.year} |{" "}
            {investigation.location?.name || "Ukendt lokation"}
          </p>
        </div>
        <div className="header-actions">
          {/* Tilbageknap fjernet - der er allerede en i header */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="tab-navigation"
        style={{
          display: "flex",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "20px",
          backgroundColor: "#f9fafb",
        }}
      >
        <button
          className={`tab-button ${activeTab === "canvas" ? "active" : ""}`}
          onClick={() => setActiveTab("canvas")}
          style={{
            padding: "12px 24px",
            border: "none",
            backgroundColor: activeTab === "canvas" ? "#3b82f6" : "transparent",
            color: activeTab === "canvas" ? "white" : "#6b7280",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          Canvas
        </button>
        {investigation.measurements &&
          investigation.measurements.length > 0 && (
            <button
              className={`tab-button ${
                activeTab === "measurements" ? "active" : ""
              }`}
              onClick={() => setActiveTab("measurements")}
              style={{
                padding: "12px 24px",
                border: "none",
                backgroundColor:
                  activeTab === "measurements" ? "#3b82f6" : "transparent",
                color: activeTab === "measurements" ? "white" : "#6b7280",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                transition: "all 0.2s ease",
              }}
            >
              Målinger
            </button>
          )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "canvas" && (
          <div className="full-width-canvas-container">
            <CanvasEditor
              image={investigation.image}
              referenceFields={investigation.referenceFields || []}
              measurements={investigation.measurements || []}
              onReferenceFieldsUpdate={handleReferenceFieldsUpdate}
              onMeasurementsUpdate={handleMeasurementsUpdate}
              onImageUpload={handleImageLoad}
            />
          </div>
        )}

        {activeTab === "measurements" &&
          investigation.measurements &&
          investigation.measurements.length > 0 && (
            <div className="workspace-section">
              <MeasurementPanel
                measurements={investigation.measurements || []}
                onUpdate={handleMeasurementsUpdate}
              />
            </div>
          )}

        {/* Results tab removed */}
      </div>
    </div>
  );
};

export default InvestigationWorkspace;
