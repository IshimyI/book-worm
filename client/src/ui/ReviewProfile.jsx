import { Box, Image, Text } from "@chakra-ui/react";
import Slider from "react-slick";

const ReviewProfile = ({ reviewBooks }) => {
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

export default ReviewProfile;
