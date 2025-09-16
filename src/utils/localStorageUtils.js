// Utility functions for localStorage management

export const clearCorruptedLocalStorage = () => {
  const keysToCheck = [
    "showGrayscale",
    "albedo-investigations",
    "currentInvestigation",
  ];

  keysToCheck.forEach((key) => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Clearing corrupted localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
};

export const validateLocalStorageData = () => {
  const issues = [];

  try {
    const investigations = localStorage.getItem("albedo-investigations");
    if (investigations) {
      const parsed = JSON.parse(investigations);
      if (!Array.isArray(parsed)) {
        issues.push("albedo-investigations is not an array");
      }
    }
  } catch (error) {
    issues.push("albedo-investigations is corrupted");
  }

  try {
    const showGrayscale = localStorage.getItem("showGrayscale");
    if (showGrayscale) {
      const parsed = JSON.parse(showGrayscale);
      if (typeof parsed !== "boolean") {
        issues.push("showGrayscale is not a boolean");
      }
    }
  } catch (error) {
    issues.push("showGrayscale is corrupted");
  }

  return issues;
};

export const getLocalStorageSize = () => {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length;
    }
  }
  return totalSize;
};

export const clearAllAlbedoData = () => {
  const keysToRemove = [
    "albedo-investigations",
    "showGrayscale",
    "currentInvestigation",
    "albedo-test",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log("All Albedo data cleared from localStorage");
};

