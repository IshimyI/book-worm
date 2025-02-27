/* eslint-disable react/prop-types */
import { NavLink } from "react-router";
// import React from "react";
import { Flex } from "@chakra-ui/react";

export default function NavBar({ user, handleLogout }) {
  console.log(user);

  return (
    <div className="navbar">

      <div className="conteynerNav">

        <Flex
          className="navbarFlex"
          alignItems="center"
          justifyContent="space-between"
        >
          <NavLink to="/">
            <div className="logo"></div>
          </NavLink>
          <div className="navFlexBlock2">
            {/* <div>
              {user && user.isEmailConfirmed ? `Привет, ${user.name}` : null}
            </div> */}
            {user && user.isEmailConfirmed ? (
              <NavLink to="/office">
                <button className="btnMain" type="button">
                  <img src="./img/ic_Home.png" className="imgMainBTN" />
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
          </div>
        </Flex>
      </div>
    </div>
  );
}
