import { NavLink, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useState } from "react";
import {
  Box,
  Heading,
  FormControl,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";

export default function RecoverPassword() {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  const onFinish = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get("email");

    try {
      await axiosInstance.post(`/auth/forgot-password`, { email });
      setMessage({
        type: "success",
        text: "Письмо с инструкциями по восстановлению пароля отправлено на ваш email.",
      });
    } catch (error) {
      console.error("Ошибка при восстановлении пароля:", error);

      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          setMessage({
            type: "error",
            text: "Пользователь с такой почтой не найден.",
          });
        } else if (status === 500) {
          setMessage({
            type: "error",
            text: "Ошибка на сервере. Пожалуйста, попробуйте позже.",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: "Ошибка при восстановлении пароля. Пожалуйста, попробуйте снова.",
        });
      }
    }
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
        <Heading as="h2" size="md" textAlign="center" mb={2}>
          Восстановление пароля
        </Heading>

        {message && (
          <Alert status={message.status || "info"} mb={4}>
            <AlertIcon />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onFinish}>
          <FormControl mb={10} mt={8}>
            <Input
              placeholder="Email"
              type="email"
              name="email"
              id="email"
              required
            />
          </FormControl>

          <Button
            sx={{
              backgroundColor: "#334d00",
              color: "white",
            }}
            width="100%"
            type="submit"
          >
            Отправить
          </Button>
        </form>

        <Box mt={4} textAlign="center">
          <Text>
            Вспомнили пароль?
            <Button
              as={NavLink}
              to={"/auth"}
              ml={2}
              sx={{
                color: "#334d00",
              }}
              variant="link"
            >
              Войти
            </Button>
          </Text>
        </Box>
      </Box>
      <div className="fonAuth"> </div>
      <div className="fonAuth2"> </div>
    </>
  );
}
