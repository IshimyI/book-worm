import { NavLink } from "react-router";
import React from "react";

export default function NavBar({ user, handleLogout }) {
  return (
    <div>
      <NavLink to="/profile">{user ? user.name : "Guest"}</NavLink>
      <span> Тут пробел </span>
      <NavLink to="/signup">registr</NavLink>
      <span> Тут пробел </span>
      <NavLink to="/login">log</NavLink> (
      <button onClick={handleLogout} type="button">
        Выйти
      </button>
      )
    </div>
  );
}
