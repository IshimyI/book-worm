import { Box, Center, Flex, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import ReviewProfile from "../ui/ReviewProfile";
import FavoriteProfile from "../ui/FavoriteProfile";
import AddBook from "../ui/AddBook";
import BookModal from "../ui/BookModal";

const Office = ({ user }) => {
  console.log(user);
  const [favoriteBooks, setFavoriteBooks] = useState([]);

  const [review, setReview] = useState([]);
  const [favorite, setFavorite] = useState([])
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        const reviewRes = await axiosInstance.get(
          `http://localhost:3000/api/listUserBooks/${user.id}`
        );
        const favoriteRes = await axiosInstance.get(
          `http://localhost:3000/api/favourites/${user.id}`
        );
        setReview(reviewRes.data);
        setFavorite(favoriteRes.data);
        console.log('понравились', favoriteRes.data);
        console.log('есть отзыв', reviewRes.data);
        
      } catch (error) {
        console.error("Ошибка при загрузке книг:", error);
      }
    })();
  }, []);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <div className="conteyner">
      <Center>
        <Box maxW="1200px" width="100%" padding="20px">
          <Flex justify="flex-end" align="center" mb="20px">
            <AddBook user={user} />
          </Flex>
          <ReviewProfile
            reviewBooks={review}
            handleBookClick={handleBookClick}
          />
          <Box marginTop="100px">
            <FavoriteProfile
              favoriteBooks={favorite}
              handleBookClick={handleBookClick}
              setFavoriteBooks={setFavoriteBooks}
            />
          </Box>
        </Box>
        <BookModal
          book={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
        />
      </Center>
    </div>
  );
};

export default Office;
