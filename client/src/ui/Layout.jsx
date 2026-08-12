/* eslint-disable react/prop-types */
import { Outlet } from "react-router";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function Layout({ user, handleLogout }) {
  return (
    <>
      <NavBar user={user} handleLogout={handleLogout} />
      <div className="pageContent">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
