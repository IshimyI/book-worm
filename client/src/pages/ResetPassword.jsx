import { useParams, useNavigate } from "react-router-dom";
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

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return <div>Ошибка: отсутствует токен сброса пароля.</div>;
  }

  const onFinish = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Пароли не совпадают." });
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      setMessage({ type: "success", text: "Пароль успешно изменен." });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Ошибка при сбросе пароля.",
      });
    } finally {
      setLoading(false);
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
          Сброс пароля
        </Heading>

        {message && (
          <Alert status={message.type || "info"} mb={4}>
            <AlertIcon />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onFinish}>
          <FormControl mb={10} mt={8}>
            <Input
              type="password"
              name="password"
              required
              placeholder="Новый пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <FormControl mb={10}>
            <Input
              type="password"
              name="confirmPassword"
              required
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>

          <Button
            sx={{
              backgroundColor: "#334d00",
              color: "white",
            }}
            width="100%"
            type="submit"
            disabled={loading}
          >
            {loading ? "Сброс..." : "Сбросить пароль"}
          </Button>
        </form>
      </Box>    </>
  );
}
