import React, { useState, useRef } from "react";

const MainMenu = ({
  investigations,
  onNewInvestigation,
  onOpenInvestigation,
  onDeleteInvestigation,
  onShowResults,
  onImageUpload,
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const hasInvestigations = investigations.length > 0;

  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const aspectRatio = img.height / img.width;
        const newWidth = Math.min(maxWidth, img.width);
        const newHeight = newWidth * aspectRatio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        resolve({
          url: compressedDataUrl,
          name: file.name,
          size: compressedDataUrl.length,
          type: "image/jpeg",
          lastModified: file.lastModified,
          dimensions: {
            width: newWidth,
            height: newHeight,
          },
          compressed: true,
        });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Vælg venligst en gyldig billedfil (JPG, PNG, GIF)");
      return;
    }

    setIsLoading(true);
    try {
      const compressedImage = await compressImage(file);
      if (onImageUpload) {
        onImageUpload(compressedImage);
      }
      setShowUploadDropdown(false);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Der opstod en fejl ved behandling af billedet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="info-card">
      <div className="card-header">
        <h2 className="card-title">Undersøgelser</h2>
        <p
          style={{ margin: "8px 0 0 0", color: "#6b7280", fontSize: "0.9rem" }}
        >
          Administrer dine albedo undersøgelser og tilgå resultater
        </p>
      </div>

      {hasInvestigations && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ marginBottom: "16px", color: "#374151" }}>
            Seneste Undersøgelser
          </h3>
          <div className="grid grid-2">
            {investigations
              .slice(-4)
              .reverse()
              .map((investigation) => (
                <div
                  key={investigation.id}
                  className="info-card"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                    border: "1px solid #E9ECEF",
                  }}
                  onClick={() => onOpenInvestigation(investigation)}
                  onMouseEnter={(e) =>
                    (e.target.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 8px 0", color: "#111827" }}>
                        {investigation.name}
                      </h4>
                      <p
                        style={{
                          margin: "0",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        {investigation.year} • {investigation.location.name}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          background: "#f3f4f6",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          color: "#374151",
                        }}
                      >
                        {investigation.measurements.length} målinger
                      </div>
                      <button
                        className="btn btn-warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Er du sikker på at du vil slette "${investigation.name}"?`
                            )
                          ) {
                            onDeleteInvestigation(investigation.id);
                          }
                        }}
                        style={{
                          fontSize: "0.7rem",
                          padding: "6px 10px",
                          minWidth: "auto",
                        }}
                        title="Slet undersøgelse"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!hasInvestigations && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#6b7280",
          }}
        >
          <h3 style={{ marginBottom: "8px", color: "#374151" }}>
            Velkommen til Albedo Måling
          </h3>
          <p>
            Start din første undersøgelse for at måle albedo i satellitbilleder
          </p>
        </div>
      )}

      {/* Action buttons - Always visible */}
      <div
        style={{
          marginTop: "30px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={onNewInvestigation}
          style={{
            fontSize: "1rem",
            padding: "12px 24px",
            fontWeight: "600",
          }}
        >
          Ny Undersøgelse
        </button>

        {/* Upload Image Button */}
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-success"
            onClick={() => setShowUploadDropdown(!showUploadDropdown)}
            disabled={isLoading}
            style={{
              fontSize: "1rem",
              padding: "12px 24px",
              fontWeight: "600",
            }}
          >
            {isLoading ? "Uploader..." : "Upload Billede"}
          </button>

          {/* Upload Dropdown */}
          {showUploadDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                right: "0",
                background: "white",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                marginTop: "4px",
                padding: "16px",
                minWidth: "300px",
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div
                style={{
                  border: isDragOver
                    ? "2px dashed #28a745"
                    : "2px dashed #dee2e6",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  background: isDragOver ? "#f8fff9" : "#f8f9fa",
                  transition: "all 0.2s ease",
                }}
              >
                <p style={{ margin: "0 0 12px 0", color: "#6c757d" }}>
                  {isDragOver
                    ? "Slip billedet her"
                    : "Træk og slip et billede her"}
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: "0.9rem" }}
                >
                  Eller klik for at vælge fil
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
              </div>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "0.8rem",
                  color: "#6c757d",
                }}
              >
                <p style={{ margin: "0" }}>
                  Understøttede formater: JPG, PNG, GIF
                </p>
                <p style={{ margin: "4px 0 0 0" }}>Maksimal størrelse: 10MB</p>
              </div>
            </div>
          )}
        </div>

        {hasInvestigations && (
          <button
            className="btn btn-info"
            onClick={onShowResults}
            style={{
              fontSize: "1rem",
              padding: "12px 24px",
              fontWeight: "600",
            }}
          >
            Se Alle Resultater
          </button>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
