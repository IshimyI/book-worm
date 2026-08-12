import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import axiosInstance from "../axiosInstance";
import {
  Box,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

export default function ConfirmationEmail({ user, setUser }) {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const [res, setRes] = useState("");
  const navigate = useNavigate();

  console.log("Получен токен:", token);
  console.log("user:", user);

  useEffect(() => {
    if (!token) {
      setRes("токен");
      return;
    }

    const fetchFunction = async () => {
      try {
        await axiosInstance.get(`/auth/confirm-email?token=${token}`);
        setRes("успех");
        setUser((prev) => ({ ...prev, isEmailConfirmed: true }));
      } catch (error) {
        console.error("Ошибка при подтверждении почты", error);

        if (error.response) {
          const { status, data } = error.response;
          if (status === 400) {
            if (data.message.includes("токен")) {
              setRes("токен");
            } else if (data.message.includes("Пользователь")) {
              setRes("пользователь");
            } else if (data.message.includes("Email")) {
              setRes("email");
            } else {
              setRes("Ошибка");
            }
          } else if (status === 500) {
            setRes("Сервер лежит");
          }
        } else {
          setRes("Снова");
        }
      }
    };

    fetchFunction();
  }, [token, setUser]);

  return (
    <>
      <Box
        bg={"white"}
        width={"800px"}
        mx="auto"
        mt={8}
        p={"25px"}
        borderWidth="1px"
        borderRadius="20px"
        boxShadow="md"
        textAlign="center"
      >
        {res === "успех" || res === "email" ? (
          <Box>
            <Alert status="success" mb={8} borderRadius="10px">
              <AlertIcon />
              <AlertTitle>Почта успешно подтверждена!</AlertTitle>
            </Alert>

            <Button
              sx={{
                backgroundColor: "#334d00",
                color: "white",
              }}
              onClick={() => navigate("/")}
            >
              Перейти на главную
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert status="error" mb={4} borderRadius="10px">
              <AlertIcon />

              <AlertDescription ml={15}>
                <Text>
                  Для завершения регистрации, пожалуйста, подтвердите свой адрес
                  электронной почты.
                </Text>
              </AlertDescription>
            </Alert>

            <Text fontWeight="bold" mb={8}>
              Мы отправили вам письмо от book-worm-elbrus@mail.ru со ссылкой для
              подтверждения.
            </Text>

            <Button
              sx={{
                backgroundColor: "#334d00",
                color: "white",
              }}
              onClick={() => navigate("/")}
            >
              Вернуться на главную
            </Button>
          </Box>
        )}
      </Box>    </>
  );
}
