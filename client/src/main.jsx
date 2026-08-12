import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { ChakraProvider } from "@chakra-ui/react";
import * as Sentry from "@sentry/react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

function ErrorFallback() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <p>Что-то пошло не так. Мы уже знаем об этой ошибке.</p>
      <a href="/">Вернуться на главную</a>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ChakraProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
