import React from "react";
import { NavLink } from "react-router";

export default function SignUpPage({ handleSignUp }) {
  return (
    <div>
      <form onSubmit={handleSignUp}>
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
          <input name="password" type="password" id="pass1" />
        </div>

        <button type="submit">Зарегистрироваться</button>

        <NavLink to={"/login"}>Уже есть аккаунт?</NavLink>
      </form>
    </div>
  );
}
