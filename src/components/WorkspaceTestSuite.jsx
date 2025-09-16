import React, { useState } from "react";

const WorkspaceTestSuite = ({
  investigations,
  onNewInvestigation,
  onOpenInvestigation,
  onDeleteInvestigation,
}) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");

  const runWorkspaceTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    // Test 1: Investigation Creation
    setCurrentTest("Testing Investigation Creation...");
    try {
      if (typeof onNewInvestigation === "function") {
        // Mock the prompt function
        const originalPrompt = window.prompt;
        window.prompt = () => "Test Investigation";

        // This won't actually create an investigation, just test the function
        results.push({
          name: "Investigation Creation Function",
          status: "PASS",
          message: "onNewInvestigation function is callable",
        });

        // Restore original prompt
        window.prompt = originalPrompt;
      } else {
        results.push({
          name: "Investigation Creation Function",
          status: "FAIL",
          message: "onNewInvestigation function not available",
        });
      }
    } catch (error) {
      results.push({
        name: "Investigation Creation",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 2: Investigation Data Structure
    setCurrentTest("Testing Investigation Data Structure...");
    try {
      if (Array.isArray(investigations)) {
        results.push({
          name: "Investigations Array",
          status: "PASS",
          message: `Found ${investigations.length} investigations`,
        });

        if (investigations.length > 0) {
          const investigation = investigations[0];
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
            (field) => !(field in investigation)
          );

          if (missingFields.length === 0) {
            results.push({
              name: "Investigation Structure",
              status: "PASS",
              message: "Investigation has all required fields",
            });
          } else {
            results.push({
              name: "Investigation Structure",
              status: "FAIL",
              message: `Missing fields: ${missingFields.join(", ")}`,
            });
          }

          // Test location structure
          if (
            investigation.location &&
            typeof investigation.location.lat === "number" &&
            typeof investigation.location.lng === "number" &&
            typeof investigation.location.name === "string"
          ) {
            results.push({
              name: "Location Structure",
              status: "PASS",
              message: "Location data structure valid",
            });
          } else {
            results.push({
              name: "Location Structure",
              status: "FAIL",
              message: "Location data structure invalid",
            });
          }

          // Test arrays
          if (Array.isArray(investigation.referenceFields)) {
            results.push({
              name: "Reference Fields Array",
              status: "PASS",
              message: `Reference fields is array with ${investigation.referenceFields.length} items`,
            });
          } else {
            results.push({
              name: "Reference Fields Array",
              status: "FAIL",
              message: "Reference fields is not an array",
            });
          }

          if (Array.isArray(investigation.measurements)) {
            results.push({
              name: "Measurements Array",
              status: "PASS",
              message: `Measurements is array with ${investigation.measurements.length} items`,
            });
          } else {
            results.push({
              name: "Measurements Array",
              status: "FAIL",
              message: "Measurements is not an array",
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
        name: "Investigation Data Structure",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 3: Image Data Structure
    setCurrentTest("Testing Image Data Structure...");
    try {
      const investigationsWithImages = investigations.filter(
        (inv) => inv.image
      );

      if (investigationsWithImages.length > 0) {
        const imageData = investigationsWithImages[0].image;

        const requiredImageFields = [
          "url",
          "name",
          "size",
          "type",
          "dimensions",
        ];
        const missingImageFields = requiredImageFields.filter(
          (field) => !(field in imageData)
        );

        if (missingImageFields.length === 0) {
          results.push({
            name: "Image Data Structure",
            status: "PASS",
            message: "Image data has all required fields",
          });
        } else {
          results.push({
            name: "Image Data Structure",
            status: "FAIL",
            message: `Missing image fields: ${missingImageFields.join(", ")}`,
          });
        }

        // Test image URL
        if (
          imageData.url &&
          (imageData.url.startsWith("data:") ||
            imageData.url.startsWith("http"))
        ) {
          results.push({
            name: "Image URL Format",
            status: "PASS",
            message: "Image URL format is valid",
          });
        } else {
          results.push({
            name: "Image URL Format",
            status: "FAIL",
            message: "Image URL format is invalid",
          });
        }

        // Test dimensions
        if (
          imageData.dimensions &&
          typeof imageData.dimensions.width === "number" &&
          typeof imageData.dimensions.height === "number"
        ) {
          results.push({
            name: "Image Dimensions",
            status: "PASS",
            message: `Image dimensions: ${imageData.dimensions.width}x${imageData.dimensions.height}`,
          });
        } else {
          results.push({
            name: "Image Dimensions",
            status: "FAIL",
            message: "Image dimensions are invalid",
          });
        }
      } else {
        results.push({
          name: "Image Data Structure",
          status: "SKIP",
          message: "No investigations with images found",
        });
      }
    } catch (error) {
      results.push({
        name: "Image Data Structure",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 4: Reference Fields Structure
    setCurrentTest("Testing Reference Fields Structure...");
    try {
      const investigationsWithRefs = investigations.filter(
        (inv) => inv.referenceFields && inv.referenceFields.length > 0
      );

      if (investigationsWithRefs.length > 0) {
        const refField = investigationsWithRefs[0].referenceFields[0];

        const requiredRefFields = [
          "id",
          "x",
          "y",
          "width",
          "height",
          "albedoValue",
          "description",
          "type",
        ];
        const missingRefFields = requiredRefFields.filter(
          (field) => !(field in refField)
        );

        if (missingRefFields.length === 0) {
          results.push({
            name: "Reference Field Structure",
            status: "PASS",
            message: "Reference field has all required fields",
          });
        } else {
          results.push({
            name: "Reference Field Structure",
            status: "FAIL",
            message: `Missing reference field properties: ${missingRefFields.join(
              ", "
            )}`,
          });
        }

        // Test coordinate types
        if (
          typeof refField.x === "number" &&
          typeof refField.y === "number" &&
          typeof refField.width === "number" &&
          typeof refField.height === "number"
        ) {
          results.push({
            name: "Reference Field Coordinates",
            status: "PASS",
            message: "Reference field coordinates are numbers",
          });
        } else {
          results.push({
            name: "Reference Field Coordinates",
            status: "FAIL",
            message: "Reference field coordinates are not numbers",
          });
        }

        // Test albedo value
        if (
          typeof refField.albedoValue === "number" &&
          refField.albedoValue >= 0 &&
          refField.albedoValue <= 1
        ) {
          results.push({
            name: "Albedo Value Range",
            status: "PASS",
            message: `Albedo value is valid: ${refField.albedoValue}`,
          });
        } else {
          results.push({
            name: "Albedo Value Range",
            status: "FAIL",
            message: `Albedo value is invalid: ${refField.albedoValue}`,
          });
        }
      } else {
        results.push({
          name: "Reference Fields Structure",
          status: "SKIP",
          message: "No reference fields found",
        });
      }
    } catch (error) {
      results.push({
        name: "Reference Fields Structure",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 5: Measurements Structure
    setCurrentTest("Testing Measurements Structure...");
    try {
      const investigationsWithMeasurements = investigations.filter(
        (inv) => inv.measurements && inv.measurements.length > 0
      );

      if (investigationsWithMeasurements.length > 0) {
        const measurement = investigationsWithMeasurements[0].measurements[0];

        const requiredMeasurementFields = [
          "id",
          "x",
          "y",
          "width",
          "height",
          "albedoValue",
        ];
        const missingMeasurementFields = requiredMeasurementFields.filter(
          (field) => !(field in measurement)
        );

        if (missingMeasurementFields.length === 0) {
          results.push({
            name: "Measurement Structure",
            status: "PASS",
            message: "Measurement has all required fields",
          });
        } else {
          results.push({
            name: "Measurement Structure",
            status: "FAIL",
            message: `Missing measurement properties: ${missingMeasurementFields.join(
              ", "
            )}`,
          });
        }
      } else {
        results.push({
          name: "Measurements Structure",
          status: "SKIP",
          message: "No measurements found",
        });
      }
    } catch (error) {
      results.push({
        name: "Measurements Structure",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 6: LocalStorage Persistence
    setCurrentTest("Testing LocalStorage Persistence...");
    try {
      const savedData = localStorage.getItem("albedo-investigations");

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        if (Array.isArray(parsedData)) {
          results.push({
            name: "LocalStorage Data Format",
            status: "PASS",
            message: `LocalStorage contains ${parsedData.length} investigations`,
          });

          // Test if saved data matches current data
          if (parsedData.length === investigations.length) {
            results.push({
              name: "LocalStorage Sync",
              status: "PASS",
              message: "LocalStorage data matches current investigations",
            });
          } else {
            results.push({
              name: "LocalStorage Sync",
              status: "WARN",
              message: `LocalStorage has ${parsedData.length} investigations, current has ${investigations.length}`,
            });
          }
        } else {
          results.push({
            name: "LocalStorage Data Format",
            status: "FAIL",
            message: "LocalStorage data is not an array",
          });
        }
      } else {
        results.push({
          name: "LocalStorage Persistence",
          status: "SKIP",
          message: "No saved data in LocalStorage",
        });
      }
    } catch (error) {
      results.push({
        name: "LocalStorage Persistence",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 7: Function Availability
    setCurrentTest("Testing Function Availability...");
    try {
      const functions = [
        { name: "onNewInvestigation", func: onNewInvestigation },
        { name: "onOpenInvestigation", func: onOpenInvestigation },
        { name: "onDeleteInvestigation", func: onDeleteInvestigation },
      ];

      let availableFunctions = 0;

      functions.forEach(({ name, func }) => {
        if (typeof func === "function") {
          availableFunctions++;
        }
      });

      if (availableFunctions === functions.length) {
        results.push({
          name: "Function Availability",
          status: "PASS",
          message: "All required functions are available",
        });
      } else {
        results.push({
          name: "Function Availability",
          status: "FAIL",
          message: `Only ${availableFunctions}/${functions.length} functions available`,
        });
      }
    } catch (error) {
      results.push({
        name: "Function Availability",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    // Test 8: Data Validation
    setCurrentTest("Testing Data Validation...");
    try {
      let validInvestigations = 0;
      let totalInvestigations = investigations.length;

      investigations.forEach((inv) => {
        // Basic validation
        if (
          inv.id &&
          inv.name &&
          inv.year &&
          inv.location &&
          Array.isArray(inv.referenceFields) &&
          Array.isArray(inv.measurements)
        ) {
          validInvestigations++;
        }
      });

      if (validInvestigations === totalInvestigations) {
        results.push({
          name: "Data Validation",
          status: "PASS",
          message: `All ${totalInvestigations} investigations are valid`,
        });
      } else {
        results.push({
          name: "Data Validation",
          status: "FAIL",
          message: `Only ${validInvestigations}/${totalInvestigations} investigations are valid`,
        });
      }
    } catch (error) {
      results.push({
        name: "Data Validation",
        status: "FAIL",
        message: `Error: ${error.message}`,
      });
    }

    setCurrentTest("Workspace tests completed!");
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
      <h3 style={{ marginBottom: "16px" }}>Workspace Test Suite</h3>

      <div style={{ marginBottom: "20px" }}>
        <button
          className="btn btn-primary"
          onClick={runWorkspaceTests}
          disabled={isRunning}
        >
          {isRunning ? "Running Workspace Tests..." : "Run Workspace Tests"}
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
          <h4 style={{ marginBottom: "12px" }}>Workspace Test Results</h4>

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
            <strong>Workspace Status:</strong>{" "}
            {failedTests > 0
              ? `❌ ${failedTests} WORKSPACE TESTS FAILED`
              : warningTests > 0
              ? `⚠️ ${warningTests} WORKSPACE WARNINGS`
              : `✅ ALL WORKSPACE TESTS PASSED`}
            <br />
            <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              {passedTests}/{totalTests} workspace tests passed (
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
        <h4 style={{ marginBottom: "8px" }}>Workspace Information</h4>
        <div style={{ fontSize: "0.9rem" }}>
          <div>
            <strong>Total Investigations:</strong> {investigations.length}
          </div>
          <div>
            <strong>Investigations with Images:</strong>{" "}
            {investigations.filter((inv) => inv.image).length}
          </div>
          <div>
            <strong>Investigations with Reference Fields:</strong>{" "}
            {
              investigations.filter(
                (inv) => inv.referenceFields && inv.referenceFields.length > 0
              ).length
            }
          </div>
          <div>
            <strong>Investigations with Measurements:</strong>{" "}
            {
              investigations.filter(
                (inv) => inv.measurements && inv.measurements.length > 0
              ).length
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTestSuite;

