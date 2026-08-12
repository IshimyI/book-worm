const express = require("express");
const rateLimit = require("express-rate-limit");
const { User, Inventory, User_selected_items } = require("../../db/models");
const bcrypt = require("bcrypt");
const cookieConfig = require("../configs/cookieConfig");
const jwt = require("jsonwebtoken");
const generateTokens = require("../utils/generateTokens");
const sendEmail = require("../utils/emailService");
const { confirmationEmailHtml, resetPasswordEmailHtml } = require("../utils/emailTemplates");
const logSecurityEvent = require("../utils/securityLog");
const authRouter = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Slow down credential-guessing / signup-spam without blocking normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Слишком много попыток. Попробуйте снова через несколько минут." },
  skip: () => process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    logSecurityEvent({ type: "rate_limited", ip: req.ip, detail: req.path });
    res.status(options.statusCode).json(options.message);
  },
});

authRouter.post("/signup", authLimiter, async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Все поля должны быть заполнены" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: `Пользователь с почтой "${email}" уже зарегистрирован`,
      });
    }

    const hashpass = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashpass,
      isEmailConfirmed: false,
    });

    const emailConfirmationToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const confirmationLink = `${CLIENT_URL}/confirm-email?token=${emailConfirmationToken}`;
    const emailSent = await sendEmail({
      to: email,
      subject: "Подтверждение email",
      text: `Пожалуйста, подтвердите ваш email, перейдя по ссылке: ${confirmationLink}`,
      html: confirmationEmailHtml(confirmationLink, name),
    });

    // Письмо не ушло (например, исходящий SMTP заблокирован сетью) — не
    // блокируем пользователя недоступным подтверждением, подтверждаем сразу.
    if (!emailSent) {
      newUser.isEmailConfirmed = true;
      await newUser.save();
    }

    const plainUser = newUser.get({ plain: true });
    delete plainUser.password;

    const { accessToken, refreshToken } = generateTokens({ user: plainUser });
    res
      .cookie("refreshToken", refreshToken, cookieConfig)
      .json({ user: plainUser, accessToken });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.sendStatus(500);
  }
});

authRouter.get("/confirm-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Токен не предоставлен" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({ message: "Email уже подтверждён" });
    }

    user.isEmailConfirmed = true;
    await user.save();

    const updatedUser = user.get({ plain: true });
    const { accessToken, refreshToken } = generateTokens({ user: updatedUser });

    res.status(200).cookie("refreshToken", refreshToken, cookieConfig).json({
      message: "Email успешно подтверждён!",
      accessToken,
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:
          "Токен истёк. Пожалуйста, запросите новый токен для подтверждения.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Некорректный токен" });
    }
    console.error("Ошибка подтверждения email:", error);
    res.sendStatus(500);
  }
});

authRouter.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email не найден." });
    }

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_PASS, {
      expiresIn: "1h",
    });

    await User.update(
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { where: { email } }
    );

    const confirmationLink = `${CLIENT_URL}/reset/${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Восстановление пароля",
      text: `Для восстановления пароля перейдите по ссылке: ${confirmationLink}`,
      html: resetPasswordEmailHtml(confirmationLink, user.name),
    });

    logSecurityEvent({ type: "password_reset_requested", email, ip: req.ip });

    res.status(200).json({
      message:
        "Письмо с инструкциями по восстановлению пароля отправлено на ваш email.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка на сервере. Пожалуйста, попробуйте позже." });
  }
  return "done";
});

authRouter.post(`/reset-password/:token`, async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "Недействительный или просроченный токен." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logSecurityEvent({ type: "password_reset_completed", email: user.email, ip: req.ip });

    res.status(200).json({ message: "Пароль успешно изменен." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка на сервере. Пожалуйста, попробуйте позже." });
  }
  return "done";
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }
  const foundUser = await User.findOne({ where: { email } });
  if (!foundUser) {
    logSecurityEvent({ type: "failed_login", email, ip: req.ip, detail: "unknown_email" });
    return res.sendStatus(400);
  }

  const isValid = await bcrypt.compare(password, foundUser.password);
  if (!isValid) {
    logSecurityEvent({ type: "failed_login", email, ip: req.ip, detail: "wrong_password" });
    return res.sendStatus(400);
  }

  const user = foundUser.get();
  delete user.password;
  const { accessToken, refreshToken } = generateTokens({ user });

  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieConfig)
    .json({ accessToken, user });
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie("refreshToken").sendStatus(200);
});

module.exports = authRouter;
