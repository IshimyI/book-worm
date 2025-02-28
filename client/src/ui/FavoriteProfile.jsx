import { Box, Image, Text, Wrap } from "@chakra-ui/react";
import { SmallCloseIcon, Icon } from "@chakra-ui/icons";
import Slider from "react-slick";
import axiosInstance from "../axiosInstance";

const FavoriteProfile = ({
  favoriteBooks,
  handleBookClick,
  setFavoriteBooks,
}) => {
  // const [favorite, setFavorite] = useState([]);
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 3,
    arrows: true,
  };

  async function handleDelete(id) {
    try {
      await axiosInstance.delete(`http://localhost:3000/api/favourites/${id}`);
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
      <Wrap>
        {favoriteBooks.map((book) => {
          console.log(book);
          return (
            <Box
              key={book.id}
              position="relative"
              onClick={() => handleBookClick(book)}
            >
              <Image
                src={book.img || "./default.jpg"}
                width="150px"
                height="200px"
                objectFit="cover"
                borderRadius="10px"
              />
              <Icon
                as={SmallCloseIcon}
                position="absolute"
                top="1vh"
                right="4vh"
                color="white"
                boxSize={5}
                filter="drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.8))"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(book.id);
                }}
              />
            </Box>
          );
        })}
      </Wrap>
    </Box>
  );
};

export default FavoriteProfile;
