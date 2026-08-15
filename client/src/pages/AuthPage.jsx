import {
  Box,
  Heading,
  Text,
  FormControl,
  Input,
  Button,
  Link,
  Flex,
  useToast,
} from "@chakra-ui/react";
/* eslint-disable react/prop-types */
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

export default function SignUpPage({ handleSignUp, handleLogin, handleVerifyTwoFactor }) {
  const navigate = useNavigate();
  const [firstPassword, setFirstPassword] = useState("");
  const [secondPassword, setSecondPassword] = useState("");
  const [bool, setBool] = useState(false);
  const [formRenderedAt] = useState(() => Date.now());
  const [challengeToken, setChallengeToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const toast = useToast();

  const handleCorrect = async (e) => {
    e.preventDefault();
    if (firstPassword !== secondPassword) {
      alert("Ваши пароли не совпадают");
      return;
    }
    try {
      await handleSignUp(e);
      navigate("/confirm-email");
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось зарегистрироваться', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await handleLogin(e);
      if (result?.requiresTwoFactor) {
        setChallengeToken(result.challengeToken);
      }
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось войти', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const onVerifyTwoFactor = async (e) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) return;
    setVerifying(true);
    try {
      await handleVerifyTwoFactor(challengeToken, twoFactorCode.trim());
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Неверный код', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Box
        className="authFormBox"
        width={"400px"}
        mx="auto"
        mt={"60px"}
        p={"35px"}
        borderWidth="1px"
        borderRadius="25px"
        boxShadow="md"
      >
        {challengeToken ? (
          <form onSubmit={onVerifyTwoFactor}>
            <Heading as="h2" size="md" textAlign="center" mb={2}>
              Код подтверждения
            </Heading>
            <Text fontSize="sm" color="bw.textMuted" textAlign="center" mb={6}>
              Введите код из приложения-аутентификатора или один из резервных кодов
            </Text>
            <FormControl mb={10}>
              <Input
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                autoFocus
              />
            </FormControl>
            <Button
              bg="bw.accentSolid"
              color="bw.accentSolidText"
              width="100%"
              mb={1}
              type="submit"
              size="sm"
              isLoading={verifying}
            >
              Подтвердить
            </Button>
            <Button
              m={"0 auto"}
              variant="link"
              color="bw.accent"
              onClick={() => setChallengeToken(null)}
              size="sm"
            >
              Назад
            </Button>
          </form>
        ) : bool ? (
          <form onSubmit={handleCorrect}>
            <Heading as="h2" size="md" textAlign="center" mb={2}>
              Регистрация
            </Heading>

            {/* Honeypot: hidden from real users, bots that auto-fill every
                field trip it. Never remove the off-screen positioning —
                display:none/visibility:hidden fields get skipped by some
                bots and defeat the point. */}
            <Box position="absolute" left="-9999px" aria-hidden="true">
              <Input name="website" tabIndex={-1} autoComplete="off" />
            </Box>
            <input type="hidden" name="formRenderedAt" value={formRenderedAt} readOnly />

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
              bg="bw.accentSolid"
              color="bw.accentSolidText"
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
              color="bw.accent"
              onClick={() => setBool(false)}
              size="sm"
            >
              Уже есть аккаунт?
            </Button>
          </form>
        ) : (
          <form onSubmit={onLoginSubmit}>
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
              bg="bw.accentSolid"
              color="bw.accentSolidText"
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
                  color="bw.accent"
                  size="sm"
                >
                  Забыли пароль?
                </Button>
              </Link>

              <Button
                m={"0 auto"}
                variant="link"
                color="bw.accent"
                size="sm"
                onClick={() => setBool(true)}
              >
                Еще нет аккаунта?
              </Button>
            </Flex>
          </form>
        )}
      </Box>    </>
  );
}
