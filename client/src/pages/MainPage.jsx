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
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ModalMain from "../ui/ModalMain";
import axiosInstance from "../axiosInstance";
import useSeoMeta from "../utils/useSeoMeta";

const EMPTY_FILTERS = {
  genre: "",
  author: "",
  year: "",
  minRating: "",
  search: "",
};

export default function MainPage({ user, setUser }) {
  useSeoMeta({
    title: "Каталог книг",
    description: "Каталог книг с рейтингами и рецензиями читателей — находите книги, читайте отзывы и оценивайте прочитанное.",
  });

  const [books, setBooks] = useState([]);
  const [facets, setFacets] = useState({ genres: [], authors: [], years: [] });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDir]);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/listAllBooks", {
        params: { page, pageSize: 10, sortBy, sortDir, ...filters },
      })
      .then((response) => {
        setBooks(response.data.books);
        setFacets(response.data.facets);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      })
      .catch((error) => console.error("Ошибка при получении всех books:", error))
      .finally(() => setLoading(false));
  }, [page, filters, sortBy, sortDir]);

  const updateFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
  };

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
                {facets.genres.map((genre) => (
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
                {facets.authors.map((author) => (
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
                {facets.years.map((year) => (
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
                Найдено книг: {total}
              </Text>

              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Box
                    bg="white"
                    key={i}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                    mb="20px"
                    h={250}
                    w={{ base: "100%", md: "700px" }}
                  >
                    <Flex align="start">
                      <Skeleton width="180px" height="250px" mr={4} />
                      <Box p="4" mt="10px" flex="1">
                        <Skeleton height="24px" width="60%" mb="10px" />
                        <Skeleton height="14px" width="40%" mb="10px" />
                        <SkeletonText noOfLines={2} spacing="2" mb="20px" width="80%" />
                        <Skeleton height="36px" width="200px" />
                      </Box>
                    </Flex>
                  </Box>
                ))
              ) : (
                books.map((book) => (
                  <Box
                    bg={"white"}
                    key={book.id}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                    mb={"20px"}
                    h={{ base: "auto", md: 250 }}
                    w={{ base: "100%", md: "700px" }}
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
                          <ModalMain user={user} setUser={setUser} book={book} />
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
                ))
              )}

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
