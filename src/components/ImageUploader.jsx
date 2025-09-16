import React, { useState, useRef } from "react";

const ImageUploader = ({ onImageLoad, currentImage, onStartMeasurement }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const aspectRatio = img.height / img.width;
        const newWidth = Math.min(maxWidth, img.width);
        const newHeight = newWidth * aspectRatio;

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        resolve({
          url: compressedDataUrl,
          name: file.name,
          size: compressedDataUrl.length, // Approximate size
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

    // Check file size (warn if > 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const proceed = window.confirm(
        `Billedet er ${(file.size / 1024 / 1024).toFixed(
          1
        )}MB. Dette kan fylde meget i browserens hukommelse. Vil du fortsætte?`
      );
      if (!proceed) return;
    }

    setIsLoading(true);

    try {
      // Compress image if it's large
      let imageData;
      if (file.size > 2 * 1024 * 1024) {
        // > 2MB
        console.log("Compressing large image...");
        imageData = await compressImage(file, 1200, 0.8);
      } else {
        // Use original for small images
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                url: e.target.result,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                dimensions: {
                  width: img.width,
                  height: img.height,
                },
                compressed: false,
              });
            };
            img.onerror = reject;
            img.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      onImageLoad(imageData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Fejl ved behandling af billede");
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <h4 style={{ marginBottom: "12px", fontSize: "1rem" }}>Billede Upload</h4>

      <div
        data-testid="upload-area"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? "#3b82f6" : "#d1d5db"}`,
          borderRadius: "6px",
          padding: "20px 15px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragOver ? "#f0f9ff" : "#f9fafb",
          transition: "all 0.2s ease",
        }}
      >
        {isLoading ? (
          <div>
            <div className="loading" style={{ margin: "0 auto 8px" }}></div>
            <p style={{ fontSize: "0.9rem" }}>Indlæser...</p>
          </div>
        ) : currentImage ? (
          <div>
            <h5 style={{ marginBottom: "6px", fontSize: "0.9rem" }}>
              ✅ Uploadet
            </h5>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.8rem",
                marginBottom: "8px",
              }}
            >
              {currentImage.dimensions?.width} ×{" "}
              {currentImage.dimensions?.height}
            </p>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
            >
              Nyt Billede
            </button>
          </div>
        ) : (
          <div>
            <h5 style={{ marginBottom: "6px", fontSize: "0.9rem" }}>
              📁 Upload
            </h5>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.8rem",
                marginBottom: "8px",
              }}
            >
              Træk & slip eller klik
            </p>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
              JPG, PNG, GIF, WebP
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {currentImage && (
        <div style={{ marginTop: "15px" }}>
          <h5 style={{ marginBottom: "8px", fontSize: "0.9rem" }}>
            Billedinfo
          </h5>
          <div
            style={{
              background: "#f9fafb",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "3px",
              }}
            >
              <span>Dimensioner:</span>
              <span>
                {currentImage.dimensions?.width} ×{" "}
                {currentImage.dimensions?.height}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "3px",
              }}
            >
              <span>Fil størrelse:</span>
              <span>{(currentImage.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "3px",
              }}
            >
              <span>Type:</span>
              <span>{currentImage.type}</span>
            </div>
            {currentImage.compressed && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status:</span>
                <span
                  style={{
                    color: "#059669",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                  }}
                >
                  ✅ Komprimeret
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start/Edit Measurement Button */}
      {currentImage && (
        <div style={{ marginTop: "15px" }}>
          <button
            className="btn btn-primary"
            onClick={onStartMeasurement}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "0.9rem",
              fontWeight: "600",
              background: "linear-gradient(135deg, #28a745, #20c997)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(40, 167, 69, 0.3)",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(40, 167, 69, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(40, 167, 69, 0.3)";
            }}
          >
            🎯 Gå til Albedo Måling
          </button>
          <p
            style={{
              fontSize: "0.7rem",
              color: "#6c757d",
              textAlign: "center",
              marginTop: "6px",
            }}
          >
            Åbner fuldskærm med alle målefunktioner
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
