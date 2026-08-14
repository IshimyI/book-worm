/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import axiosInstance from "../axiosInstance";
import {
  Box,
  Text,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

export default function ConfirmationEmail({ setUser }) {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const [res, setRes] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setRes("нет токена");
      return;
    }

    const fetchFunction = async () => {
      try {
        await axiosInstance.get(`/auth/confirm-email?token=${token}`);
        setRes("успех");
        setUser((prev) => ({ ...prev, isEmailConfirmed: true }));
      } catch (error) {
        console.error("Ошибка при подтверждении почты", error);

        const status = error.response?.status;
        const message = error.response?.data?.message || "";

        // Same "already confirmed" outcome as a fresh confirmation — most
        // often this is a second click on the same link (e.g. an email
        // client's link-preview scanner already used it once).
        if (status === 400 && message.includes("Email")) {
          setRes("успех");
          setUser((prev) => ({ ...prev, isEmailConfirmed: true }));
        } else if (status === 401) {
          setRes("истёк");
        } else if (status === 400 && message.includes("токен")) {
          setRes("неверный токен");
        } else if (status === 400 && message.includes("Пользователь")) {
          setRes("пользователь не найден");
        } else if (status === 500) {
          setRes("ошибка сервера");
        } else {
          setRes("сетевая ошибка");
        }
      }
    };

    fetchFunction();
  }, [token, setUser]);

  const resendConfirmation = async (event) => {
    event.preventDefault();
    setResendState({ status: "loading" });
    try {
      const { data } = await axiosInstance.post("/auth/resend-confirmation", { email: resendEmail });
      setResendState({ status: "success", message: data.message });
    } catch (error) {
      setResendState({
        status: "error",
        message: error.response?.data?.message || "Не удалось отправить письмо. Попробуйте позже.",
      });
    }
  };

  const isSuccess = res === "успех";
  const showResendForm = res === "истёк" || res === "неверный токен";

  const errorText = {
    "истёк": "Срок действия ссылки истёк — такие ссылки действуют один час. Запросите новую ниже.",
    "неверный токен": "Эта ссылка недействительна. Запросите новую ниже.",
    "пользователь не найден": "Аккаунт, к которому относится эта ссылка, не найден.",
    "нет токена": "Мы отправили вам письмо от mr-book-worm@mail.ru со ссылкой для подтверждения — перейдите по ней, чтобы завершить регистрацию.",
    "ошибка сервера": "На сервере произошла ошибка. Попробуйте перейти по ссылке ещё раз чуть позже.",
    "сетевая ошибка": "Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.",
  }[res] || "Не удалось подтвердить email.";

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
        {isSuccess ? (
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
                <Text>{errorText}</Text>
              </AlertDescription>
            </Alert>

            {showResendForm && (
              <Box as="form" onSubmit={resendConfirmation} mb={8} maxW="400px" mx="auto" textAlign="left">
                <Text fontSize="sm" mb={2} color="bw.textMuted">
                  Укажите email, с которым регистрировались:
                </Text>
                <Input
                  type="email"
                  placeholder="Email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  mb={3}
                  bg="white"
                />
                <Button
                  type="submit"
                  isLoading={resendState?.status === "loading"}
                  sx={{ backgroundColor: "#334d00", color: "white" }}
                  width="100%"
                >
                  Отправить письмо ещё раз
                </Button>
                {resendState && resendState.status !== "loading" && (
                  <Alert status={resendState.status === "success" ? "success" : "error"} mt={3} borderRadius="8px" fontSize="sm">
                    <AlertIcon />
                    {resendState.message}
                  </Alert>
                )}
              </Box>
            )}

            <Button
              variant={showResendForm ? "ghost" : "solid"}
              sx={
                showResendForm
                  ? { color: "#334d00" }
                  : { backgroundColor: "#334d00", color: "white" }
              }
              onClick={() => navigate("/")}
            >
              Вернуться на главную
            </Button>
          </Box>
        )}
      </Box>    </>
  );
}
