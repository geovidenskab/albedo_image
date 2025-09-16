import React, { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Text,
  Group,
} from "react-konva";
import Konva from "konva";

const CanvasEditor = ({
  image,
  referenceFields,
  measurements,
  onReferenceFieldsUpdate,
  onMeasurementsUpdate,
  onImageUpload,
}) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const imageRef = useRef(null);
  const imageGroupRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate image boundaries for consistent positioning
  const getImageBoundaries = () => {
    if (!konvaImage || !konvaImage.width || !konvaImage.height) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    return {
      x: imagePosition.x,
      y: imagePosition.y,
      width: konvaImage.width * imageScale,
      height: konvaImage.height * imageScale,
    };
  };

  const [fallbackImage, setFallbackImage] = useState(null);
  const [mode, setMode] = useState("measurement"); // Enable measurement mode by default
  const [localReferenceFields, setLocalReferenceFields] = useState(
    referenceFields || []
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  // isMeasurementActive removed - marking is always active now
  // Custom reference image states removed

  // Use fallbackImage as the main image source - declared early to avoid hoisting issues
  const konvaImage = fallbackImage;

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    // Reset stage size based on mode
    setStageSize({ width: 800, height: 600 });

    // Reset stage position and scale
    const stage = stageRef.current;
    if (stage) {
      stage.position({ x: 0, y: 0 });
      stage.scale({ x: 1, y: 1 });
      stage.batchDraw();
    }

    console.log("CanvasEditor - Zoom reset applied");
  };

  // Rectangle zoom and drawing states
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
  const [rectangleStart, setRectangleStart] = useState(null);
  const [currentRectangle, setCurrentRectangle] = useState(null);

  // Measurement states removed - measurements only in new window

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05; // Smaller steps for better control
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Normal zoom direction (scroll up = zoom in, scroll down = zoom out)
    let direction = e.evt.deltaY > 0 ? -1 : 1;

    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit zoom range (allow up to 30x zoom = 3000%)
    const clampedScale = Math.max(0.2, Math.min(newScale, 30));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.position(newPos);
    setZoomLevel(clampedScale);
    stage.batchDraw();
  };

  // Handle rectangle zoom
  const handleRectangleZoom = (rect) => {
    if (!rect || !konvaImage) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Calculate zoom to fit rectangle
    const rectWidth = Math.abs(rect.width);
    const rectHeight = Math.abs(rect.height);
    const scaleX = stageSize.width / rectWidth;
    const scaleY = stageSize.height / rectHeight;
    const newScale = Math.min(scaleX, scaleY, 30); // Max 30x zoom

    // Calculate new position to center the rectangle
    const rectCenterX = rect.x + rectWidth / 2;
    const rectCenterY = rect.y + rectHeight / 2;

    const newPos = {
      x: stageSize.width / 2 - rectCenterX * newScale,
      y: stageSize.height / 2 - rectCenterY * newScale,
    };

    stage.position(newPos);
    stage.scale({ x: newScale, y: newScale });
    setZoomLevel(newScale);
    stage.batchDraw();

    console.log("CanvasEditor - Rectangle zoom applied:", {
      rect,
      newScale,
      newPos,
    });
  };

  // Removed old rectangle drawing - using simplified click method instead

  // Simple mouse move - update drawing rectangle
  const handleMouseMove = (e) => {
    if (!isDrawing || !drawingStart) return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer || !imageGroupRef.current) return;

    const transform = imageGroupRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const p = transform.point(pointer);

    setCurrentDrawing({
      x: Math.min(drawingStart.x, p.x),
      y: Math.min(drawingStart.y, p.y),
      width: Math.abs(p.x - drawingStart.x),
      height: Math.abs(p.y - drawingStart.y),
    });
  };

  // Calculate albedo for a measurement
  const calculateAlbedo = (measurement) => {
    if (
      !konvaImage ||
      !konvaImage.width ||
      !konvaImage.height ||
      localReferenceFields.length === 0
    )
      return 0;

    // Get reference field (use first one)
    const referenceField = localReferenceFields[0];
    const referenceAlbedo = referenceField.albedoValue;

    // Sample actual pixels from image canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match image
    canvas.width = konvaImage.width;
    canvas.height = konvaImage.height;

    // Draw image to canvas
    ctx.drawImage(konvaImage, 0, 0);

    // Sample reference field pixels
    let referenceMeanPixelValue;

    if (referenceField.hasThreeRectangles) {
      // For three-rectangle reference field, sample white rectangle (middle one)
      const rectWidth = Math.round(
        (referenceField.rectWidth || 25) * (canvas.width / stageSize.width)
      );
      const spacing = Math.round(
        (referenceField.spacing || 5) * (canvas.width / stageSize.width)
      );
      const rectHeight = Math.round(
        referenceField.height * (canvas.height / stageSize.height)
      );

      const refX = Math.round(
        referenceField.x * (canvas.width / stageSize.width)
      );
      const refY = Math.round(
        referenceField.y * (canvas.height / stageSize.height)
      );

      // Sample middle rectangle (white) for reference
      const whiteRectX = refX + rectWidth + spacing;
      const imageData = ctx.getImageData(
        whiteRectX,
        refY,
        rectWidth,
        rectHeight
      );
      referenceMeanPixelValue = calculateMeanPixelValue(imageData);
    } else if (referenceField.hasTwoRectangles) {
      // For two-rectangle reference field, sample both rectangles
      const rectWidth = Math.round(
        (referenceField.rectWidth || 25) * (canvas.width / stageSize.width)
      );
      const spacing = Math.round(
        (referenceField.spacing || 20) * (canvas.width / stageSize.width)
      );
      const rectHeight = Math.round(
        referenceField.height * (canvas.height / stageSize.height)
      );

      const refX1 = Math.round(
        referenceField.x * (canvas.width / stageSize.width)
      );
      const refY1 = Math.round(
        referenceField.y * (canvas.height / stageSize.height)
      );
      const refX2 = refX1 + rectWidth + spacing;

      // Sample first rectangle (dark gray)
      const rect1Data = ctx.getImageData(refX1, refY1, rectWidth, rectHeight);
      const rect1Mean = calculateMeanPixelValue(rect1Data);

      // Sample second rectangle (black)
      const rect2Data = ctx.getImageData(refX2, refY1, rectWidth, rectHeight);
      const rect2Mean = calculateMeanPixelValue(rect2Data);

      // Average of both rectangles
      referenceMeanPixelValue = (rect1Mean + rect2Mean) / 2;
    } else {
      // Original single rectangle sampling
      const refX = Math.round(
        referenceField.x * (canvas.width / stageSize.width)
      );
      const refY = Math.round(
        referenceField.y * (canvas.height / stageSize.height)
      );
      const refWidth = Math.round(
        referenceField.width * (canvas.width / stageSize.width)
      );
      const refHeight = Math.round(
        referenceField.height * (canvas.height / stageSize.height)
      );

      const referenceImageData = ctx.getImageData(
        refX,
        refY,
        refWidth,
        refHeight
      );
      referenceMeanPixelValue = calculateMeanPixelValue(referenceImageData);
    }

    // Sample measurement pixels
    const measX = Math.round(measurement.x * (canvas.width / stageSize.width));
    const measY = Math.round(
      measurement.y * (canvas.height / stageSize.height)
    );
    const measWidth = Math.round(
      measurement.width * (canvas.width / stageSize.width)
    );
    const measHeight = Math.round(
      measurement.height * (canvas.height / stageSize.height)
    );

    const measurementImageData = ctx.getImageData(
      measX,
      measY,
      measWidth,
      measHeight
    );
    const measurementMeanPixelValue =
      calculateMeanPixelValue(measurementImageData);

    // Calculate albedo: average pixel value divided by 256 (as per memory)
    const calculatedAlbedo = measurementMeanPixelValue / 256;

    console.log("CanvasEditor - Albedo calculation:", {
      measurement,
      measurementMeanPixelValue,
      calculatedAlbedo,
      formula: `${measurementMeanPixelValue} / 256 = ${calculatedAlbedo}`,
    });

    return Math.max(0, Math.min(1, calculatedAlbedo)); // Clamp between 0 and 1
  };

  // Helper function to calculate mean pixel value from ImageData
  const calculateMeanPixelValue = (imageData) => {
    const data = imageData.data;
    let total = 0;
    let count = 0;
    let totalR = 0,
      totalG = 0,
      totalB = 0;

    // Calculate mean of RGB values (convert to grayscale by averaging RGB)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Calculate grayscale value as simple average of RGB
      const grayscale = (r + g + b) / 3;
      total += grayscale;
      totalR += r;
      totalG += g;
      totalB += b;
      count++;
    }

    const meanGrayscale = count > 0 ? total / count : 0;
    const meanR = count > 0 ? totalR / count : 0;
    const meanG = count > 0 ? totalG / count : 0;
    const meanB = count > 0 ? totalB / count : 0;
    const albedo = meanGrayscale / 256;

    console.log("Pixel Analysis:");
    console.log("- Total pixels:", count);
    console.log("- Mean R:", meanR.toFixed(2));
    console.log("- Mean G:", meanG.toFixed(2));
    console.log("- Mean B:", meanB.toFixed(2));
    console.log("- Mean Grayscale:", meanGrayscale.toFixed(2));
    console.log("- Albedo (grayscale/256):", albedo.toFixed(2));

    return meanGrayscale;
  };

  // Auto-add reference field when starting measurements
  const autoAddReferenceField = () => {
    if (localReferenceFields.length === 0 && konvaImage) {
      const rectWidth = 40; // Width of each rectangle
      const spacing = 2; // Space between rectangles
      const totalWidth = rectWidth * 2 + spacing; // Total width for two rectangles
      const refHeight = 30; // Height of rectangles

      const newReferenceField = {
        id: `ref_${Date.now()}`,
        x: 50, // Moved further into the image from top-left corner
        y: 50, // Moved further into the image from top-left corner
        width: totalWidth,
        height: refHeight,
        albedoValue: 0.85, // Standard reference value for white surface
        type: "standard",
        label: "Reference",
      };

      const updatedFields = [...localReferenceFields, newReferenceField];
      setLocalReferenceFields(updatedFields);

      if (onReferenceFieldsUpdate) {
        onReferenceFieldsUpdate(updatedFields);
      }

      console.log("CanvasEditor - Auto-added reference field");
    }
  };

  // Removed - moved to after konvaImage declaration

  // Measurement functions removed - measurements only in new window

  // Load image using direct Image object (more reliable than use-image)
  useEffect(() => {
    if (image?.url) {
      console.log("CanvasEditor - Loading image:", image.url);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log(
          "CanvasEditor - Image loaded successfully:",
          img.width,
          "x",
          img.height
        );
        setFallbackImage(img);
      };
      img.onerror = (error) => {
        console.error("CanvasEditor - Image loading failed:", error);
      };
      img.src = image.url;
    } else {
      setFallbackImage(null);
    }
  }, [image?.url]);

  // Auto-add reference field when image is loaded
  useEffect(() => {
    if (fallbackImage && localReferenceFields.length === 0) {
      autoAddReferenceField();
    }
  }, [fallbackImage, localReferenceFields.length]);

  // Use fallbackImage as the main image source
  const imageStatus = fallbackImage
    ? "loaded"
    : image?.url
    ? "loading"
    : "failed";

  // Switch to measurement mode when requested

  // Sync with props
  useEffect(() => {
    if (referenceFields) {
      setLocalReferenceFields(referenceFields);
      if (referenceFields.length > 0 && mode === "reference") {
        setMode("measurement");
      }
    }
  }, [referenceFields, mode]);

  // Force update localReferenceFields when referenceFields prop changes
  useEffect(() => {
    if (referenceFields && referenceFields !== localReferenceFields) {
      setLocalReferenceFields(referenceFields);
      console.log(
        "CanvasEditor - Synced localReferenceFields with props:",
        referenceFields
      );
    }
  }, [referenceFields]);

  // Debug logging
  console.log("CanvasEditor - image:", image);
  console.log("CanvasEditor - image.url:", image?.url);
  console.log("CanvasEditor - konvaImage:", konvaImage);
  console.log("CanvasEditor - imageStatus:", imageStatus);
  console.log("CanvasEditor - stageSize:", stageSize);
  console.log("CanvasEditor - imageScale:", imageScale);
  console.log("CanvasEditor - imagePosition:", imagePosition);
  console.log("CanvasEditor - mode:", mode);
  console.log("CanvasEditor - localReferenceFields:", localReferenceFields);
  console.log("CanvasEditor - referenceFields prop:", referenceFields);
  console.log("CanvasEditor - measurements:", measurements);
  console.log("CanvasEditor - measurements.length:", measurements?.length);

  // Update stage size when container resizes
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        const rect = container.getBoundingClientRect();
        setStageSize({
          width: Math.min(800, rect.width - 40),
          height: Math.min(600, rect.height - 40),
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate image scale and position
  useEffect(() => {
    if (
      konvaImage &&
      konvaImage.width &&
      konvaImage.height &&
      stageSize.width &&
      stageSize.height
    ) {
      const scaleX = stageSize.width / konvaImage.width;
      const scaleY = stageSize.height / konvaImage.height;

      const scale = Math.min(scaleX, scaleY, 1);

      setImageScale(scale);
      setImagePosition({
        x: (stageSize.width - konvaImage.width * scale) / 2,
        y: (stageSize.height - konvaImage.height * scale) / 2,
      });

      console.log("CanvasEditor - Image scale calculated:", {
        imageSize: { width: konvaImage.width, height: konvaImage.height },
        stageSize,
        scale,
        position: {
          x: (stageSize.width - konvaImage.width * scale) / 2,
          y: (stageSize.height - konvaImage.height * scale) / 2,
        },
      });
    }
  }, [konvaImage, stageSize]);

  // Handle opening canvas in new window (removed)
  const openInNewWindow = () => {
    console.warn("openInNewWindow is disabled");
    return;
  };
  /*
  const openInNewWindow = () => {
    if (!image) {
      alert("Ingen billede at vise i nyt vindue");
      return;
    }

    // Create a new window
    const newWindow = window.open(
      "",
      "canvasWindow",
      "width=1400,height=900,scrollbars=yes,resizable=yes"
    );

    if (!newWindow) {
      alert(
        "Pop-up blokering forhindrer åbning af nyt vindue. Tillad pop-ups for denne side."
      );
      return;
    }

    // Create HTML content for the new window with full React app
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canvas Editor - ${image.name || "Billede"}</title>
        <script src="https://unpkg.com/konva@9/konva.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
          }
          .canvas-window-header {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .canvas-window-header h2 {
            margin: 0;
            color: #333;
          }
          .canvas-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: calc(100vh - 200px);
          }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 8px;
            margin-bottom: 8px;
          }
          .btn-primary { background: #007bff; color: white; }
          .btn-secondary { background: #6c757d; color: white; }
          .btn-success { background: #28a745; color: white; }
          .btn-warning { background: #ffc107; color: black; }
          .btn-info { background: #17a2b8; color: white; }
          .btn:hover { opacity: 0.8; }
          .canvas-controls {
            margin-bottom: 15px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .konva-container {
            border: 2px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            height: 70vh;
            min-height: 600px;
          }
        </style>
      </head>
      <body>
        <div class="canvas-window-header">
          <h2>Canvas Editor - ${image.name || "Billede"}</h2>
          <p>Dette vindue er synkroniseret med hovedvinduet. Luk dette vindue for at vende tilbage.</p>
        </div>
        <div class="canvas-container">
          <div class="canvas-controls">
            <button class="btn btn-success" onclick="toggleMeasurement()">Aktiver Markering</button>
            <button class="btn btn-primary" onclick="resetZoom()">Reset Zoom</button>
            <button class="btn btn-warning" onclick="clearAll()">Slet Alle</button>
            <span id="zoom-level">100%</span>
          </div>
          <div class="konva-container">
            <div id="konva-stage"></div>
          </div>
        </div>
        <script>
          let isMeasurementActive = false;
          let stage = null;
          let imageLayer = null;
          let referenceLayer = null;
          let measurementLayer = null;
          let currentImage = null;
          let referenceField = null;
          let measurements = [];
          let zoomLevel = 1;
          let imageScale = 1;
          let imagePosition = { x: 0, y: 0 };

          // Initialize the canvas
          function initCanvas() {
            console.log('Initializing canvas...');
            console.log('Konva available:', typeof Konva);
            
            if (typeof Konva === 'undefined') {
              console.error('Konva not loaded');
              alert('Kunne ikke indlæse Konva biblioteket');
              return;
            }
            
            const container = document.getElementById('konva-stage');
            if (!container) {
              console.error('Container not found');
              return;
            }
            
            const containerRect = container.getBoundingClientRect();
            console.log('Container size:', containerRect.width, 'x', containerRect.height);
            
            // Ensure minimum height if container height is 0
            const stageWidth = Math.max(containerRect.width - 4, 800);
            const stageHeight = Math.max(containerRect.height - 4, 600);
            
            console.log('Stage size:', stageWidth, 'x', stageHeight);
            
            stage = new Konva.Stage({
              container: 'konva-stage',
              width: stageWidth,
              height: stageHeight,
            });

            imageLayer = new Konva.Layer();
            referenceLayer = new Konva.Layer();
            measurementLayer = new Konva.Layer();

            stage.add(imageLayer);
            stage.add(referenceLayer);
            stage.add(measurementLayer);

            // Add event listeners after stage is initialized
            setupEventListeners();

            console.log('Canvas initialized successfully');
            
            // Image will be loaded via postMessage from parent window
            console.log('Waiting for image data...');
          }

          function setupEventListeners() {
            if (!stage) return;

            // Handle mouse events for measurements
            stage.on('mousedown', function(e) {
              console.log('Mouse down event, measurement active:', isMeasurementActive);
              
              if (!isMeasurementActive) {
                console.log('Measurement not active, ignoring click');
                return;
              }
              
              const pos = stage.getPointerPosition();
              console.log('Click position:', pos);
              console.log('Image position:', imagePosition);
              console.log('Image scale:', imageScale);
              
              if (!currentImage) {
                console.log('No current image');
                return;
              }
              
              // Calculate image bounds using original dimensions
              const imageWidth = currentImage.image().width * imageScale;
              const imageHeight = currentImage.image().height * imageScale;
              const imageRight = imagePosition.x + imageWidth;
              const imageBottom = imagePosition.y + imageHeight;
              
              console.log('Image bounds:', {
                left: imagePosition.x,
                top: imagePosition.y,
                right: imageRight,
                bottom: imageBottom,
                width: imageWidth,
                height: imageHeight
              });
              
              if (pos.x < imagePosition.x || pos.x > imageRight ||
                  pos.y < imagePosition.y || pos.y > imageBottom) {
                console.log('Click outside image bounds');
                return;
              }

              console.log('Starting measurement drawing');
              isDrawing = true;
              startPos = pos;
              
              currentRect = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                fill: 'rgba(220, 38, 127, 0.2)',
                stroke: '#dc267f',
                strokeWidth: 2,
                dash: [5, 5],
              });
              
              measurementLayer.add(currentRect);
              measurementLayer.draw();
            });

            stage.on('mousemove', function(e) {
              if (!isDrawing || !currentRect) return;
              
              const pos = stage.getPointerPosition();
              const width = pos.x - startPos.x;
              const height = pos.y - startPos.y;
              
              currentRect.width(Math.abs(width));
              currentRect.height(Math.abs(height));
              currentRect.x(width < 0 ? pos.x : startPos.x);
              currentRect.y(height < 0 ? pos.y : startPos.y);
              
              measurementLayer.draw();
            });

            stage.on('mouseup', function(e) {
              if (!isDrawing || !currentRect) return;
              
              console.log('Mouse up - finishing measurement');
              isDrawing = false;
              
              // Convert to solid rectangle
              currentRect.dash([]);
              currentRect.fill('rgba(220, 38, 127, 0.2)');
              
              // Add albedo text - use real calculation
              const realAlbedo = calculateAlbedo({
                x: currentRect.x(),
                y: currentRect.y(),
                width: currentRect.width(),
                height: currentRect.height()
              });
              const albedoValue = realAlbedo.toFixed(2);
              const albedoText = new Konva.Text({
                x: currentRect.x() + currentRect.width() / 2,
                y: currentRect.y() + currentRect.height() / 2,
                text: albedoValue,
                fontSize: 14,
                fontFamily: 'Arial',
                fill: '#000000',
                align: 'center',
                verticalAlign: 'middle',
                offsetX: 0,
                offsetY: 6,
              });
              
              measurementLayer.add(albedoText);
              measurementLayer.draw();
              
              // Store measurement data for persistence
              const measurementData = {
                id: 'meas_' + Date.now(),
                x: currentRect.x(),
                y: currentRect.y(),
                width: currentRect.width(),
                height: currentRect.height(),
                albedoValue: realAlbedo,
                description: 'Måling ' + (measurements.length + 1),
                type: 'measurement'
              };
              
              measurements.push(measurementData);
              console.log('Measurement completed, total measurements:', measurements.length);
              
              // Display all measurements including the new one
              if (typeof displayAllMeasurements === 'function') {
              displayAllMeasurements();
              }
              
              // Send measurements back to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'MEASUREMENTS_UPDATE',
                  measurements: measurements
                }, '*');
              }
              
              currentRect = null;
            });

            // Handle zoom
            stage.on('wheel', function(e) {
              e.evt.preventDefault();
              
              const scaleBy = 1.05;
              const oldScale = stage.scaleX();
              const pointer = stage.getPointerPosition();
              
              const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
              };
              
              const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
              const clampedScale = Math.max(0.2, Math.min(30, newScale));
              
              stage.scale({ x: clampedScale, y: clampedScale });
              
              const newPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale,
              };
              
              stage.position(newPos);
              stage.batchDraw();
              
              zoomLevel = clampedScale;
              document.getElementById('zoom-level').textContent = Math.round(zoomLevel * 100) + '%';
            });
          }

          function addReferenceField() {
            if (referenceField || !stage) return;

            const rectWidth = 40;
            const spacing = 2;
            const totalWidth = rectWidth * 2 + spacing;
            const rectHeight = 30;

            const group = new Konva.Group({
              x: 50,
              y: 50,
              draggable: true,
            });

            // White background box
            const bgRect = new Konva.Rect({
              x: -2,
              y: -2,
              width: totalWidth + 4,
              height: rectHeight + 20,
              fill: 'rgb(255, 255, 255)',
              stroke: '#000000',
              strokeWidth: 2,
            });

            // 100% rectangle
            const rect100 = new Konva.Rect({
              x: 0,
              y: 0,
              width: rectWidth,
              height: rectHeight,
              fill: 'rgb(255, 255, 255)',
            });

            const text100 = new Konva.Text({
              x: rectWidth / 2,
              y: rectHeight / 2,
              text: '100%',
              fontSize: 12,
              fontFamily: 'Arial',
              fill: '#000000',
              align: 'center',
              verticalAlign: 'middle',
              offsetX: 0,
              offsetY: 0,
            });

            // 70% rectangle
            const rect70 = new Konva.Rect({
              x: rectWidth + spacing,
              y: 0,
              width: rectWidth,
              height: rectHeight,
              fill: 'rgb(220, 220, 220)',
            });

            const text70 = new Konva.Text({
              x: rectWidth + spacing + rectWidth / 2,
              y: rectHeight / 2,
              text: '70%',
              fontSize: 12,
              fontFamily: 'Arial',
              fill: '#000000',
              align: 'center',
              verticalAlign: 'middle',
              offsetX: 0,
              offsetY: 0,
            });

            // Reference label inside the card
            const referenceLabel = new Konva.Text({
              x: totalWidth / 2,
              y: -2,
              text: 'Reference',
              fontSize: 10,
              fontFamily: 'Arial',
              fontStyle: 'bold',
              fill: '#000000',
              align: 'center',
              verticalAlign: 'middle',
              offsetX: 0,
              offsetY: 0,
            });

            group.add(bgRect);
            group.add(rect100);
            group.add(text100);
            group.add(rect70);
            group.add(text70);
            group.add(referenceLabel);

            referenceField = group;
            referenceLayer.add(group);
            referenceLayer.draw();
          }

          function toggleMeasurement() {
            isMeasurementActive = !isMeasurementActive;
            const btn = document.querySelector('button[onclick="toggleMeasurement()"]');
            if (btn) {
              btn.textContent = isMeasurementActive ? 'Markering Aktiv' : 'Aktiver Markering';
              btn.className = isMeasurementActive ? 'btn btn-success' : 'btn btn-secondary';
            }
            console.log('Measurement active:', isMeasurementActive);
          }

          function resetZoom() {
            if (currentImage) {
              currentImage.scaleX(imageScale);
              currentImage.scaleY(imageScale);
              currentImage.position(imagePosition);
              imageLayer.draw();
              zoomLevel = 1;
              document.getElementById('zoom-level').textContent = '100%';
            }
          }

          function clearAll() {
            if (confirm('Er du sikker på at du vil slette alle målinger?')) {
              measurements = [];
              measurementLayer.destroyChildren();
              measurementLayer.draw();
            }
          }

          // Mouse event variables
          let isDrawing = false;
          let startPos = null;
          let currentRect = null;

          // Initialize canvas when page loads
          window.addEventListener('load', function() {
            console.log('Page loaded, initializing canvas...');
            setTimeout(initCanvas, 100); // Small delay to ensure DOM is ready
          });
          
          window.addEventListener('resize', function() {
            if (stage) {
              const container = document.getElementById('konva-stage');
              const containerRect = container.getBoundingClientRect();
              stage.size({
                width: containerRect.width - 4,
                height: containerRect.height - 4,
              });
            }
          });

          // Listen for messages from parent window
          window.addEventListener('message', function(event) {
            console.log('Message received in new window:', event.data);
            
            if (event.data.type === 'IMAGE_DATA') {
              console.log('Image data received:', event.data);
              
              if (event.data.imageData) {
                console.log('Using base64 image data');
                // Use base64 image data
                const img = new Image();
                img.onload = function() {
                  console.log('Base64 image loaded successfully');
                  loadImageFromData(img);
                };
                img.onerror = function() {
                  console.error('Failed to load base64 image');
                  alert('Kunne ikke indlæse billedet.');
                };
                img.src = event.data.imageData;
              } else if (event.data.imageUrl) {
                console.log('Using image URL');
                // Use image URL
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                  console.log('URL image loaded successfully');
                  loadImageFromData(img);
                };
                img.onerror = function() {
                  console.error('Failed to load image from URL:', event.data.imageUrl);
                  alert('Kunne ikke indlæse billedet fra URL.');
                };
                img.src = event.data.imageUrl;
              }
            } else if (event.data.type === 'CANVAS_DATA') {
              console.log('Canvas data received:', event.data);
            } else {
              console.log('Unknown message type:', event.data.type);
            }
          });

          function loadImageFromData(img) {
            console.log('Loading image from data:', img.width, 'x', img.height);
            
            if (!stage) {
              console.error('Stage not initialized yet');
              setTimeout(() => loadImageFromData(img), 100);
              return;
            }
            
            console.log('Stage dimensions:', stage.width(), 'x', stage.height());
            
            currentImage = new Konva.Image({
              x: 0,
              y: 0,
              image: img,
              draggable: true,
            });

            // Scale image to fit
            const maxWidth = stage.width() - 100;
            const maxHeight = stage.height() - 100;
            const scaleX = maxWidth / img.width;
            const scaleY = maxHeight / img.height;
            imageScale = Math.min(scaleX, scaleY, 1);
            
            console.log('Image scale:', imageScale);
            console.log('Max dimensions:', maxWidth, 'x', maxHeight);
            
            currentImage.scaleX(imageScale);
            currentImage.scaleY(imageScale);
            
            // Center the image
            imagePosition.x = (stage.width() - img.width * imageScale) / 2;
            imagePosition.y = (stage.height() - img.height * imageScale) / 2;
            currentImage.position(imagePosition);

            console.log('Image position:', imagePosition);

            imageLayer.add(currentImage);
            imageLayer.draw();

            console.log('Image added to canvas successfully');

            // Function to display all measurements
            window.displayAllMeasurements = function() {
              // Clear existing measurements first
              measurementLayer.destroyChildren();
              
              measurements.forEach(function(measurement) {
                const rect = new Konva.Rect({
                  x: measurement.x,
                  y: measurement.y,
                  width: measurement.width,
                  height: measurement.height,
                  fill: 'rgba(220, 38, 127, 0.2)',
                  stroke: '#dc267f',
                  strokeWidth: 2,
                  dash: []
                });
                
                const albedoText = new Konva.Text({
                  x: measurement.x + measurement.width / 2,
                  y: measurement.y + measurement.height / 2,
                  text: measurement.albedoValue.toFixed(2),
                  fontSize: 14,
                  fontFamily: 'Arial',
                  fill: '#000000',
                  align: 'center',
                  verticalAlign: 'middle',
                  offsetX: 0,
                  offsetY: 6,
                });
                
                measurementLayer.add(rect);
                measurementLayer.add(albedoText);
              });
              measurementLayer.draw();
            };
            
            // Add reference field
            addReferenceField();
            
            // Display measurements when image is loaded
            setTimeout(() => {
              if (typeof displayAllMeasurements === 'function') {
                displayAllMeasurements();
              }
            }, 100);
          }
        </script>
      </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // Store reference to the new window
    window.canvasWindow = newWindow;

    // Listen for measurements from the new window
    const handleMessage = (event) => {
      if (event.data.type === "MEASUREMENTS_UPDATE") {
        console.log(
          "Received measurements from new window:",
          event.data.measurements
        );
        onMeasurementsUpdate(event.data.measurements);
      }
    };

    window.addEventListener("message", handleMessage);

    // Send image data to the new window
    if (image && image.url) {
      console.log("Sending image data to new window...");

      // Wait a bit for the new window to be fully loaded
      setTimeout(() => {
        // Try to convert image to base64 for better compatibility
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          console.log("Image loaded for conversion, creating base64...");
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const base64Image = canvas.toDataURL("image/png");
          console.log("Base64 image created, sending to new window...");

          // Send the base64 image to the new window
          newWindow.postMessage(
            {
              type: "IMAGE_DATA",
              imageData: base64Image,
              imageName: image.name || "Billede",
            },
            "*"
          );
          console.log("Image data sent to new window");
        };
        img.onerror = function () {
          console.log(
            "Failed to load image for conversion, sending URL instead..."
          );
          // Fallback: send the original URL
          newWindow.postMessage(
            {
              type: "IMAGE_DATA",
              imageUrl: image.url,
              imageName: image.name || "Billede",
            },
            "*"
          );
          console.log("Image URL sent to new window");
        };
        img.src = image.url;
      }, 500); // Wait 500ms for new window to be ready
    } else {
      console.error("No image data available to send");
    }

    // Handle window close
    newWindow.addEventListener("beforeunload", () => {
      window.canvasWindow = null;
      window.removeEventListener("message", handleMessage);
    });

    console.log("Canvas opened in new window");
  };
  */

  // Handle selection
  const handleSelect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  // Handle mouse down for drawing measurements
  // Use the SAME coordinate conversion as handleStageClick!
  const handleMouseDown = (e) => {
    console.log("CORRECT marking - Mouse down!");

    // Get click position from stage, convert to image coordinates
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition || !imageGroupRef.current) return;

    const transform = imageGroupRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const p = transform.point(pointerPosition);

    console.log("Click position (stage):", pointerPosition);
    console.log("Image position:", imagePosition);
    console.log("Image scale:", imageScale);

    // Convert stage -> image coords via inverse transform
    const imageX = p.x;
    const imageY = p.y;

    console.log("Converted to image coords:", { imageX, imageY });

    // Start drawing; store image coords and show image-space rect
    setIsDrawing(true);
    setDrawingStart({ x: imageX, y: imageY });
    setCurrentDrawing({ x: imageX, y: imageY, width: 0, height: 0 });

    console.log("Started drawing with CORRECT coords!");
  };

  // Simple mouse up - finish marking
  const handleMouseUp = (e) => {
    console.log("CORRECT marking - Mouse up!");

    if (!isDrawing || !currentDrawing || !drawingStart) {
      console.log("Not drawing - ignoring");
      return;
    }

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition || !imageGroupRef.current) return;

    console.log("End position (stage):", pointerPosition);

    const transform = imageGroupRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const p = transform.point(pointerPosition);
    const imageX = p.x;
    const imageY = p.y;

    // Calculate rectangle using image coordinates
    const width = Math.abs(imageX - drawingStart.x);
    const height = Math.abs(imageY - drawingStart.y);

    console.log("Rectangle size:", { width, height });
    console.log("Drawing start:", drawingStart);
    console.log("End position:", { imageX, imageY });

    // Only create if big enough
    if (width > 10 && height > 10) {
      // Use image coordinates (SAME as handleStageClick)
      const newMeasurement = {
        x: Math.min(drawingStart.x, imageX),
        y: Math.min(drawingStart.y, imageY),
        width: width,
        height: height,
      };

      // Real albedo calculation from pixel data
      const calculatedAlbedo = calculateAlbedo(newMeasurement);

      console.log("Calculated albedo:", calculatedAlbedo);

      // Create measurement with temporary name first
      const tempName = `Måling ${(measurements?.length || 0) + 1}`;
      const measurementData = {
        id: `meas_${Date.now()}`,
        x: newMeasurement.x,
        y: newMeasurement.y,
        width: newMeasurement.width,
        height: newMeasurement.height,
        albedoValue: calculatedAlbedo,
        description: tempName,
        type: "measurement",
      };

      console.log("=== MEASUREMENT CREATED ===");
      console.log("Measurement data:", measurementData);
      console.log("Calculated albedo:", calculatedAlbedo);
      console.log("Current measurements count:", measurements?.length || 0);
      console.log("New measurements array:", [
        ...(measurements || []),
        measurementData,
      ]);

      // Save it immediately so it shows up
      if (onMeasurementsUpdate) {
        onMeasurementsUpdate([...(measurements || []), measurementData]);
        console.log("Called onMeasurementsUpdate with new measurement");
      } else {
        console.log("ERROR: onMeasurementsUpdate is not available!");
      }

      // Then ask for name after a short delay
      setTimeout(() => {
        const newName = prompt(`Navn for denne måling:`, tempName);
        if (newName !== null && newName !== tempName) {
          // Update the measurement with new name
          const updatedMeasurements = (measurements || []).map((m) =>
            m.id === measurementData.id ? { ...m, description: newName } : m
          );
          if (onMeasurementsUpdate) {
            onMeasurementsUpdate(updatedMeasurements);
          }
        }
      }, 100);
    } else {
      console.log("Rectangle too small - ignoring");
    }

    // Reset
    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);

    console.log("Reset drawing state");
  };

  // Handle rectangle creation (legacy - for reference fields)
  const handleStageClick = (e) => {
    // Only handle clicks if not in measurement mode
    if (mode !== "reference") return;

    console.log("CanvasEditor - Stage clicked:", e.target);

    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();

      console.log("CanvasEditor - Click position:", pointerPosition);
      console.log("CanvasEditor - Image position:", imagePosition);
      console.log("CanvasEditor - Image scale:", imageScale);

      // Convert stage coordinates to image coordinates
      const imageX = (pointerPosition.x - imagePosition.x) / imageScale;
      const imageY = (pointerPosition.y - imagePosition.y) / imageScale;

      console.log("CanvasEditor - Converted to image coords:", {
        imageX,
        imageY,
      });

      // Only create field if click is within image bounds
      if (
        konvaImage &&
        konvaImage.width &&
        konvaImage.height &&
        imageX >= 0 &&
        imageX <= konvaImage.width &&
        imageY >= 0 &&
        imageY <= konvaImage.height
      ) {
        console.log("CanvasEditor - Click within image bounds, creating", mode);

        if (mode === "reference") {
          // Create new reference field
          const newField = {
            id: `ref_${Date.now()}`,
            x: pointerPosition.x - 25, // Center the rectangle on click
            y: pointerPosition.y - 25,
            width: 50,
            height: 50,
            albedoValue: 0.7, // Standard reference value
            description: `Reference Field ${localReferenceFields.length + 1}`,
            type: "reference",
          };

          console.log("Creating new reference field:", newField);
          setLocalReferenceFields([...localReferenceFields, newField]);

          // Automatically switch to measurement mode after creating reference
          setMode("measurement");
          console.log(
            "CanvasEditor - Switched to measurement mode after reference creation"
          );
        }
      } else {
        console.log(
          "CanvasEditor - Click outside image bounds or no image loaded"
        );
      }
    }
  };

  // Handle rectangle drag
  const handleDragEnd = (e) => {
    const id = e.target.id();

    // Check if it's a reference field
    const refField = localReferenceFields.find((f) => f.id === id);
    if (refField) {
      const newFields = localReferenceFields.map((field) => {
        if (field.id === id) {
          return {
            ...field,
            x: e.target.x(),
            y: e.target.y(),
          };
        }
        return field;
      });
      setLocalReferenceFields(newFields);
      onReferenceFieldsUpdate(newFields);
      return;
    }

    // Check if it's a measurement
    const measurement = measurements.find((m) => m.id === id);
    if (measurement) {
      const newMeasurements = measurements.map((meas) => {
        if (meas.id === id) {
          return {
            ...meas,
            x: e.target.x(),
            y: e.target.y(),
          };
        }
        return meas;
      });
      onMeasurementsUpdate(newMeasurements);
    }
  };

  // Handle rectangle resize
  const handleTransformEnd = (e) => {
    const id = e.target.id();
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    // Check if it's a reference field (check both referenceFields and localReferenceFields)
    const refField = localReferenceFields.find((f) => f.id === id);
    if (refField) {
      const newFields = localReferenceFields.map((field) => {
        if (field.id === id) {
          return {
            ...field,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          };
        }
        return field;
      });
      setLocalReferenceFields(newFields);
      if (onReferenceFieldsUpdate) {
        onReferenceFieldsUpdate(newFields);
      }
      return;
    }

    // Check if it's a measurement
    const measurement = measurements.find((m) => m.id === id);
    if (measurement) {
      const newMeasurements = measurements.map((meas) => {
        if (meas.id === id) {
          const updatedMeasurement = {
            ...meas,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          };
          // Recalculate albedo for resized measurement
          updatedMeasurement.albedoValue = calculateAlbedo(updatedMeasurement);
          return updatedMeasurement;
        }
        return meas;
      });
      onMeasurementsUpdate(newMeasurements);
    }
  };

  if (!image) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#212529" }}>
          Canvas Editor
        </h3>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6c757d",
            background: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #dee2e6",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
            Ingen billede uploadet endnu
          </p>
          <p style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
            Upload et billede for at starte albedo måling
          </p>
          <div style={{ marginTop: "20px" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                // Trigger file input
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file && onImageUpload) {
                    // Handle file upload
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageData = {
                        url: event.target.result,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                      };
                      onImageUpload(imageData);
                    };
                    reader.readAsDataURL(file);
                  } else if (file) {
                    alert("Upload funktionalitet ikke tilgængelig");
                  }
                };
                input.click();
              }}
              style={{
                fontSize: "1rem",
                padding: "12px 24px",
                fontWeight: "600",
              }}
            >
              Upload Billede
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (imageStatus === "loading") {
    return (
      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#212529" }}>
          Canvas Editor
        </h3>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6c757d",
            background: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #dee2e6",
          }}
        >
          <div className="loading" style={{ margin: "0 auto 16px" }}></div>
          <p>Indlæser billede...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (imageStatus === "failed") {
    return (
      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#212529" }}>
          Canvas Editor
        </h3>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#dc3545",
            background: "#f8d7da",
            borderRadius: "12px",
            border: "1px solid #f5c6cb",
          }}
        >
          <p>Fejl ved indlæsning af billede. Prøv at uploade igen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px", color: "#212529" }}>Canvas Editor</h3>

      <div
        style={{
          display: "flex",
          gap: "20px",
          height: "calc(100vh - 200px)",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "300px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            overflowY: "auto",
          }}
        >
          {/* Canvas Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Only show Clear All if there are fields to clear */}
            {(localReferenceFields.length > 0 || measurements.length > 0) && (
              <button
                className="btn btn-warning"
                onClick={() => {
                  setLocalReferenceFields([]);
                  onMeasurementsUpdate([]);
                  setSelectedId(null);
                  console.log(
                    "CanvasEditor - Cleared all fields and measurements"
                  );
                }}
                style={{ fontSize: "0.9rem", width: "100%" }}
              >
                Slet Alle
              </button>
            )}
            <button
              className="btn btn-success"
              style={{ fontSize: "0.9rem", width: "100%" }}
              title="Klik og træk for at markere!"
            >
              Markering Aktiv
            </button>
            {/* Removed: Open in new window button */}
            {/* Zoom Controls */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                className="btn btn-secondary"
                onClick={handleZoomReset}
                style={{ fontSize: "0.9rem", width: "100%" }}
                title="Reset Zoom"
              >
                Reset Zoom
              </button>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#495057",
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </span>
                <br />
                <span style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                  Træk firkant for zoom
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Konva Stage */}
          <div
            style={{
              border: "2px solid #dee2e6",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#f8f9fa",
              flex: 1,
            }}
          >
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={(e) => {
                handleSelect(e);
                handleMouseDown(e);
              }}
              onMouseUp={(e) => {
                handleSelect(e);
                handleMouseUp(e);
              }}
              onClick={handleStageClick}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              ref={stageRef}
            >
              <Layer>
                <Group
                  ref={imageGroupRef}
                  x={imagePosition.x}
                  y={imagePosition.y}
                  scaleX={imageScale}
                  scaleY={imageScale}
                >
                  {/* Background Image */}
                  {konvaImage && (
                    <KonvaImage
                      ref={imageRef}
                      image={konvaImage}
                      x={0}
                      y={0}
                      scaleX={1}
                      scaleY={1}
                      onLoad={() => {
                        console.log("CanvasEditor - KonvaImage loaded");
                        const stage = stageRef.current;
                        if (stage) stage.batchDraw();
                      }}
                    />
                  )}

                  {/* Reference Fields */}
                  {localReferenceFields.map((field) => {
                    const rectWidth = 40; // Width of each rectangle
                    const spacing = 2; // Space between rectangles
                    const totalWidth = rectWidth * 2 + spacing; // Total width for two rectangles
                    const rectHeight = field.height;

                    return (
                      <Group
                        key={field.id}
                        id={field.id}
                        draggable
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          setSelectedId(field.id);
                        }}
                        onTap={(e) => {
                          e.cancelBubble = true;
                          setSelectedId(field.id);
                        }}
                      >
                        {/* White background box around the entire reference field */}
                        <Rect
                          x={field.x - 2}
                          y={field.y - 2}
                          width={totalWidth + 4}
                          height={rectHeight + 20}
                          fill="rgb(255, 255, 255)"
                          stroke="#000000"
                          strokeWidth={2}
                        />

                        {/* 100% white rectangle */}
                        <Rect
                          x={field.x}
                          y={field.y}
                          width={rectWidth}
                          height={rectHeight}
                          fill="rgb(255, 255, 255)"
                        />
                        <Text
                          x={field.x + rectWidth / 2}
                          y={field.y + rectHeight / 2}
                          text="100%"
                          fontSize={12}
                          fontFamily="Arial"
                          fontStyle="normal"
                          fill="#000000"
                          align="center"
                          verticalAlign="middle"
                          offsetX={0}
                          offsetY={0}
                        />

                        {/* 70% gray rectangle */}
                        <Rect
                          x={field.x + rectWidth + spacing}
                          y={field.y}
                          width={rectWidth}
                          height={rectHeight}
                          fill="rgb(220, 220, 220)"
                        />
                        <Text
                          x={field.x + rectWidth + spacing + rectWidth / 2}
                          y={field.y + rectHeight / 2}
                          text="70%"
                          fontSize={12}
                          fontFamily="Arial"
                          fontStyle="normal"
                          fill="#000000"
                          align="center"
                          verticalAlign="middle"
                          offsetX={0}
                          offsetY={0}
                        />

                        {/* Reference label inside the card */}
                        <Text
                          x={field.x + totalWidth / 2}
                          y={field.y - 2}
                          text="Reference"
                          fontSize={10}
                          fontFamily="Arial"
                          fontStyle="bold"
                          fill="#000000"
                          align="center"
                          verticalAlign="middle"
                          offsetX={0}
                          offsetY={0}
                        />
                      </Group>
                    );
                  })}

                  {/* Current Rectangle Being Drawn */}
                  {currentRectangle && (
                    <Rect
                      x={currentRectangle.x}
                      y={currentRectangle.y}
                      width={currentRectangle.width}
                      height={currentRectangle.height}
                      fill="rgba(255, 0, 0, 0.2)"
                      stroke="#ff0000"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  )}

                  {/* Current Measurement Being Drawn */}
                  {currentDrawing && (
                    <Rect
                      x={currentDrawing.x}
                      y={currentDrawing.y}
                      width={currentDrawing.width}
                      height={currentDrawing.height}
                      fill="rgba(255, 255, 0, 0.3)"
                      stroke="#ffd700"
                      strokeWidth={3}
                      dash={[8, 4]}
                    />
                  )}

                  {/* Measurements (in image coordinates inside imageGroup) */}
                  {measurements &&
                    measurements.map((measurement) => (
                      <Group key={measurement.id}>
                        <Rect
                          x={measurement.x}
                          y={measurement.y}
                          width={measurement.width}
                          height={measurement.height}
                          fill="rgba(255, 255, 0, 0.2)"
                          stroke="#ffd700"
                          strokeWidth={2}
                          dash={[]}
                        />
                        <Text
                          x={measurement.x + measurement.width / 2}
                          y={measurement.y + measurement.height / 2}
                          text={
                            measurement.albedoValue
                              ? measurement.albedoValue.toFixed(2)
                              : "0.000"
                          }
                          fontSize={14}
                          fontFamily="Arial"
                          fontStyle="bold"
                          fill="#000000"
                          align="center"
                          verticalAlign="middle"
                          offsetX={0}
                          offsetY={6}
                        />
                        <Text
                          x={measurement.x}
                          y={measurement.y - 20}
                          text={measurement.description || "Måling"}
                          fontSize={12}
                          fontFamily="Arial"
                          fill="#000000"
                          align="left"
                        />
                      </Group>
                    ))}
                </Group>

                {/* Transformer for selected shape */}
                {selectedId && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                    onTransformEnd={handleTransformEnd}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
