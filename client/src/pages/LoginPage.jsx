import { NavLink, useNavigate } from "react-router";

export default function LoginPage({ handleLogin }) {
  const navigate = useNavigate();

  return (
    <div>
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

        <NavLink to={"/signup"}>Еще нет аккаунта?</NavLink>
      </form>
    </div>
  );
}
