import { Routes, Route } from "react-router";

import AuthPage from "./pages/AuthPage";

import Layout from "./ui/Layout";
import axiosInstance, { setAccessToken } from "./axiosInstance";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import Office from "./pages/Office";
import MainPage from "./pages/MainPage";
import ConfirmationEmail from "./pages/ConfirmationEmail";
import RecoverPassword from "./pages/RecoverPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  // useEffect(() => {
  //   const fetchBooks = async () => {
  //     try {
  //       const response = await axios.get(
  //         "https://www.googleapis.com/books/v1/volumes",
  //         {
  //           params: {
  //             q: "Война" , // пример запроса сюда должен с инпута приходить должны первые символа 3 и на каждый последующий (потому что ограничение на количество книг для выдачи)
  //             key: "AIzaSyClVhHN4OkNbIj8HdeEsm5Zt0b5GxrLyu0",
  //           },
  //         }
  //       );
  //       setBooks(response.data.items);
  //     } catch (error) {
  //       console.error("Ошибка при загрузке книг:", error);
  //     }
  //   };

  //   fetchBooks();
  // }, []);

  useEffect(() => {
    axiosInstance("/tokens/refresh")
      .then((res) => {
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken("");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, []);

  if (loadingUser) return <p>Загрузка пользователя...</p>;

  const handleSignUp = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const res = await axiosInstance.post("/auth/signup", data);
    if (res.status === 200) {
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const res = await axiosInstance.post("/auth/login", data);
    if (res.status === 200) {
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
    }
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      const res = await axiosInstance.post("/auth/logout");
      if (res.status === 200) {
        setUser(null);
        setAccessToken("");
        navigate("/auth");
      }
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  return (
    <Routes>
      <Route element={<Layout user={user} handleLogout={handleLogout} />}>
        <Route
          path="/auth"
          element={
            <AuthPage handleSignUp={handleSignUp} handleLogin={handleLogin} />
          }
        ></Route>
        <Route path="/office" element={<Office user={user} />} />
        <Route path="/" element={<MainPage user={user} />} />
        <Route
          path="/confirm-email"
          element={<ConfirmationEmail user={user} setUser={setUser} />}
        />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
}

export default App;
