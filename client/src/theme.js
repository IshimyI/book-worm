import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

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

      "bw.accentSolidText": { default: "white", _dark: "#1a1f0a" },
      "bw.reviewHighlight": { default: "#f7f8ef", _dark: "#3a4022" },

      "bw.favoriteInactive": { default: "#6b7412", _dark: "#a3960f" },
    },
  },

});

export default theme;
