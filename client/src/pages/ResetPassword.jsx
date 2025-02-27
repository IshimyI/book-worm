import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useState } from "react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  const onFinish = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const password = formData.get("password");

    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      setMessage({ type: "success", text: "Пароль успешно изменен." });
      navigate("/auth");
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) {
          setMessage({
            type: "error",
            text: data.message || "Ошибка при сбросе пароля.",
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
          text: "Ошибка при сбросе пароля. Пожалуйста, попробуйте снова.",
        });
      }
    }
  };

  return (
    <div>
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
            />
          </div>

          <button type="submit">Сбросить пароль</button>
        </form>
      </div>
    </div>
  );
}
