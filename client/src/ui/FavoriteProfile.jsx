/* eslint-disable react/prop-types */
import { Box, Image, Text, SimpleGrid } from "@chakra-ui/react";
import { SmallCloseIcon, Icon } from "@chakra-ui/icons";
import axiosInstance from "../axiosInstance";
import { coverThumbUrl } from "../utils/coverUrl";

const FavoriteProfile = ({
  favoriteBooks,
  handleBookClick,
  setFavoriteBooks,
  user,
}) => {
  async function handleDelete(id) {
    try {
      await axiosInstance.post(`/updateFavourites/${user.id}`, { bookId: id });
      setFavoriteBooks(favoriteBooks.filter((book) => book.id !== id));
    } catch (error) {
      console.error("Ошибка при удалении книги из избранного", error);
    }
  }

  return (
    <Box>
      <Text fontSize="20px" marginBottom="20px">
        Мои избранные книги
      </Text>
      {favoriteBooks.length === 0 && (
        <Text color="bw.textMuted">Пока нет избранных книг — добавьте их из каталога.</Text>
      )}
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing="20px">
        {favoriteBooks.map((book) => (
          <Box
            key={book.id}
            position="relative"
            cursor="pointer"
            onClick={() => handleBookClick(book)}
            transition="transform 0.15s ease, box-shadow 0.15s ease"
            _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
          >
            <Image
              src={coverThumbUrl(book.img) || "./default.jpg"}
              fallbackSrc="./default.jpg"
              alt={book.title}
              loading="lazy"
              width="150px"
              height="200px"
              objectFit="cover"
              borderRadius="10px"
            />
            <Icon
              as={SmallCloseIcon}
              position="absolute"
              top="6px"
              right="6px"
              color="white"
              boxSize={5}
              filter="drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.8))"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(book.id);
              }}
            />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default FavoriteProfile;
