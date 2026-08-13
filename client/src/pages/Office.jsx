/* eslint-disable react/prop-types */
import { Box, Center, Flex } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import ReviewProfile from "../ui/ReviewProfile";
import FavoriteProfile from "../ui/FavoriteProfile";
import AddBook from "../ui/AddBook";
import BookModal from "../ui/BookModal";
import RecommendedBooks from "../ui/RecommendedBooks";
import AvatarUpload from "../ui/AvatarUpload";
import TwoFactorSettings from "../ui/TwoFactorSettings";
import PushNotificationSettings from "../ui/PushNotificationSettings";
import ReadingShelves from "../ui/ReadingShelves";
import ReadingChallenge from "../ui/ReadingChallenge";

const Office = ({ user, setUser }) => {
  const [review, setReview] = useState([]);
  const [favorite, setFavorite] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        const reviewRes = await axiosInstance.get(`/listUserBooks/${user.id}`);
        const favoriteRes = await axiosInstance.get(`/favourites/${user.id}`);
        setReview(reviewRes.data);
        setFavorite(favoriteRes.data);
      } catch (error) {
        console.error("Ошибка при загрузке книг:", error);
      }
    })();
  }, [user.id]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <div className="conteyner">
      <Center>
        <Box maxW="1200px" width="100%" padding="20px">
          <Flex justify="space-between" align="center" mb="30px" flexWrap="wrap" gap="16px">
            <AvatarUpload user={user} setUser={setUser} />
            <AddBook user={user} />
          </Flex>
          <Flex mb="30px" gap="16px" flexWrap="wrap" align="stretch">
            <Box flex="1" minW="280px">
              <TwoFactorSettings user={user} setUser={setUser} />
            </Box>
            <Box flex="1" minW="280px">
              <PushNotificationSettings />
            </Box>
            <Box flex="1" minW="280px">
              <ReadingChallenge />
            </Box>
          </Flex>
          <Box mb="60px">
            <ReadingShelves handleBookClick={handleBookClick} />
          </Box>
          <ReviewProfile
            reviewBooks={review}
            handleBookClick={handleBookClick}
          />
          <Box marginTop="60px">
            <FavoriteProfile
              favoriteBooks={favorite}
              handleBookClick={handleBookClick}
              setFavoriteBooks={setFavorite}
              user={user}
            />
          </Box>
          <Box marginTop="60px">
            <RecommendedBooks handleBookClick={handleBookClick} />
          </Box>
        </Box>
        <BookModal
          book={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          setUser={setUser}
        />
      </Center>
    </div>
  );
};

export default Office;
