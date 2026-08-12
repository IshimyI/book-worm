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
import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import ModalMain from "../ui/ModalMain";
import axiosInstance from "../axiosInstance";

const EMPTY_FILTERS = {
  genre: "",
  author: "",
  year: "",
  minRating: "",
  search: "",
};

const PAGE_SIZE = 10;

export default function MainPage({ user }) {
  const [booksData, setBooksData] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    axiosInstance
      .get("/listAllBooks")
      .then((response) => setBooksData(response.data))
      .catch((error) => console.error("Ошибка при получении всех books:", error));
  }, []);

  const uniqueGenres = useMemo(
    () => Array.from(new Set(booksData.map((b) => b.genre))).sort(),
    [booksData]
  );
  const uniqueAuthors = useMemo(
    () => Array.from(new Set(booksData.map((b) => b.author))).sort(),
    [booksData]
  );
  const uniqueYears = useMemo(
    () => Array.from(new Set(booksData.map((b) => b.year))).sort((a, b) => a - b),
    [booksData]
  );

  const visibleBooks = useMemo(() => {
    let result = booksData.filter((book) => {
      if (filters.genre && book.genre !== filters.genre) return false;
      if (filters.author && book.author !== filters.author) return false;
      if (filters.year && String(book.year) !== filters.year) return false;
      if (filters.minRating && Number(book.rating ?? 0) < Number(filters.minRating)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          (book.annotation || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      if (sortBy === "rating") return dir * ((a.rating ?? 0) - (b.rating ?? 0));
      if (sortBy === "reviews") return dir * ((a.quantity_rate ?? 0) - (b.quantity_rate ?? 0));
      if (sortBy === "year") return dir * (a.year - b.year);
      if (sortBy === "title") return dir * a.title.localeCompare(b.title, "ru");
      return 0;
    });

    return result;
  }, [booksData, filters, sortBy, sortDir]);

  const updateFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(visibleBooks.length / PAGE_SIZE));
  const pagedBooks = visibleBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              height="auto"
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
                value={filters.genre}
                onChange={updateFilter("genre")}
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
                value={filters.author}
                onChange={updateFilter("author")}
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
                value={filters.year}
                onChange={updateFilter("year")}
              >
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Рейтинг от"
                w={"90%"}
                m={"0 auto"}
                mt={"20px"}
                value={filters.minRating}
                onChange={updateFilter("minRating")}
              >
                <option value="3">от 3 ⭐</option>
                <option value="4">от 4 ⭐</option>
                <option value="4.5">от 4.5 ⭐</option>
              </Select>

              <Flex mt={"20px"} mb={"10px"} justifyContent={"center"} columnGap={"15px"}>
                <Button
                  sx={{
                    backgroundColor: "#334d00",
                    color: "white",
                  }}
                  size="sm"
                  onClick={resetFilters}
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
                  value={filters.search}
                  onChange={updateFilter("search")}
                />
                <Select
                  w={200}
                  bg={"white"}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">По рейтингу</option>
                  <option value="reviews">По популярности</option>
                  <option value="title">По названию</option>
                  <option value="year">По году издания</option>
                </Select>
                <Select
                  w={140}
                  bg={"white"}
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                >
                  <option value="desc">По убыванию</option>
                  <option value="asc">По возрастанию</option>
                </Select>
              </div>

              <Text textAlign="left" color="gray.600" fontSize="sm" mb="12px">
                Найдено книг: {visibleBooks.length}
              </Text>

              {pagedBooks.map((book) => (
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
                    <NavLink to={`/books/${book.id}`}>
                      <Image
                        src={book.img}
                        alt={book.title}
                        width="180px"
                        height="250px"
                        objectFit="cover"
                        mr={4}
                      />
                    </NavLink>
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
                      <Flex alignItems="center" mt={"30px"} columnGap="10px" flexWrap="wrap">
                        <Text fontWeight="bold" mr={2}>
                          {book.rating == null ? 0 : book.rating} ⭐
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          ({book.quantity_rate == null ? 0 : book.quantity_rate}{" "}
                          отзывов)
                        </Text>
                        <ModalMain user={user} book={book} />
                        <NavLink to={`/books/${book.id}`}>
                          <Button
                            size="sm"
                            ml={"8px"}
                            sx={{
                              backgroundColor: "#4b5320",
                              color: "white",
                              boxShadow: "0 2px 6px rgba(75,83,32,0.4)",
                            }}
                          >
                            Смотреть книгу →
                          </Button>
                        </NavLink>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}

              {totalPages > 1 && (
                <Flex justifyContent="center" alignItems="center" columnGap="10px" mt="10px" mb="30px">
                  <Button
                    size="sm"
                    isDisabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    sx={{ backgroundColor: "#334d00", color: "white" }}
                  >
                    ← Назад
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Страница {page} из {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    isDisabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    sx={{ backgroundColor: "#334d00", color: "white" }}
                  >
                    Вперёд →
                  </Button>
                </Flex>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
