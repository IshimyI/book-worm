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
<<<<<<< HEAD
          {reviewBooks.map((book) => (
            <Box key={book.id} position="relative" onClick={() => handleBookClick(book)}>
              <Image
                src={book.IMG}
                width="120px"
                height="200px"
                objectFit="cover"
              />
            </Box>
          ))}
=======
        {reviewBooks.map((book) => (
          <Box key={book.id} position="relative">
            <Image
              src={book.IMG}
              width="120px"
              height="200px"
              objectFit="cover"
            />
          </Box>
        ))}
>>>>>>> c34977daa4b0a3970f75de5bd137244f0e7e6288
      </Slider>
    </Box>
  );
};

export default ReviewProfile;
