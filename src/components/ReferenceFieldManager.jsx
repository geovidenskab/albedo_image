import React from "react";

const ReferenceFieldManager = ({ referenceFields, onUpdate, image }) => {
  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px" }}>Reference Felter</h3>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Definer reference felter med kendte albedo værdier for kalibrering
      </p>

      {image ? (
        <div>
          <p>Reference field manager kommer snart...</p>
        </div>
      ) : (
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
          <p>Upload et billede for at definere reference felter</p>
        </div>
      )}
    </div>
  );
};

export default ReferenceFieldManager;
