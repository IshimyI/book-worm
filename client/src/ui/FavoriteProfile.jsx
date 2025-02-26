import { Box, Image, Text } from "@chakra-ui/react";
import Slider from "react-slick";

const FavoriteProfile = ({ favoriteBooks }) => {
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
            <Box key={book.id} position="relative">
              <Image
                src={book.IMG}
                width="120px"
                height="200px"
                objectFit="cover"
              />
            </Box>
          ))}
      </Slider>
    </Box>
  );
};

export default FavoriteProfile;
