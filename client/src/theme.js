import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Site-wide semantic tokens so a single useColorModeValue-driven surface
// (PageCard, catalog cards, review cards) can pull consistent colors
// instead of every page hardcoding its own light/dark hex pair.
const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      "bw.pageBg": { default: "#fffdf7", _dark: "#20201a" },
      "bw.cardBg": { default: "white", _dark: "#2a2a22" },
      "bw.border": { default: "#ddd", _dark: "#44443a" },
      "bw.text": { default: "gray.800", _dark: "gray.100" },
      "bw.textMuted": { default: "gray.600", _dark: "gray.400" },
      "bw.accent": { default: "#4b5320", _dark: "#a8b25a" },
      "bw.accentSolid": { default: "#334d00", _dark: "#7a8f2a" },
      // White text on bw.accentSolid's dark-mode value is only ~3.6:1 —
      // below the 4.5:1 minimum for text — because that green has to be
      // light enough to stand out from the dark card/page behind it
      // (a #334d00-dark button on a near-black background barely reads as
      // a button at all). Dark text stays readable on both: ~9.5:1 in
      // light mode against the very dark green, ~4.7:1 in dark mode.
      "bw.accentSolidText": { default: "white", _dark: "#1a1f0a" },
      "bw.reviewHighlight": { default: "#f7f8ef", _dark: "#3a4022" },
      // "Add to favorites" button's inactive state — same blend-into-the-
      // dark-card problem as bw.accentSolid (2.84:1 against the dark card,
      // below the 3:1 non-text minimum), same fix shape: lighten for dark
      // mode, pair with bw.accentSolidText instead of white.
      "bw.favoriteInactive": { default: "#6b7412", _dark: "#a3960f" },
    },
  },
  // The bookshelf texture behind every page is set with !important in
  // cssSvetlana.css and is dark/warm-toned enough to work unchanged in
  // both modes — dark mode instead changes the "paper" content cards on
  // top of it (bw.cardBg/pageBg) and their text, not the backdrop itself.
});

export default theme;
