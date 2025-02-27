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
import axios from "axios";

function App() {
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          "https://openlibrary.org/search.json",
          {
            params: { q: "война", limit: 25 },
          }
        );

        const booksData = response.data.docs.map((book) => ({
          title: book.title || "Неизвестно",
          author: book.author_name?.join(", ") || "Неизвестно",
          annotation: book.first_sentence?.join(" ") || "Описание отсутствует",
          img: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : null,
          genre: book.subject ? book.subject.slice(0, 3) : ["Жанр неизвестен"],
          year: book.first_publish_year || "Неизвестно",
        }));

        setBooks(booksData);
      } catch (error) {
        console.error("Ошибка при загрузке книг:", error);
      }
    };

    fetchBooks();
  }, []);

  console.log(books);

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
