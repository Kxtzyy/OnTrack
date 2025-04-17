import React, { createContext, useContext, useState } from "react";

// Define themes
const themes = {
  dark: {
    "101010": "#101010", // Background color
    "FFFFFF": "#FFFFFF", // Text color
    "1E1E1E": "#1E1E1E", // Card background color
    "4CAF50": "#4CAF50", // Progress color
    "4CAF50-light": "#4CAF50", // Light mode progress color
    "333": "#333", // Unfilled progress color
    lightgreen: 'lightgreen', // Progress bar color
    gray: 'gray', // Secondary text color
    dimgray: 'dimgray', // Border color
    black: 'black', // General black color
     red: 'red', // Delete button background
    "a30a0a": "#a30a0a", // Cross button background
    "860B0B": "#860B0B", // Cross button border
    "075F28": "#075F28", // Tick button background
    "094F23": "#094F23", // Tick button border
    "06402B": "#06402B", // Goal button background
    "950606": "#950606", // Limit button background
    "E53935": "#E53935", // Gradient start (red)
    "FFDCD1": "#FFDCD1", // Gradient end (light red)
    "0041C2": "#0041C2", // Gradient start (blue)
    "E0B0FF": "#E0B0FF", // Gradient end (light purple)
    lightblue: 'lightblue', // Toggle text color
    transparent: 'transparent', // Transparent background
    green: 'green', // Confirm button background
    white: 'white',
    "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.8)", // Modal background color
  },
  light: {
    "101010": "#FFFFFF", // Background color
    "FFFFFF": "#000000", // Text color
    "1E1E1E": "#F5F5F5", // Card background color
    "4CAF50": "#4CAF50", // Progress color
    "4CAF50-light": "#4CAF50", // Light mode progress color
    "333": "#DDD", // Unfilled progress color
    lightgreen: "#4CAF50", // Progress bar color
    gray: "#555555", // Secondary text color
    dimgray: "#E0E0E0", // Border color
    black: 'white', // General black color
    red: "#FF0000", // Delete button background
    "a30a0a": "#FFCCCC", // Cross button background
    "860B0B": "#FF9999", // Cross button border
    "075F28": "#CCFFCC", // Tick button background
    "094F23": "#99FF99", // Tick button border
    "06402B": "#99FF99", // Goal button background
    "950606": "#FF6666", // Limit button background
    "E53935": "#FF9999", // Gradient start (red)
    "FFDCD1": "#FFE6E6", // Gradient end (light red)
    "0041C2": "#99CCFF", // Gradient start (blue)
    "E0B0FF": "#F5E6FF", // Gradient end (light purple)
    lightblue: 'darkblue', // Toggle text color
    transparent: "transparent", // Transparent background
    green: "#00FF00", // Confirm button background
    white: 'black',
    "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)", // Modal background color
  },
};

// Create the context
const ThemeContext = createContext({
        isDarkMode: true,
        toggleTheme: () => {},
        currentTheme: themes.dark,
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [isDarkMode, setIsDarkMode] = useState(true);
        const currentTheme = isDarkMode ? themes.dark : themes.light;
      
        const toggleTheme = () => {
          console.log("Toggling theme...");
          setIsDarkMode((prevMode) => !prevMode);
        };
      
        return (
          <ThemeContext.Provider value={{ isDarkMode, toggleTheme, currentTheme }}>
            {children}
          </ThemeContext.Provider>
        );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);