import { Routes, Route } from "react-router";

import Layout from "./ui/Layout";
import axiosInstance, { setAccessToken } from "./axiosInstance";
import { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import MainPage from "./pages/MainPage";

// Lazily loaded: not needed for the first paint of the catalog homepage.
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Office = lazy(() => import("./pages/Office"));
const BookPage = lazy(() => import("./pages/BookPage"));
const ConfirmationEmail = lazy(() => import("./pages/ConfirmationEmail"));
const RecoverPassword = lazy(() => import("./pages/RecoverPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ListsPage = lazy(() => import("./pages/ListsPage"));
const ListDetailPage = lazy(() => import("./pages/ListDetailPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));

function RouteFallback() {
  return (
    <Center py="100px">
      <Spinner size="xl" />
    </Center>
  );
}

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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout user={user} handleLogout={handleLogout} />}>
          <Route
            path="/auth"
            element={
              <AuthPage handleSignUp={handleSignUp} handleLogin={handleLogin} />
            }
          ></Route>
          <Route path="/office" element={<Office user={user} setUser={setUser} />} />
          <Route path="/" element={<MainPage user={user} setUser={setUser} />} />
          <Route path="/books/:id" element={<BookPage user={user} setUser={setUser} />} />
          <Route
            path="/confirm-email"
            element={<ConfirmationEmail user={user} setUser={setUser} />}
          />
          <Route path="/recover" element={<RecoverPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/users/:id" element={<PublicProfilePage user={user} />} />
          <Route path="/admin" element={<AdminPage user={user} />} />
          <Route path="/lists" element={<ListsPage user={user} />} />
          <Route path="/lists/:id" element={<ListDetailPage user={user} />} />
          <Route path="/feed" element={<FeedPage user={user} />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
