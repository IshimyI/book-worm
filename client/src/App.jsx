import { Routes, Route } from "react-router";
import AuthPage from "./pages/AuthPage";
import Layout from "./ui/Layout";
import axiosInstance, { setAccessToken } from "./axiosInstance";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance("/tokens/refresh")
      .then((res) => {
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken("");
        navigate("/signup");
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
  };

  const handleLogout = async () => {
    const res = await axiosInstance.post("/auth/logout");
    if (res.status === 200) {
      setUser(null);
      setAccessToken("");
      navigate("/auth");
    }
  };

  return (
    <Routes>
      <Route element={<Layout user={user} handleLogout={handleLogout} />}>
        <Route path="/profile" element={<ProfilePage />}></Route>
        <Route
          path="/auth"
          element={
            <AuthPage handleSignUp={handleSignUp} handleLogin={handleLogin} />
          }
        ></Route>
        <Route path="*" element={<ErrorPage />}></Route>
      </Route>
    </Routes>
  );
}

export default App;
