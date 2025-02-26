const express = require("express");
const { User, Inventory, User_selected_items } = require("../../db/models");
const bcrypt = require("bcrypt");
const cookieConfig = require("../configs/cookieConfig");
const jwt = require("jsonwebtoken");
const generateTokens = require("../utils/generateTokens");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) return res.sendStatus(401);

  const hashpass = await bcrypt.hash(password, 10);
  const [newUser, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name,
      password: hashpass,
      coins: 0,
    },
  });

  if (!created) return res.sendStatus(402);

  const user = newUser.get();
  delete user.password;

  const { accessToken, refreshToken } = generateTokens({ user });
  res
    .cookie("refreshToken", refreshToken, cookieConfig)
    .json({ accessToken, user });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.sendStatus(400);
  const foundUser = await User.findOne({ where: { email } });
  if (!foundUser) return res.sendStatus(400);

  const isValid = await bcrypt.compare(password, foundUser.password);
  if (!isValid) return res.sendStatus(400);

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
