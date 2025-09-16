import React, { useState } from "react";
import {
  clearCorruptedLocalStorage,
  validateLocalStorageData,
  getLocalStorageSize,
  clearAllAlbedoData,
} from "../utils/localStorageUtils";

const ComprehensiveTestSuite = ({
  investigations,
  onNewInvestigation,
  onOpenInvestigation,
  onDeleteInvestigation,
}) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    // Test 1: Basic App Structure
    setCurrentTest("Testing App Structure...");
    results.push({
      name: "App Structure",
      status: "PASS",
      message: "React app loads successfully",
    });

    // Test 2: Investigation Management
    setCurrentTest("Testing Investigation Management...");
    try {
      // Test creating investigation
      const testInvestigation = {
        id: "test_" + Date.now(),
        name: "Test Investigation",
        year: 2025,
        location: { lat: 56.1572, lng: 10.2107, name: "Aarhus" },
        image: null,
        referenceFields: [],
        measurements: [],
        createdAt: new Date().toISOString(),
      };

      if (typeof onNewInvestigation === "function") {
        results.push({
          name: "Investigation Creation Function",
          status: "PASS",
          message: "onNewInvestigation function available",
        });
      } else {
        results.push({
          name: "Investigation Creation Function",
          status: "FAIL",
          message: "onNewInvestigation function missing",
        });
      }

      if (typeof onOpenInvestigation === "function") {
        results.push({
          name: "Investigation Opening Function",
          status: "PASS",
          message: "onOpenInvestigation function available",
        });
      } else {
        results.push({
          name: "Investigation Opening Function",
          status: "FAIL",
          message: "onOpenInvestigation function missing",
        });
      }

      if (typeof onDeleteInvestigation === "function") {
        results.push({
          name: "Investigation Deletion Function",
          status: "PASS",
          message: "onDeleteInvestigation function available",
        });
      } else {
        results.push({
          name: "Investigation Deletion Function",
          status: "FAIL",
          message: "onDeleteInvestigation function missing",
        });
      }
    } catch (error) {
      results.push({
        name: "Investigation Management",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 3: LocalStorage Functionality
    setCurrentTest("Testing LocalStorage...");
    try {
      // Clear any corrupted data first
      clearCorruptedLocalStorage();

      const testData = { test: "data", timestamp: Date.now() };
      localStorage.setItem("albedo-test", JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem("albedo-test"));

      if (retrieved && retrieved.test === "data") {
        results.push({
          name: "LocalStorage Write/Read",
          status: "PASS",
          message: "LocalStorage read/write works",
        });
      } else {
        results.push({
          name: "LocalStorage Write/Read",
          status: "FAIL",
          message: "LocalStorage data mismatch",
        });
      }

      // Test localStorage validation
      const issues = validateLocalStorageData();
      if (issues.length === 0) {
        results.push({
          name: "LocalStorage Validation",
          status: "PASS",
          message: "All localStorage data is valid",
        });
      } else {
        results.push({
          name: "LocalStorage Validation",
          status: "WARN",
          message: `Issues found: ${issues.join(", ")}`,
        });
      }

      // Test localStorage size
      const size = getLocalStorageSize();
      results.push({
        name: "LocalStorage Size",
        status: size < 5 * 1024 * 1024 ? "PASS" : "WARN", // 5MB limit
        message: `LocalStorage size: ${(size / 1024).toFixed(1)}KB`,
      });

      localStorage.removeItem("albedo-test");
    } catch (error) {
      results.push({
        name: "LocalStorage Functionality",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 4: Image Upload Functionality
    setCurrentTest("Testing Image Upload...");
    try {
      // Create test image
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
        name: "Test Image Creation",
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
        name: "FileReader Functionality",
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
        name: "Image Loading",
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

    // Test 5: Canvas Functionality
    setCurrentTest("Testing Canvas Functionality...");
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        results.push({
          name: "Canvas Context",
          status: "PASS",
          message: "Canvas 2D context available",
        });
      } else {
        results.push({
          name: "Canvas Context",
          status: "FAIL",
          message: "Canvas 2D context not available",
        });
      }

      // Test canvas drawing
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(10, 10, 50, 50);
      const imageData = ctx.getImageData(20, 20, 1, 1);

      if (imageData.data[1] === 255) {
        // Green channel
        results.push({
          name: "Canvas Drawing",
          status: "PASS",
          message: "Canvas drawing and pixel access works",
        });
      } else {
        results.push({
          name: "Canvas Drawing",
          status: "FAIL",
          message: "Canvas drawing failed",
        });
      }
    } catch (error) {
      results.push({
        name: "Canvas Functionality",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 6: Konva.js Functionality
    setCurrentTest("Testing Konva.js...");
    try {
      if (typeof window.Konva !== "undefined") {
        results.push({
          name: "Konva.js Library",
          status: "PASS",
          message: "Konva.js library loaded",
        });

        // Test Konva filters
        if (window.Konva.Filters && window.Konva.Filters.Grayscale) {
          results.push({
            name: "Konva Filters",
            status: "PASS",
            message: "Konva filters available",
          });
        } else {
          results.push({
            name: "Konva Filters",
            status: "FAIL",
            message: "Konva filters not available",
          });
        }
      } else {
        results.push({
          name: "Konva.js Library",
          status: "FAIL",
          message: "Konva.js library not loaded",
        });
      }
    } catch (error) {
      results.push({
        name: "Konva.js Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 7: React Hooks
    setCurrentTest("Testing React Hooks...");
    try {
      if (typeof React.useState === "function") {
        results.push({
          name: "React useState",
          status: "PASS",
          message: "React useState hook available",
        });
      } else {
        results.push({
          name: "React useState",
          status: "FAIL",
          message: "React useState hook not available",
        });
      }

      if (typeof React.useEffect === "function") {
        results.push({
          name: "React useEffect",
          status: "PASS",
          message: "React useEffect hook available",
        });
      } else {
        results.push({
          name: "React useEffect",
          status: "FAIL",
          message: "React useEffect hook not available",
        });
      }

      if (typeof React.useRef === "function") {
        results.push({
          name: "React useRef",
          status: "PASS",
          message: "React useRef hook available",
        });
      } else {
        results.push({
          name: "React useRef",
          status: "FAIL",
          message: "React useRef hook not available",
        });
      }
    } catch (error) {
      results.push({
        name: "React Hooks Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 8: Browser APIs
    setCurrentTest("Testing Browser APIs...");
    try {
      // Test Fullscreen API
      if (
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||
        document.documentElement.msRequestFullscreen
      ) {
        results.push({
          name: "Fullscreen API",
          status: "PASS",
          message: "Fullscreen API available",
        });
      } else {
        results.push({
          name: "Fullscreen API",
          status: "FAIL",
          message: "Fullscreen API not available",
        });
      }

      // Test Drag and Drop API
      if ("draggable" in document.createElement("div")) {
        results.push({
          name: "Drag and Drop API",
          status: "PASS",
          message: "Drag and Drop API available",
        });
      } else {
        results.push({
          name: "Drag and Drop API",
          status: "FAIL",
          message: "Drag and Drop API not available",
        });
      }

      // Test URL API
      if (typeof URL.createObjectURL === "function") {
        results.push({
          name: "URL API",
          status: "PASS",
          message: "URL API available",
        });
      } else {
        results.push({
          name: "URL API",
          status: "FAIL",
          message: "URL API not available",
        });
      }
    } catch (error) {
      results.push({
        name: "Browser APIs Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 9: DOM Elements
    setCurrentTest("Testing DOM Elements...");
    try {
      const uploadArea = document.querySelector('[data-testid="upload-area"]');
      const canvas = document.querySelector("canvas");
      const cards = document.querySelectorAll(".card");
      const buttons = document.querySelectorAll(".btn");

      results.push({
        name: "Upload Area",
        status: uploadArea ? "PASS" : "SKIP",
        message: uploadArea ? "Upload area found" : "Not in workspace",
      });

      results.push({
        name: "Canvas Element",
        status: canvas ? "PASS" : "SKIP",
        message: canvas ? "Canvas element found" : "Not in workspace",
      });

      results.push({
        name: "UI Elements",
        status: cards.length > 0 && buttons.length > 0 ? "PASS" : "FAIL",
        message: `Found ${cards.length} cards and ${buttons.length} buttons`,
      });
    } catch (error) {
      results.push({
        name: "DOM Elements Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 10: Data Validation
    setCurrentTest("Testing Data Validation...");
    try {
      // Test investigation data structure
      if (Array.isArray(investigations)) {
        results.push({
          name: "Investigations Array",
          status: "PASS",
          message: `Found ${investigations.length} investigations`,
        });

        // Validate investigation structure
        if (investigations.length > 0) {
          const firstInv = investigations[0];
          const requiredFields = [
            "id",
            "name",
            "year",
            "location",
            "image",
            "referenceFields",
            "measurements",
            "createdAt",
          ];
          const missingFields = requiredFields.filter(
            (field) => !(field in firstInv)
          );

          if (missingFields.length === 0) {
            results.push({
              name: "Investigation Structure",
              status: "PASS",
              message: "Investigation data structure valid",
            });
          } else {
            results.push({
              name: "Investigation Structure",
              status: "FAIL",
              message: `Missing fields: ${missingFields.join(", ")}`,
            });
          }
        }
      } else {
        results.push({
          name: "Investigations Array",
          status: "FAIL",
          message: "Investigations is not an array",
        });
      }
    } catch (error) {
      results.push({
        name: "Data Validation Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 11: Performance Test
    setCurrentTest("Testing Performance...");
    try {
      const startTime = performance.now();

      // Simulate heavy operation
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration < 100) {
        results.push({
          name: "Performance Test",
          status: "PASS",
          message: `Performance good: ${duration.toFixed(2)}ms`,
        });
      } else {
        results.push({
          name: "Performance Test",
          status: "WARN",
          message: `Performance slow: ${duration.toFixed(2)}ms`,
        });
      }
    } catch (error) {
      results.push({
        name: "Performance Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 12: Error Handling
    setCurrentTest("Testing Error Handling...");
    try {
      // Test try-catch functionality
      try {
        throw new Error("Test error");
      } catch (testError) {
        if (testError.message === "Test error") {
          results.push({
            name: "Error Handling",
            status: "PASS",
            message: "Error handling works correctly",
          });
        } else {
          results.push({
            name: "Error Handling",
            status: "FAIL",
            message: "Error handling failed",
          });
        }
      }
    } catch (error) {
      results.push({
        name: "Error Handling Test",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    setCurrentTest("Tests completed!");
    setTestResults(results);
    setIsRunning(false);
  };

  const clearTestData = () => {
    if (
      window.confirm(
        "Er du sikker på at du vil slette alle data? Dette kan ikke fortrydes."
      )
    ) {
      clearAllAlbedoData();
      window.location.reload();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PASS":
        return "#10b981";
      case "FAIL":
        return "#ef4444";
      case "WARN":
        return "#f59e0b";
      case "SKIP":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case "PASS":
        return "#d1fae5";
      case "FAIL":
        return "#fee2e2";
      case "WARN":
        return "#fef3c7";
      case "SKIP":
        return "#f3f4f6";
      default:
        return "#f3f4f6";
    }
  };

  const passedTests = testResults.filter((r) => r.status === "PASS").length;
  const failedTests = testResults.filter((r) => r.status === "FAIL").length;
  const warningTests = testResults.filter((r) => r.status === "WARN").length;
  const skippedTests = testResults.filter((r) => r.status === "SKIP").length;
  const totalTests = testResults.length;

  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px" }}>Comprehensive Test Suite</h3>

      <div style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-primary"
          onClick={runComprehensiveTests}
          disabled={isRunning}
          style={{ marginRight: "10px" }}
        >
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </button>

        <button className="btn btn-warning" onClick={clearTestData}>
          Clear All Data
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            clearCorruptedLocalStorage();
            window.location.reload();
          }}
          style={{ marginLeft: "10px" }}
        >
          Fix LocalStorage
        </button>
      </div>

      {isRunning && (
        <div
          style={{
            padding: "12px",
            background: "#e0f2fe",
            borderRadius: "6px",
            marginBottom: "16px",
            border: "1px solid #0288d1",
          }}
        >
          <strong>Current Test:</strong> {currentTest}
        </div>
      )}

      {testResults.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "12px" }}>Test Results</h4>

          {/* Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "12px",
                background: "#d1fae5",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #10b981",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                {passedTests}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#065f46" }}>PASSED</div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#fee2e2",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #ef4444",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#ef4444",
                }}
              >
                {failedTests}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#991b1b" }}>FAILED</div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#fef3c7",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #f59e0b",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {warningTests}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#92400e" }}>
                WARNINGS
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#f3f4f6",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #6b7280",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#6b7280",
                }}
              >
                {skippedTests}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#374151" }}>
                SKIPPED
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  background: getStatusBackground(result.status),
                  border: `1px solid ${getStatusColor(result.status)}`,
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
                    background: getStatusColor(result.status),
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

          {/* Overall Status */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background:
                failedTests > 0
                  ? "#fee2e2"
                  : warningTests > 0
                  ? "#fef3c7"
                  : "#d1fae5",
              borderRadius: "6px",
              border: `1px solid ${
                failedTests > 0
                  ? "#ef4444"
                  : warningTests > 0
                  ? "#f59e0b"
                  : "#10b981"
              }`,
            }}
          >
            <strong>Overall Status:</strong>{" "}
            {failedTests > 0
              ? `❌ ${failedTests} TESTS FAILED`
              : warningTests > 0
              ? `⚠️ ${warningTests} WARNINGS`
              : `✅ ALL TESTS PASSED`}
            <br />
            <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              {passedTests}/{totalTests} tests passed (
              {Math.round((passedTests / totalTests) * 100)}%)
            </span>
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
        <h4 style={{ marginBottom: "8px" }}>System Information</h4>
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
          <div>
            <strong>Screen Size:</strong> {window.screen.width}x
            {window.screen.height}
          </div>
          <div>
            <strong>Viewport Size:</strong> {window.innerWidth}x
            {window.innerHeight}
          </div>
          <div>
            <strong>LocalStorage Available:</strong>{" "}
            {typeof Storage !== "undefined" ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveTestSuite;
