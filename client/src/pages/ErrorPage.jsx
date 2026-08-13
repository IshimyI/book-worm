import { Heading, Text, Button } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ArrowBackIcon } from "@chakra-ui/icons";
import PageCard from "../ui/PageCard";

export default function ErrorPage() {
  return (
    <PageCard maxW="500px" p="40px" textAlign="center">
      <Text fontSize="6xl" mb="10px">📚🔍</Text>
      <Heading as="h1" size="lg" mb="10px">Страница не найдена</Heading>
      <Text color="bw.textMuted" mb="30px">
        Такой страницы не существует — возможно, ссылка устарела или в адресе опечатка.
      </Text>
      <NavLink to="/">
        <Button backgroundColor="#334d00" color="white">
          <ArrowBackIcon mr="6px" /> На главную
        </Button>
      </NavLink>
    </PageCard>
  );
}
