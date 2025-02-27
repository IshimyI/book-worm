import { Box, Center, Flex, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import ReviewProfile from "../ui/ReviewProfile";
import FavoriteProfile from "../ui/FavoriteProfile";
import AddBook from "../ui/AddBook";
import BookModal from "../ui/BookModal";

const Office = ({ user }) => {
  const [review, setReview] = useState([
    {
      id: 1,
      author: "Лев Толстой",
      genre: "Роман",
      year: 1869,
      rating: "7.8",
      description: "Эпопея о войне, любви и жизни русского народа.",
      IMG: "./default.jpg",
    },
    {
      id: 2,
      author: "Другой автор",
      genre: "ужасы",
      year: 1700,
      rating: "8.0",
      description: "Тут другая книга.",
      IMG: "./default.jpg",
    },
    { id: 3, IMG: "./default.jpg" },
    { id: 4, IMG: "./default.jpg" },
    { id: 5, IMG: "./default.jpg" },
    { id: 6, IMG: "./default.jpg" },
    { id: 7, IMG: "./default.jpg" },
    { id: 8, IMG: "./default.jpg" },
    { id: 9, IMG: "./default.jpg" },
    { id: 10, IMG: "./default.jpg" },
  ]);
  const [favorite, setFavorite] = useState([
    { id: 1, IMG: "./default.jpg" },
    { id: 2, IMG: "./default.jpg" },
    { id: 3, IMG: "./default.jpg" },
    { id: 4, IMG: "./default.jpg" },
    { id: 5, IMG: "./default.jpg" },
  ]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // (async function () {
    //   try {
    //     const reviewRes = await axiosInstance.get(
    //       "http://localhost:3000/api/review"
    //     );
    //     const favoriteRes = await axiosInstance.get(
    //       "http://localhost:3000/api/favorite"
    //     );
    //     setReview(reviewRes.data);
    //     setFavorite(favoriteRes.data);
    //   } catch (error) {
    //     console.error("Ошибка при загрузке книг:", error);
    //   }
    // })();
  }, []);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <Center>
      <Box maxW="1200px" width="100%" padding="20px">
        <Flex justify="flex-end" align="center" mb="20px">
          {/* <Button colorScheme="blue" onClick={handleOpen}>Добавить рецензию</Button> */}

          <AddBook user={user} />
        </Flex>
        <ReviewProfile reviewBooks={review} handleBookClick={handleBookClick} />
        <Box marginTop="100px">
          <FavoriteProfile favoriteBooks={favorite} handleBookClick={handleBookClick} />
        </Box>
      </Box>
      <BookModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Center>
  );
};

export default Office;
