import {
  Box,
  Heading,
  FormControl,
  Input,
  Button,
  Link,
  Flex,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";

export default function SignUpPage({ handleSignUp, handleLogin }) {
  const navigate = useNavigate();
  const [firstPassword, setFirstPassword] = useState("");
  const [secondPassword, setSecondPassword] = useState("");
  const [bool, setBool] = useState(false);

  const handleCorrect = (e) => {
    e.preventDefault();
    if (firstPassword !== secondPassword) {
      alert("Ваши пароли не совпадают");
      return;
    }
    handleSignUp(e);
    navigate("/confirm-email");
  };

  return (
    <>
      <Box
        className="blockAuth"
        width={"400px"}
        mx="auto"
        mt={"60px"}
        p={"35px"}
        borderWidth="1px"
        borderRadius="25px"
        boxShadow="md"
      >
        {bool ? (
          <form onSubmit={handleCorrect}>
            <Heading as="h2" size="md" textAlign="center" mb={2}>
              Регистрация
            </Heading>

            <FormControl mb={2}>
              <Input
                mt={12}
                mb={4}
                placeholder="Name"
                name="name"
                type="text"
                id="name1"
              />
            </FormControl>

            <FormControl mb={2}>
              <Input
                mb={4}
                placeholder="Email"
                name="email"
                type="email"
                id="em1"
              />
            </FormControl>

            <FormControl mb={2}>
              <Input
                mb={4}
                placeholder="Пароль"
                name="password"
                type="password"
                id="pass1"
                value={firstPassword}
                onChange={(e) => setFirstPassword(e.target.value)}
              />
            </FormControl>

            <FormControl mb={2}>
              <Input
                mb={10}
                placeholder="Подтвердите пароль"
                name="password"
                type="password"
                id="pass2"
                value={secondPassword}
                onChange={(e) => setSecondPassword(e.target.value)}
              />
            </FormControl>

            <Button
              sx={{
                backgroundColor: "#334d00",
                color: "white",
              }}
              width="100%"
              mb={1}
              type="submit"
              size="sm"
            >
              Зарегистрироваться
            </Button>

            <Button
              m={"0 auto"}
              variant="link"
              sx={{
                color: "#334d00",
              }}
              onClick={() => setBool(false)}
              size="sm"
            >
              Уже есть аккаунт?
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <Heading as="h2" size="md" textAlign="center" mb={6}>
              Вход
            </Heading>

            <FormControl mb={6}>
              <Input placeholder="Email" name="email" type="email" id="em1" />
            </FormControl>

            <FormControl mb={10}>
              <Input
                name="password"
                type="password"
                id="pass1"
                placeholder="Пароль"
              />
            </FormControl>

            <Button
              sx={{
                backgroundColor: "#334d00",
                color: "white",
              }}
              width="100%"
              mb={1}
              type="submit"
              size="sm"
            >
              Войти
            </Button>
            <Flex columnGap={"20px"} mt={"20px"}>
              <Link
                m={"0 auto"}
                as={NavLink}
                to={"/recover"}
                display="block"
                textAlign="center"
                mb={1}
                fontSize="sm"
              >
                <Button
                  variant="link"
                  sx={{
                    color: "#334d00",
                  }}
                  size="sm"
                >
                  Забыли пароль?
                </Button>
              </Link>

              <Button
                m={"0 auto"}
                variant="link"
                sx={{
                  color: "#334d00",
                }}
                size="sm"
                onClick={() => setBool(true)}
              >
                Еще нет аккаунта?
              </Button>
            </Flex>
          </form>
        )}
      </Box>
      <div className="fonAuth"> </div>
      <div className="fonAuth2"> </div>
    </>
  );
}
