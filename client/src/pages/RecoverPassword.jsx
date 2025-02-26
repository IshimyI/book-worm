import { NavLink, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useState } from "react";

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
      navigate("/reset");
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
    <div>
      <div>
        <h2>Восстановление пароля</h2>

        {message && <div>{message.text}</div>}

        <form onSubmit={onFinish}>
          <div>
            <input type="email" name="email" required placeholder="Email" />
          </div>

          <button type="submit">Отправить</button>
        </form>

        <div>
          <span>Вспомнили пароль?</span>
          <button>
            <NavLink to={"/auth"}>Войти</NavLink>
          </button>
        </div>
      </div>
    </div>
  );
}
