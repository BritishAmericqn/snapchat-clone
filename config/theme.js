export const Colors = {
  // 2nd Degree brand colors
  zimaBlue: "#61c2e3",     // Zima blue from Love Death + Robots - primary brand color
  primary: "#61c2e3",      // Primary brand color (same as zimaBlue for consistency)
  black: "#222222",        // Pure black for text and UI elements  
  white: "#ffffff",        // White backgrounds
  
  // Additional UI colors
  gray: "#8e8e93",         // For secondary text
  lightGray: "#f4f4f4",    // For backgrounds
  darkGray: "#333333",     // For dark backgrounds
  red: "#fc5c65",          // For errors
  blue: "#039be5",         // For links
  
  // Teal variations for different UI states
  lightTeal: "#7dd3ff",    // Lighter version of primary
  darkTeal: "#4ba3c7",     // Darker version of primary
  
  // Enhanced gradient colors
  deepBlack: "#1a1a1a",    // Deeper black for gradients
  charcoal: "#2d2d2d",     // Charcoal for mid-tones
  slate: "#404040",        // Slate for lighter mid-tones
  mutedTeal: "#4a8a9e",    // Muted teal for subtle accents
  darkTealAlpha: "rgba(75, 163, 199, 0.3)", // Dark teal with transparency
  zimaBlueAlpha: "rgba(97, 194, 227, 0.2)",  // Primary with transparency
  
  // Legacy colors (to avoid breaking existing components)
  orange: "#f57c00",       // Keep for now
  mediumGray: "#6e6869",   // Keep for compatibility
  green: "#4ecdc4",        // Keep for compatibility
  
  // Deprecated (gradually remove these)
  snapYellow: "#61c2e3",   // Redirect to new primary color
};

// Gradient definitions for dynamic backgrounds
export const Gradients = {
  // Primary app gradient - deep black to charcoal with subtle teal
  darkSwirl: {
    colors: [Colors.deepBlack, Colors.charcoal, Colors.darkGray],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.6, 1]
  },
  
  // Header gradient with subtle teal accent
  headerGradient: {
    colors: [Colors.black, Colors.charcoal, Colors.darkGray],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.8 },
    locations: [0, 0.7, 1]
  },
  
  // Subtle teal-infused dark gradient
  tealMist: {
    colors: [Colors.deepBlack, Colors.mutedTeal + '15', Colors.charcoal],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.3, 1]
  },
  
  // Light gradient for cards and elevated surfaces
  cardGradient: {
    colors: [Colors.white, Colors.lightGray + 'aa', Colors.white],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.5, 1]
  },
  
  // Active state gradient with prominent teal
  activeGradient: {
    colors: [Colors.primary, Colors.lightTeal, Colors.primary],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
    locations: [0, 0.5, 1]
  },
  
  // Subtle diagonal sweep
  diagonalSweep: {
    colors: [Colors.deepBlack, Colors.slate + '30', Colors.charcoal, Colors.deepBlack],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.3, 0.7, 1]
  },
  
  // Chat background with very subtle teal
  chatBackground: {
    colors: [Colors.white, Colors.zimaBlueAlpha + '10', Colors.lightGray + '50'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.4, 1]
  }
};
