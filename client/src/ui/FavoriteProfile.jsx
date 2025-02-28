import { Box, Image, Text } from "@chakra-ui/react";
import { SmallCloseIcon } from "@chakra-ui/icons";
import Slider from "react-slick";

const FavoriteProfile = ({ favoriteBooks, handleBookClick }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 3,
    arrows: true,
  };

  return (
    <Box>
      <Text fontSize="20px" marginBottom="20px">
        Мои избранные книги
      </Text>
      <Slider {...settings}>
        {favoriteBooks.map((book) => (
          <Box
            key={book.id}
            position="relative"
            onClick={() => handleBookClick(book)}
          >
            <Image
              src="./default.jpg"
              width="150px"
              height="200px"
              objectFit="cover"
              borderRadius="10px"
            />
            <SmallCloseIcon
              position="absolute"
              top="5px"
              right="4vh"
              color="white"
              boxShadow='0px 0px 30px'
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default FavoriteProfile;
