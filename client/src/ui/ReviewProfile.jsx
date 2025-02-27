import { Box, Image, Text } from "@chakra-ui/react";
import Slider from "react-slick";

const ReviewProfile = ({ reviewBooks, handleBookClick }) => {
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
        Мои рецензии на книги
      </Text>
      <Slider {...settings}>
          {reviewBooks.map((book) => (
            <Box key={book.id} position="relative" onClick={() => handleBookClick(book)}>
              <Image
                src='./default.jpg'
                width="150px"
                height="200px"
                objectFit="cover"
                borderRadius='10px'
              />
            </Box>
          ))}
      </Slider>
    </Box>
  );
};

export default ReviewProfile;
