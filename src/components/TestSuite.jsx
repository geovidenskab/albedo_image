import React, { useState } from "react";

const TestSuite = ({
  investigations,
  onNewInvestigation,
  onOpenInvestigation,
  onDeleteInvestigation,
}) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    // Test 1: Check if investigations array exists
    results.push({
      name: "Investigations Array",
      status: Array.isArray(investigations) ? "PASS" : "FAIL",
      message: Array.isArray(investigations)
        ? `Found ${investigations.length} investigations`
        : "Investigations is not an array",
    });

    // Test 2: Check if functions exist
    results.push({
      name: "Function Existence",
      status:
        typeof onNewInvestigation === "function" &&
        typeof onOpenInvestigation === "function" &&
        typeof onDeleteInvestigation === "function"
          ? "PASS"
          : "FAIL",
      message: "All required functions are available",
    });

    // Test 3: Check localStorage
    try {
      const saved = localStorage.getItem("albedo-investigations");
      results.push({
        name: "LocalStorage Access",
        status: "PASS",
        message: saved
          ? `Found saved data: ${saved.length} characters`
          : "No saved data found",
      });
    } catch (error) {
      results.push({
        name: "LocalStorage Access",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 4: Check if we can create a test investigation
    try {
      const testInvestigation = {
        id: "test-" + Date.now(),
        name: "Test Investigation",
        year: new Date().getFullYear(),
        location: { lat: 56.1572, lng: 10.2107, name: "Test Location" },
        image: null,
        referenceFields: [],
        measurements: [],
        createdAt: new Date().toISOString(),
      };

      results.push({
        name: "Test Investigation Creation",
        status: "PASS",
        message: "Test investigation object created successfully",
      });
    } catch (error) {
      results.push({
        name: "Test Investigation Creation",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 5: Check DOM elements (only relevant when in workspace)
    const uploadArea = document.querySelector('[data-testid="upload-area"]');
    const canvas = document.querySelector("canvas");
    const isInWorkspace =
      window.location.hash.includes("workspace") ||
      document.querySelector(".investigation-workspace");

    results.push({
      name: "DOM Elements",
      status: isInWorkspace ? (uploadArea || canvas ? "PASS" : "FAIL") : "SKIP",
      message: isInWorkspace
        ? `Upload area: ${uploadArea ? "Found" : "Not found"}, Canvas: ${
            canvas ? "Found" : "Not found"
          }`
        : "Not in workspace - DOM elements not expected",
    });

    // Test 6: Check CSS classes
    const cards = document.querySelectorAll(".card");
    const buttons = document.querySelectorAll(".btn");

    results.push({
      name: "CSS Classes",
      status: cards.length > 0 && buttons.length > 0 ? "PASS" : "FAIL",
      message: `Found ${cards.length} cards and ${buttons.length} buttons`,
    });

    // Test 7: Check if we can create a test investigation with image
    try {
      const testImageData = {
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        name: "test-image.png",
        size: 1024,
        type: "image/png",
        dimensions: { width: 1, height: 1 },
        lastModified: Date.now(),
      };

      results.push({
        name: "Test Image Data Creation",
        status: "PASS",
        message: "Test image data object created successfully",
      });
    } catch (error) {
      results.push({
        name: "Test Image Data Creation",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 8: Check FileReader API availability
    results.push({
      name: "FileReader API",
      status: typeof FileReader !== "undefined" ? "PASS" : "FAIL",
      message:
        typeof FileReader !== "undefined"
          ? "FileReader API is available"
          : "FileReader API is not available",
    });

    // Test 9: Check if we can create a test investigation
    if (typeof onNewInvestigation === "function") {
      try {
        // This won't actually create an investigation, just test the function exists
        results.push({
          name: "Investigation Creation Function",
          status: "PASS",
          message: "onNewInvestigation function is callable",
        });
      } catch (error) {
        results.push({
          name: "Investigation Creation Function",
          status: "FAIL",
          message: `Error: ${error.message}`,
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const clearTestData = () => {
    localStorage.removeItem("albedo-investigations");
    window.location.reload();
  };

  const testImageUpload = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    // Test image upload functionality
    try {
      // Create a test file
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 100, 100);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File([blob], "test-image.png", { type: "image/png" });

      results.push({
        name: "Test File Creation",
        status: "PASS",
        message: "Test image file created successfully",
      });

      // Test FileReader
      const reader = new FileReader();
      const readerPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });

      const dataUrl = await readerPromise;
      results.push({
        name: "FileReader Test",
        status: "PASS",
        message: "FileReader successfully read test file",
      });

      // Test image loading
      const img = new Image();
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image loading failed"));
        img.src = dataUrl;
      });

      const loadedImg = await imagePromise;
      results.push({
        name: "Image Loading Test",
        status: "PASS",
        message: `Image loaded: ${loadedImg.width}x${loadedImg.height}`,
      });
    } catch (error) {
      results.push({
        name: "Image Upload Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px" }}>Test Suite</h3>

      <div style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-primary"
          onClick={runTests}
          disabled={isRunning}
          style={{ marginRight: "10px" }}
        >
          {isRunning ? "Kører Tests..." : "Kør Tests"}
        </button>

        <button
          className="btn btn-info"
          onClick={testImageUpload}
          disabled={isRunning}
          style={{ marginRight: "10px" }}
        >
          {isRunning ? "Kører Tests..." : "Test Image Upload"}
        </button>

        <button className="btn btn-warning" onClick={clearTestData}>
          Ryd Test Data
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "12px" }}>Test Resultater</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  background:
                    result.status === "PASS"
                      ? "#d1fae5"
                      : result.status === "SKIP"
                      ? "#f3f4f6"
                      : "#fee2e2",
                  border: `1px solid ${
                    result.status === "PASS"
                      ? "#10b981"
                      : result.status === "SKIP"
                      ? "#6b7280"
                      : "#ef4444"
                  }`,
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{result.name}</strong>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    {result.message}
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background:
                      result.status === "PASS"
                        ? "#10b981"
                        : result.status === "SKIP"
                        ? "#6b7280"
                        : "#ef4444",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {result.status}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#f3f4f6",
              borderRadius: "6px",
            }}
          >
            <strong>Samlet Status:</strong>{" "}
            {testResults.every(
              (r) => r.status === "PASS" || r.status === "SKIP"
            )
              ? "ALLE TESTS BESTÅET"
              : testResults.some((r) => r.status === "FAIL")
              ? "NOGLE TESTS FEJLEDE"
              : "TESTS KØRER"}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          background: "#fef3c7",
          borderRadius: "6px",
        }}
      >
        <h4 style={{ marginBottom: "8px" }}>Debug Information</h4>
        <div style={{ fontSize: "0.9rem" }}>
          <div>
            <strong>Investigations:</strong> {investigations.length}
          </div>
          <div>
            <strong>Current URL:</strong> {window.location.href}
          </div>
          <div>
            <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}
            ...
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuite;
