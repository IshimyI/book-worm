import { NavLink, useNavigate } from "react-router";

export default function LoginPage({ handleLogin }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-kitt-background text-kitt-txt">
      <form
        onSubmit={handleLogin}
        className="bg-kitt-foreground p-8 rounded-lg shadow-lg max-w-sm w-full"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 text-kitt-primary">
          Вход
        </h2>

        <div className="mb-4">
          <label htmlFor="em1" className="block text-lg mb-2 text-kitt-primary">
            Почта
          </label>
          <input
            name="email"
            type="email"
            className="w-full p-3 bg-white border border-kitt-primary rounded-lg text-kitt-txt focus:outline-none focus:ring-2 focus:ring-kitt-secondary"
            id="em1"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="pass1"
            className="block text-lg mb-2 text-kitt-primary"
          >
            Пароль
          </label>
          <input
            name="password"
            type="password"
            className="w-full p-3 bg-white border border-kitt-primary rounded-lg text-kitt-txt focus:outline-none focus:ring-2 focus:ring-kitt-secondary"
            id="pass1"
          />
        </div>

        <button
          className="w-full py-3 bg-kitt-primary text-white rounded-lg hover:bg-kitt-secondary transition duration-300"
          type="submit"
        >
          Войти
        </button>

        <NavLink className="block text-center mt-4 text-white" to={"/signup"}>
          Еще нет аккаунта?
        </NavLink>
      </form>
    </div>
  );
}
