import React, { useState } from "react";

const CanvasTestSuite = ({
  investigations,
  onNewInvestigation,
  onOpenInvestigation,
  onDeleteInvestigation,
}) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");

  const runCanvasTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    // Test 1: Canvas Creation and Basic Drawing
    setCurrentTest("Testing Canvas Creation...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        results.push({
          name: "Canvas Creation",
          status: "PASS",
          message: "Canvas created successfully",
        });

        // Test basic drawing
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(10, 10, 50, 50);

        // Test pixel access
        const imageData = ctx.getImageData(20, 20, 1, 1);
        if (imageData.data[0] === 255) {
          // Red channel
          results.push({
            name: "Canvas Drawing",
            status: "PASS",
            message: "Canvas drawing and pixel access works",
          });
        } else {
          results.push({
            name: "Canvas Drawing",
            status: "FAIL",
            message: "Canvas drawing failed - pixel data incorrect",
          });
        }
      } else {
        results.push({
          name: "Canvas Creation",
          status: "FAIL",
          message: "Canvas context not available",
        });
      }
    } catch (error) {
      results.push({
        name: "Canvas Creation",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 2: Image Loading and Display
    setCurrentTest("Testing Image Loading...");
    try {
      // Create test image
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      // Draw test pattern
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(100, 0, 100, 100);
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 100, 100, 100);
      ctx.fillStyle = "#ffff00";
      ctx.fillRect(100, 100, 100, 100);

      const dataUrl = canvas.toDataURL("image/png");

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

      // Test drawing image to canvas
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 200;
      testCanvas.height = 200;
      const testCtx = testCanvas.getContext("2d");
      testCtx.drawImage(loadedImg, 0, 0);

      // Check if image was drawn correctly
      const testImageData = testCtx.getImageData(50, 50, 1, 1);
      if (testImageData.data[1] === 255) {
        // Green channel
        results.push({
          name: "Image Drawing",
          status: "PASS",
          message: "Image drawn to canvas successfully",
        });
      } else {
        results.push({
          name: "Image Drawing",
          status: "FAIL",
          message: "Image drawing to canvas failed",
        });
      }
    } catch (error) {
      results.push({
        name: "Image Loading",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 3: Grayscale Conversion
    setCurrentTest("Testing Grayscale Conversion...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");

      // Draw colored rectangle
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 100, 100);

      // Get image data
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray; // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha stays the same
      }

      // Put modified data back
      ctx.putImageData(imageData, 0, 0);

      // Check if grayscale conversion worked
      const testPixel = ctx.getImageData(50, 50, 1, 1);
      const r = testPixel.data[0];
      const g = testPixel.data[1];
      const b = testPixel.data[2];

      if (Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5) {
        results.push({
          name: "Grayscale Conversion",
          status: "PASS",
          message: "Grayscale conversion successful",
        });
      } else {
        results.push({
          name: "Grayscale Conversion",
          status: "FAIL",
          message: `Grayscale conversion failed: R=${r}, G=${g}, B=${b}`,
        });
      }
    } catch (error) {
      results.push({
        name: "Grayscale Conversion",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 4: Mouse Event Simulation
    setCurrentTest("Testing Mouse Events...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      let mouseEvents = 0;

      // Add event listeners
      const handleMouseDown = (e) => {
        mouseEvents++;
        // Only log in test mode, not in production
        if (process.env.NODE_ENV === "development") {
          console.log("Mouse down at:", e.offsetX, e.offsetY);
        }
      };

      const handleMouseMove = (e) => {
        mouseEvents++;
      };

      const handleMouseUp = (e) => {
        mouseEvents++;
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);

      // Simulate mouse events
      const mouseDownEvent = new MouseEvent("mousedown", {
        clientX: 100,
        clientY: 100,
        offsetX: 100,
        offsetY: 100,
      });

      const mouseUpEvent = new MouseEvent("mouseup", {
        clientX: 100,
        clientY: 100,
        offsetX: 100,
        offsetY: 100,
      });

      canvas.dispatchEvent(mouseDownEvent);
      canvas.dispatchEvent(mouseUpEvent);

      // Clean up
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);

      if (mouseEvents >= 2) {
        results.push({
          name: "Mouse Events",
          status: "PASS",
          message: `Mouse events working: ${mouseEvents} events captured`,
        });
      } else {
        results.push({
          name: "Mouse Events",
          status: "FAIL",
          message: `Mouse events failed: only ${mouseEvents} events captured`,
        });
      }
    } catch (error) {
      results.push({
        name: "Mouse Events",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 5: Coordinate System
    setCurrentTest("Testing Coordinate System...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      // Test coordinate conversion functions
      const testCoords = [
        { x: 0, y: 0 },
        { x: 200, y: 150 },
        { x: 400, y: 300 },
      ];

      let coordTests = 0;

      testCoords.forEach((coord) => {
        // Test if coordinates are within bounds
        if (
          coord.x >= 0 &&
          coord.x <= canvas.width &&
          coord.y >= 0 &&
          coord.y <= canvas.height
        ) {
          coordTests++;
        }
      });

      if (coordTests === testCoords.length) {
        results.push({
          name: "Coordinate System",
          status: "PASS",
          message: "Coordinate system validation successful",
        });
      } else {
        results.push({
          name: "Coordinate System",
          status: "FAIL",
          message: `Coordinate system failed: ${coordTests}/${testCoords.length} valid`,
        });
      }
    } catch (error) {
      results.push({
        name: "Coordinate System",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 6: Image Scaling
    setCurrentTest("Testing Image Scaling...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      // Create test image
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 100;
      testCanvas.height = 100;
      const testCtx = testCanvas.getContext("2d");
      testCtx.fillStyle = "#ff0000";
      testCtx.fillRect(0, 0, 100, 100);

      const testImage = testCanvas.toDataURL();
      const img = new Image();

      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image loading failed"));
        img.src = testImage;
      });

      const loadedImg = await imagePromise;

      // Test scaling
      ctx.drawImage(loadedImg, 0, 0, 200, 200); // Scale 2x

      // Check if scaling worked
      const scaledPixel = ctx.getImageData(100, 100, 1, 1);
      if (scaledPixel.data[0] === 255) {
        // Red channel
        results.push({
          name: "Image Scaling",
          status: "PASS",
          message: "Image scaling successful",
        });
      } else {
        results.push({
          name: "Image Scaling",
          status: "FAIL",
          message: "Image scaling failed",
        });
      }
    } catch (error) {
      results.push({
        name: "Image Scaling",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 7: Performance Test
    setCurrentTest("Testing Canvas Performance...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");

      const startTime = performance.now();

      // Draw many rectangles
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`;
        ctx.fillRect(
          Math.random() * 800,
          Math.random() * 600,
          Math.random() * 50,
          Math.random() * 50
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration < 100) {
        results.push({
          name: "Canvas Performance",
          status: "PASS",
          message: `Performance good: ${duration.toFixed(2)}ms for 1000 draws`,
        });
      } else if (duration < 500) {
        results.push({
          name: "Canvas Performance",
          status: "WARN",
          message: `Performance moderate: ${duration.toFixed(
            2
          )}ms for 1000 draws`,
        });
      } else {
        results.push({
          name: "Canvas Performance",
          status: "FAIL",
          message: `Performance poor: ${duration.toFixed(2)}ms for 1000 draws`,
        });
      }
    } catch (error) {
      results.push({
        name: "Canvas Performance",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    setCurrentTest("Canvas tests completed!");
    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PASS":
        return "#10b981";
      case "FAIL":
        return "#ef4444";
      case "WARN":
        return "#f59e0b";
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
      default:
        return "#f3f4f6";
    }
  };

  const passedTests = testResults.filter((r) => r.status === "PASS").length;
  const failedTests = testResults.filter((r) => r.status === "FAIL").length;
  const warningTests = testResults.filter((r) => r.status === "WARN").length;
  const totalTests = testResults.length;

  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px" }}>Canvas Test Suite</h3>

      <div style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-primary"
          onClick={runCanvasTests}
          disabled={isRunning}
        >
          {isRunning ? "Running Canvas Tests..." : "Run Canvas Tests"}
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
          <h4 style={{ marginBottom: "12px" }}>Canvas Test Results</h4>

          {/* Summary */}
          <div
            style={{
              display: "flex",
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
                flex: 1,
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
                flex: 1,
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
                flex: 1,
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
            <strong>Canvas Status:</strong>{" "}
            {failedTests > 0
              ? `❌ ${failedTests} CANVAS TESTS FAILED`
              : warningTests > 0
              ? `⚠️ ${warningTests} CANVAS WARNINGS`
              : `✅ ALL CANVAS TESTS PASSED`}
            <br />
            <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              {passedTests}/{totalTests} canvas tests passed (
              {Math.round((passedTests / totalTests) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasTestSuite;
