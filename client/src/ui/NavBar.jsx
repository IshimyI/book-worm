/* eslint-disable react/prop-types */
import { NavLink } from "react-router";
// import React from "react";
import { Flex } from "@chakra-ui/react";

export default function NavBar({ user, handleLogout }) {
  return (
    <div className="navbar">

      <div className="conteynerNav">

        <Flex
          className="navbarFlex"
          alignItems="center"
          justifyContent="space-between"
        >
          <NavLink to="/">
            <div className="logo">
              <img src="/img/logo-mrbookworm-header.png" alt="Mr Book Worm" className="logoIcon" />
              <div className="logoTextWrap">
                Mr Book Worm
                <span className="logoTagline">читай · оценивай · обсуждай</span>
              </div>
            </div>
          </NavLink>
          <nav className="navLinksSecondary">
            <NavLink to="/news" className={({ isActive }) => (isActive ? "navLinkActive" : "")}>Новости</NavLink>
            {user && user.isAdmin ? (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "navLinkActive" : "")}>Модерация</NavLink>
            ) : null}
          </nav>
          <div className="navFlexBlock2">
            {/* <div>
              {user && user.isEmailConfirmed ? `Привет, ${user.name}` : null}
            </div> */}
            {user && user.isEmailConfirmed ? (
              <NavLink to="/office">
                <button className="btnMain" type="button">
                  <img src="/img/ic_Home.png" className="imgMainBTN" alt="" />
                  Кабинет
                </button>
              </NavLink>
            ) : null}
            {user && user.isEmailConfirmed ? (
              <NavLink to="/auth">
                <button
                  className="btnMain"
                  type="button"
                  onClick={handleLogout}
                >
                  <img src="/img/ic_voyti.png" className="imgMainBTN" alt="" />
                  Выйти
                </button>
              </NavLink>
            ) : (
              <NavLink to="/auth">
                <button className="btnMain" type="button">
                  <img src="/img/ic_voyti.png" className="imgMainBTN" alt="" />
                  Войти
                </button>
              </NavLink>
            )}
          </div>
        </Flex>
      </div>
    </div>
  );
}
