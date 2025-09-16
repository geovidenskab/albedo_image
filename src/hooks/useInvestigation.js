import { useState, useEffect } from "react";

export const useInvestigation = () => {
  const [investigations, setInvestigations] = useState([]);

  // Load investigations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("albedo-investigations");
    if (saved) {
      try {
        setInvestigations(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading investigations:", error);
      }
    }
  }, []);

  // Compress image data to reduce localStorage usage
  const compressImageData = (investigations) => {
    return investigations.map((inv) => {
      if (inv.image && inv.image.url && inv.image.url.startsWith("data:")) {
        // Create a compressed version of the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Set canvas size to max 800px width while maintaining aspect ratio
        const maxWidth = 800;
        const aspectRatio =
          inv.image.dimensions?.height / inv.image.dimensions?.width || 1;
        canvas.width = Math.min(
          maxWidth,
          inv.image.dimensions?.width || maxWidth
        );
        canvas.height = canvas.width * aspectRatio;

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL("image/jpeg", 0.7); // 70% quality

          // Update the investigation with compressed image
          const updatedInv = {
            ...inv,
            image: {
              ...inv.image,
              url: compressedUrl,
              compressed: true,
            },
          };

          // Update localStorage with compressed version
          const updatedInvestigations = investigations.map((i) =>
            i.id === inv.id ? updatedInv : i
          );
          localStorage.setItem(
            "albedo-investigations",
            JSON.stringify(updatedInvestigations)
          );
        };

        img.src = inv.image.url;

        // Return original for now, will be updated async
        return inv;
      }
      return inv;
    });
  };

  // Manual save function - only save when user explicitly saves
  const saveInvestigations = () => {
    if (investigations.length > 0) {
      try {
        const dataToSave = JSON.stringify(investigations);

        // Check if data is too large (>5MB)
        if (dataToSave.length > 5 * 1024 * 1024) {
          console.warn(
            "Data too large for localStorage, compressing images..."
          );
          compressImageData(investigations);
        } else {
          localStorage.setItem("albedo-investigations", dataToSave);
          console.log("Investigations saved manually");
        }
      } catch (error) {
        console.error("Error saving to localStorage:", error);
        if (error.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded, compressing images...");
          compressImageData(investigations);
        }
      }
    }
  };

  const addInvestigation = (investigation) => {
    setInvestigations((prev) => [...prev, investigation]);
  };

  const updateInvestigation = (updatedInvestigation) => {
    console.log(
      "useInvestigation - updateInvestigation called with:",
      updatedInvestigation
    );
    console.log("useInvestigation - current investigations:", investigations);
    setInvestigations((prev) => {
      const updated = prev.map((inv) =>
        inv.id === updatedInvestigation.id ? updatedInvestigation : inv
      );
      console.log("useInvestigation - updated investigations:", updated);
      console.log(
        "useInvestigation - found investigation to update:",
        prev.find((inv) => inv.id === updatedInvestigation.id)
      );
      return updated;
    });
  };

  const deleteInvestigation = (investigationId) => {
    setInvestigations((prev) =>
      prev.filter((inv) => inv.id !== investigationId)
    );
  };

  const getInvestigationById = (id) => {
    return investigations.find((inv) => inv.id === id);
  };

  const getInvestigationsByYear = (year) => {
    return investigations.filter((inv) => inv.year === year);
  };

  const getInvestigationsByLocation = (locationName) => {
    return investigations.filter((inv) =>
      inv.location.name.toLowerCase().includes(locationName.toLowerCase())
    );
  };

  return {
    investigations,
    addInvestigation,
    updateInvestigation,
    deleteInvestigation,
    getInvestigationById,
    getInvestigationsByYear,
    getInvestigationsByLocation,
    saveInvestigations,
  };
};
