// Исходящий SMTP (465/587) заблокирован на уровне сети — письма через него
// не проходят ни с одним провайдером. Отправляем через HTTP API Resend
// вместо SMTP-протокола: обычный HTTPS-запрос, который сеть не блокирует.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Book Worm <onboarding@resend.dev>";

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[email -> ${to}] ${subject}\n${text}`);

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY не задан в .env — письмо не отправлено.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend отклонил письмо:", response.status, errorBody);
      return false;
    }

    console.log("Письмо отправлено через Resend");
    return true;
  } catch (error) {
    console.error("Ошибка при отправке письма через Resend:", error.message);
    return false;
  }
};

module.exports = sendEmail;
