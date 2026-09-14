/* eslint-disable react/prop-types */
import { Box, Center } from "@chakra-ui/react";

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
