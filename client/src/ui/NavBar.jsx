/* eslint-disable react/prop-types */
import { NavLink } from "react-router";
// import React from "react";
import { Flex } from "@chakra-ui/react";

export default function NavBar({ user, handleLogout }) {
  return (
    <div className="navbar">
      <div className="conteyner">
        <Flex>
          <div className="logo"></div>
          <NavLink to="/profile">{user ? user.name : ""}</NavLink>
          <NavLink to="/">
            <button className="btnMain" type="button">
              <img src="./img/ic_Main.png" className="imgMainBTN" />
              Главная
            </button>
          </NavLink>
          <NavLink to="/office">
            <button className="btnMain" type="button">
              <img src="./img/ic_Home.png" className="imgMainBTN" />
              Кабинет
            </button>
          </NavLink>
          {user ? (
            <NavLink to="/auth">
              <button className="btnMain" type="button" onClick={handleLogout}>
                <img src="./img/ic_voyti.png" className="imgMainBTN" />
                Выйти
              </button>
            </NavLink>
          ) : (
            <NavLink to="/auth">
              <button className="btnMain" type="button">
                <img src="./img/ic_voyti.png" className="imgMainBTN" />
                Войти
              </button>
            </NavLink>
          )}
        </Flex>
      </div>
    </div>
  );
}
