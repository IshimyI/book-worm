import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";

export default function SignUpPage({ handleSignUp, handleLogin }) {
  const navigate = useNavigate();
  const [firstPassword, setFirstPassword] = useState("");
  const [secondPassword, setSecondPassword] = useState("");
  const [bool, setBool] = useState(true);

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
    <div>
      {bool ? (
        <form onSubmit={handleCorrect}>
          <h2>Регистрация</h2>

          <div>
            <label htmlFor="name1">Логин</label>
            <input name="name" type="text" id="name1" />
          </div>

          <div>
            <label htmlFor="em1">Почта</label>
            <input name="email" type="email" id="em1" />
          </div>

          <div>
            <label htmlFor="pass1">Пароль</label>
            <input
              name="password"
              type="password"
              id="pass1"
              value={firstPassword}
              onChange={(e) => setFirstPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="pass2">Подтвердите пароль</label>
            <input
              name="password"
              type="password"
              id="pass2"
              value={secondPassword}
              onChange={(e) => setSecondPassword(e.target.value)}
            />
          </div>
          <button type="submit">Зарегистрироваться</button>

          <button onClick={() => setBool(false)}>Уже есть аккаунт?</button>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <h2>Вход</h2>

          <div>
            <label htmlFor="em1">Почта</label>
            <input name="email" type="email" id="em1" />
          </div>

          <div>
            <label htmlFor="pass1">Пароль</label>
            <input name="password" type="password" id="pass1" />
          </div>

          <button type="submit">Войти</button>

          <NavLink to={"/recover"}>Забыли пароль?</NavLink>

          <button onClick={() => setBool(true)}>Еще нет аккаунта?</button>
        </form>
      )}
    </div>
  );
}
