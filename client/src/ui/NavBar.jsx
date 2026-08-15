/* eslint-disable react/prop-types */
import { NavLink } from "react-router";
import {
  Box,
  Flex,
  IconButton,
  Link as ChakraLink,
  useColorMode,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Stack,
  Divider,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon, HamburgerIcon } from "@chakra-ui/icons";
import NotificationBell from "./NotificationBell";

export default function NavBar({ user, handleLogout }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navLinkClass = ({ isActive }) => (isActive ? "navLinkActive" : "");

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

          <Box display={{ base: "none", lg: "contents" }}>
            <nav className="navLinksSecondary">
              <NavLink to="/news" className={navLinkClass}>Новости</NavLink>
              <NavLink to="/collections" className={navLinkClass}>Подборки</NavLink>
              <NavLink to="/leaderboard" className={navLinkClass}>Топ читателей</NavLink>
              {user && user.isEmailConfirmed ? (
                <NavLink to="/feed" className={navLinkClass}>Лента</NavLink>
              ) : null}
              {user && user.isEmailConfirmed ? (
                <NavLink to="/lists" className={navLinkClass}>Мои списки</NavLink>
              ) : null}
              {user && user.isAdmin ? (
                <NavLink to="/admin" className={navLinkClass}>Модерация</NavLink>
              ) : null}
            </nav>
            <div className="navFlexBlock2">
              {user && user.isEmailConfirmed ? <NotificationBell user={user} /> : null}
              <IconButton
                aria-label={colorMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
                color="#f5f0dc"
                _hover={{ bg: "whiteAlpha.200" }}
              />
              {user ? (
                <NavLink to="/office">
                  <button className="btnMain" type="button">
                    <img src="/img/ic_Home.png" className="imgMainBTN" alt="" />
                    Кабинет
                  </button>
                </NavLink>
              ) : null}
              {user ? (
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
          </Box>

          <Flex display={{ base: "flex", lg: "none" }} alignItems="center" gap="6px">
            {user && user.isEmailConfirmed ? <NotificationBell user={user} /> : null}
            <IconButton
              aria-label="Открыть меню"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              size="sm"
              variant="ghost"
              color="#f5f0dc"
              _hover={{ bg: "whiteAlpha.200" }}
            />
          </Flex>
        </Flex>
      </div>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="bw.cardBg" color="bw.text">
          <DrawerCloseButton />
          <DrawerHeader>Меню</DrawerHeader>
          <DrawerBody>
            <Stack spacing="4" fontSize="md" fontWeight="600" onClick={onClose}>
              <ChakraLink as={NavLink} to="/news" color="bw.text" _hover={{ color: "bw.accent" }}>Новости</ChakraLink>
              <ChakraLink as={NavLink} to="/collections" color="bw.text" _hover={{ color: "bw.accent" }}>Подборки</ChakraLink>
              <ChakraLink as={NavLink} to="/leaderboard" color="bw.text" _hover={{ color: "bw.accent" }}>Топ читателей</ChakraLink>
              {user && user.isEmailConfirmed ? (
                <ChakraLink as={NavLink} to="/feed" color="bw.text" _hover={{ color: "bw.accent" }}>Лента</ChakraLink>
              ) : null}
              {user && user.isEmailConfirmed ? (
                <ChakraLink as={NavLink} to="/lists" color="bw.text" _hover={{ color: "bw.accent" }}>Мои списки</ChakraLink>
              ) : null}
              {user && user.isAdmin ? (
                <ChakraLink as={NavLink} to="/admin" color="bw.text" _hover={{ color: "bw.accent" }}>Модерация</ChakraLink>
              ) : null}

              <Divider />

              <Flex align="center" justify="space-between">
                <span>Тема</span>
                <IconButton
                  aria-label={colorMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
                  icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                  size="sm"
                  variant="ghost"
                />
              </Flex>

              <Divider />

              {user ? (
                <ChakraLink as={NavLink} to="/office" color="bw.text" _hover={{ color: "bw.accent" }}>Кабинет</ChakraLink>
              ) : null}
              {user ? (
                <ChakraLink as={NavLink} to="/auth" onClick={handleLogout} color="bw.text" _hover={{ color: "bw.accent" }}>Выйти</ChakraLink>
              ) : (
                <ChakraLink as={NavLink} to="/auth" color="bw.text" _hover={{ color: "bw.accent" }}>Войти</ChakraLink>
              )}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
