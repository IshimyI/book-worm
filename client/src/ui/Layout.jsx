import { Outlet } from "react-router";
import NavBar from "./NavBar";

export default function Layout({ user, handleLogout }) {
  return (
    <>
      <NavBar user={user} handleLogout={handleLogout} />
      <Outlet />
    </>
  );
}
