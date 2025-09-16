import React from "react";
import * as XLSX from "xlsx";

const MeasurementPanel = ({ measurements, referenceFields, onUpdate }) => {
  const exportToCSV = () => {
    if (!measurements || measurements.length === 0) {
      alert("Ingen målinger at eksportere");
      return;
    }

    // Create CSV content with Danish formatting (comma as decimal, semicolon as separator)
    const headers = [
      "Navn",
      "Albedo Værdi",
      "X Position",
      "Y Position",
      "Bredde",
      "Højde",
    ];
    const csvContent = [
      headers.join(";"),
      ...measurements.map((measurement) =>
        [
          measurement.description || "Unavngivet",
          measurement.albedoValue.toFixed(3).replace(".", ","),
          Math.round(measurement.x),
          Math.round(measurement.y),
          Math.round(measurement.width),
          Math.round(measurement.height),
        ].join(";")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "albedo_maalinger.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!measurements || measurements.length === 0) {
      alert("Ingen målinger at eksportere");
      return;
    }

    // Prepare data for Excel
    const excelData = measurements.map((measurement) => ({
      Navn: measurement.description || "Unavngivet",
      "Albedo Værdi": measurement.albedoValue,
      "X Position": Math.round(measurement.x),
      "Y Position": Math.round(measurement.y),
      Bredde: Math.round(measurement.width),
      Højde: Math.round(measurement.height),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Navn
      { wch: 15 }, // Albedo Værdi
      { wch: 12 }, // X Position
      { wch: 12 }, // Y Position
      { wch: 10 }, // Bredde
      { wch: 10 }, // Højde
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Albedo Målinger");

    // Save file
    XLSX.writeFile(wb, "albedo_maalinger.xlsx");
  };

  if (!measurements || measurements.length === 0) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: "16px" }}>Målinger</h3>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Ingen målinger endnu. Gå til Canvas fanen for at foretage målinger.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0 }}>Målinger ({measurements.length})</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-success"
            onClick={exportToCSV}
            style={{ fontSize: "0.9rem" }}
          >
            Gem som CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={exportToExcel}
            style={{ fontSize: "0.9rem" }}
          >
            Gem som Excel
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #dee2e6",
              }}
            >
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Navn
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Albedo
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Position
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Størrelse
              </th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((measurement, index) => (
              <tr
                key={measurement.id || index}
                style={{ borderBottom: "1px solid #dee2e6" }}
              >
                <td style={{ padding: "12px", fontWeight: "500" }}>
                  {measurement.description || `Måling ${index + 1}`}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span
                    style={{
                      backgroundColor: "#e3f2fd",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "600",
                      color: "#1976d2",
                    }}
                  >
                    {measurement.albedoValue.toFixed(3)}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6c757d",
                  }}
                >
                  ({Math.round(measurement.x)}, {Math.round(measurement.y)})
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6c757d",
                  }}
                >
                  {Math.round(measurement.width)} ×{" "}
                  {Math.round(measurement.height)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>Statistik</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <strong>Gennemsnit:</strong>{" "}
            {(
              measurements.reduce((sum, m) => sum + m.albedoValue, 0) /
              measurements.length
            ).toFixed(3)}
          </div>
          <div>
            <strong>Minimum:</strong>{" "}
            {Math.min(...measurements.map((m) => m.albedoValue)).toFixed(3)}
          </div>
          <div>
            <strong>Maximum:</strong>{" "}
            {Math.max(...measurements.map((m) => m.albedoValue)).toFixed(3)}
          </div>
          <div>
            <strong>Antal målinger:</strong> {measurements.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasurementPanel;
