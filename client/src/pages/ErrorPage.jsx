import { Center, Box, Heading, Text, Button } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ArrowBackIcon } from "@chakra-ui/icons";

export default function ErrorPage() {
  return (
    <Center py="80px" px="20px">
      <Box maxW="500px" width="100%" bg="#fffdf7" borderRadius="lg" boxShadow="md" p="40px" borderTop="4px solid #4b5320" textAlign="center">
        <Text fontSize="6xl" mb="10px">📚🔍</Text>
        <Heading as="h1" size="lg" mb="10px">Страница не найдена</Heading>
        <Text color="gray.600" mb="30px">
          Такой страницы не существует — возможно, ссылка устарела или в адресе опечатка.
        </Text>
        <NavLink to="/">
          <Button backgroundColor="#334d00" color="white">
            <ArrowBackIcon mr="6px" /> На главную
          </Button>
        </NavLink>
      </Box>
    </Center>
  );
}
