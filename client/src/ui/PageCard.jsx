/* eslint-disable react/prop-types */
import { Box, Center } from "@chakra-ui/react";

// The "cream card on the bookshelf backdrop" wrapper used by every content
// page (book, profile, FAQ, privacy, terms, news, admin, 404) — was copied
// into all 8 of them individually as bg="#fffdf7" borderTop="4px solid
// #4b5320", which is also why none of them adapted to dark mode. Centralized
// here so dark mode only needs to be right in one place.
export default function PageCard({ maxW = "800px", children, ...boxProps }) {
  return (
    <Center py="40px" px="20px">
      <Box
        maxW={maxW}
        width="100%"
        bg="bw.cardBg"
        color="bw.text"
        borderRadius="lg"
        boxShadow="md"
        p="30px"
        borderTop="4px solid"
        borderTopColor="bw.accent"
        {...boxProps}
      >
        {children}
      </Box>
    </Center>
  );
}
