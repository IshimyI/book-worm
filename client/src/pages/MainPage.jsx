/* eslint-disable react/prop-types */
import {
  Box,
  Heading,
  Text,
  Image,
  Flex,
  Input,
  Select,
  Button,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
// import booksData from "../testJSON/books.json";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ModalMain from "../ui/ModalMain";
import axiosInstance from "../axiosInstance";

export default function MainPage({ user }) {
  const [uniqueGenres, setUniqueGenres] = useState([]);
  const [uniqueAuthors, setUniqueAuthors] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [booksData, setBooksData] = useState([]);
  const [fillterBooksData, setFillterBooksData] = useState([]);

  useEffect(() => {
    const fetchAllSms = async () => {
      try {
        const response = await axiosInstance.get("/listAllBooks");
        setBooksData(response.data);
        setFillterBooksData(response.data);
      } catch (error) {
        console.error("Ошибка при получении всех books:", error);
      }
    };

    fetchAllSms();
  }, []);

  const sbros = () => {
    setBooksData(fillterBooksData);
  };

  useEffect(() => {
    const yearsSet = new Set();
    fillterBooksData.forEach((book) => yearsSet.add(book.year));
    setUniqueYears(Array.from(yearsSet).sort());
  }, [booksData]);

  useEffect(() => {
    const authorsSet = new Set();
    fillterBooksData.forEach((book) => authorsSet.add(book.author));
    setUniqueAuthors(Array.from(authorsSet));
  }, [booksData]);

  useEffect(() => {
    const genresSet = new Set();
    fillterBooksData.forEach((book) => genresSet.add(book.genre));
    setUniqueGenres(Array.from(genresSet));
  }, [booksData]);

  const helperSort = (value) => {
    if (value.target.value === "option1") {
      const newData = [...booksData].sort((a, b) =>
        a.rating > b.rating ? 1 : -1
      );
      setBooksData(newData);
    }
    if (value.target.value === "option2") {
      const newData2 = [...booksData].sort((a, b) =>
        a.title > b.title ? 1 : -1
      );
      setBooksData(newData2);
    }
    if (value.target.value === "option3") {
      const newData3 = [...booksData].sort((a, b) =>
        a.year > b.year ? 1 : -1
      );
      setBooksData(newData3);
    }
  };

  const fillHelper1 = (value) => {
    const newData = [...fillterBooksData].filter(
      (el) => el.genre === value.target.value
    );
    setBooksData(newData);
  };

  const fillHelper2 = (value) => {
    const newData = [...fillterBooksData].filter(
      (el) => el.author === value.target.value
    );
    setBooksData(newData);
  };
  const fillHelper3 = (value) => {
    const newData = [...fillterBooksData].filter(
      (el) => String(el.year) === String(value.target.value)
    );
    setBooksData(newData);
  };

  const inputHand = (value) => {
    const newData = [...fillterBooksData].filter(
      (el) => el.title.toLowerCase().includes(value.target.value.toLowerCase())
    );
    setBooksData(newData);
  }

  return (
    <>
      <div className="conteyner">
        <div className="blockMainCenter">
          {user ? null : (
            <Alert
              status="warning"
              borderRadius={"5px"}
              mb={"20px"}
              mt={"-15px"}
            >
              <AlertIcon />
              Хотите читать рецензии и пользоваться личным кабинетом?
              Авторизуйтесь прямо сейчас!
            </Alert>
          )}
          <div className="lineTwo">
            <Box
              className="blockFillter"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
              mb={"20px"}
              p={"7px"}
            >
              <Heading
                sx={{ fontFamily: "Lato, sans-serif" }}
                as="h2"
                size="md"
                mb={4}
                textAlign="left"
                p={"20px"}
              >
                Фильтры
              </Heading>

              <Select
                placeholder="Жанр"
                w={"90%"}
                m={"0 auto"}
                onChange={fillHelper1}
              >
                {uniqueGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Автор"
                w={"90%"}
                m={"0 auto"}
                mt={"20px"}
                onChange={fillHelper2}
              >
                {uniqueAuthors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Год издания"
                w={"90%"}
                m={"0 auto"}
                mt={"20px"}
                onChange={fillHelper3}
              >
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <Flex mt={"20px"} justifyContent={"center"} columnGap={"15px"}>
                {/* <Button
                  sx={{
                    backgroundColor: "#334d00",
                    color: "white",
                  }}
                  size="sm"
                >
                  Искать
                </Button> */}
                <Button
                  sx={{
                    backgroundColor: "#334d00",
                    color: "white",
                  }}
                  size="sm"
                  onClick={sbros}
                >
                  Сброс
                </Button>
              </Flex>
            </Box>

            <div className="blockAllBooks">
              <div className="lineInputSort">
                <Input
                  w={"100%"}
                  placeholder="Поиск по названию"
                  bg={"white"}
                  onChange={inputHand}
                />
                <Select
                  placeholder="Сортировать"
                  w={200}
                  bg={"white"}
                  onChange={helperSort}
                >
                  <option value="option1">По рейтингу</option>
                  <option value="option2">По названию</option>
                  <option value="option3">По году издания</option>
                </Select>
              </div>
              {booksData.map((book) => (
                <Box
                  bg={"white"}
                  key={book.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="md"
                  mb={"20px"}
                  h={250}
                  w={"90vh"}
                  transition="transform 0.15s ease, box-shadow 0.15s ease"
                  _hover={{ transform: "translateY(-3px)", boxShadow: "xl" }}
                >
                  <Flex align="start">
                    <Image
                      src={book.img}
                      alt={book.title}
                      width="180px"
                      height="100%"
                      objectFit="cover"
                      mr={4}
                    />
                    <Box textAlign="left" p="4" mt={"10px"}>
                      <NavLink to={`/books/${book.id}`}>
                        <Heading as="h3" size="md" mb={2} _hover={{ color: "#334d00" }}>
                          {book.title}
                        </Heading>
                      </NavLink>
                      <Text color="gray.500" fontSize="sm" mb={2}>
                        {book.author}
                      </Text>
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        {book.genre}
                      </Text>
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        {book.year}
                      </Text>
                      <Flex alignItems="center" mt={"60px"}>
                        <Text fontWeight="bold" mr={2}>
                          {book.rating == null ? 0 : book.rating} ⭐
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          ({book.quantity_rate == null ? 0 : book.quantity_rate}{" "}
                          отзывов)
                        </Text>
                        <ModalMain user={user} book={book} />
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="fonMBLOCK"> </div>
    </>
  );
}
