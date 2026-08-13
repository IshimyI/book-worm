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
      "bw.reviewHighlight": { default: "#f7f8ef", _dark: "#3a4022" },
    },
  },
  // The bookshelf texture behind every page is set with !important in
  // cssSvetlana.css and is dark/warm-toned enough to work unchanged in
  // both modes — dark mode instead changes the "paper" content cards on
  // top of it (bw.cardBg/pageBg) and their text, not the backdrop itself.
});

export default theme;
