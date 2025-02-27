import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useState } from "react";

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
    <div>
      <h2>Сброс пароля</h2>

      {message && <div>{message.text}</div>}

      <form onSubmit={onFinish}>
        <div>
          <input
            type="password"
            name="password"
            required
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            name="confirmPassword"
            required
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Сброс..." : "Сбросить пароль"}
        </button>
      </form>
    </div>
  );
}
