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
import ModalMain from "../ui/ModalMain";
import axios from "axios";

export default function MainPage({ user }) {
  const [uniqueGenres, setUniqueGenres] = useState([]);
  const [uniqueAuthors, setUniqueAuthors] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [booksData, setBooksData] = useState([]);

  useEffect(() => {
    const fetchAllSms = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/listAllBooks");
        setBooksData(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Ошибка при получении всех books:", error);
      }
    };

    fetchAllSms();
  }, []);


  useEffect(() => {
    const yearsSet = new Set();
    booksData.forEach((book) => yearsSet.add(book.year));
    setUniqueYears(Array.from(yearsSet).sort());
  }, [booksData]);

  useEffect(() => {
    const authorsSet = new Set();
    booksData.forEach((book) => authorsSet.add(book.author));
    setUniqueAuthors(Array.from(authorsSet));
  }, [booksData]);

  useEffect(() => {
    const genresSet = new Set();
    booksData.forEach((book) => genresSet.add(book.genre));
    setUniqueGenres(Array.from(genresSet));
  }, [booksData]);

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

              <Select placeholder="Жанр" w={"90%"} m={"0 auto"}>
                {uniqueGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </Select>

              <Select placeholder="Автор" w={"90%"} m={"0 auto"} mt={"20px"}>
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
              >
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <Flex mt={"20px"} justifyContent={"center"} columnGap={"15px"}>
                <Button
                  sx={{
                    backgroundColor: "#334d00",
                    color: "white",
                  }}
                  size="sm"
                >
                  Искать
                </Button>
                <Button
                  sx={{
                    backgroundColor: "#334d00",
                    color: "white",
                  }}
                  size="sm"
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
                />
                <Select placeholder="Сортировать" w={200} bg={"white"}>
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
                >
                  <Flex align="start">
                    <Image
                      src="https://images.wallpaperscraft.com/image/single/question_marks_figures_3d_112755_1080x1920.jpg" // Используем статичный URL из примера, но не меняем его
                      alt={book.title}
                      width="180px"
                      height="100%"
                      objectFit="cover"
                      mr={4}
                    />
                    <Box textAlign="left" p="4" mt={"10px"}>
                      <Heading as="h3" size="md" mb={2}>
                        {book.title}
                      </Heading>
                      <Text color="gray.500" fontSize="sm" mb={2}>
                        {book.author}
                      </Text>
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        {book.genre}
                      </Text>
                      <Flex alignItems="center" mt={"60px"}>
                        <Text fontWeight="bold" mr={2}>
                          {book.rating} ⭐
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          ({book.quantity_rate} отзывов)
                        </Text>
                        {user ? <ModalMain user={user} book={book} /> : null}
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
