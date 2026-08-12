const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "smtp.mail.ru";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || `Mr Book Worm <${SMTP_USER}>`;

const transporter = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[email -> ${to}] ${subject}\n${text}`);

  if (!transporter) {
    console.error("SMTP_USER/SMTP_PASS не заданы в .env — письмо не отправлено.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log("Письмо отправлено через SMTP");
    return true;
  } catch (error) {
    console.error("Ошибка при отправке письма через SMTP:", error.message);
    return false;
  }
};

module.exports = sendEmail;
