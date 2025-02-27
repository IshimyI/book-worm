import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import axiosInstance from "../axiosInstance";

export default function ConfirmationEmail({ user, setUser }) {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const [res, setRes] = useState("");
  const navigate = useNavigate();

  console.log("Получен токен:", token);
  
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
    <div>
      <div>
        {res === "успех" || res === "email" || user.isEmailConfirmed ? (
          <div>
            <span>✔</span>
            <h2>Почта успешно подтверждена!</h2>
            <p>Теперь вы можете пользоваться всеми функциями нашего сервиса.</p>
            <button onClick={() => navigate("/office")}>
              Перейти в профиль
            </button>
          </div>
        ) : (
          <div>
            <span>✖</span>
            <h2>Ошибка подтверждения почты</h2>
            <p>
              Произошла ошибка при подтверждении вашей почты. Пожалуйста,
              обратитесь в техническую поддержку:
            </p>
            <strong>book-worm-elbrus@mail.ru</strong>
            <button onClick={() => navigate("/")}>Вернуться на главную</button>
          </div>
        )}
      </div>
    </div>
  );
}
