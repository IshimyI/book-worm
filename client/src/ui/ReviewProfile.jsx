import { Box, Image, Text, Wrap } from "@chakra-ui/react";
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
    <Box m={0}>
      <Text fontSize="20px" marginBottom="20px">
        Мои рецензии на книги
      </Text>
      <Wrap>
        {console.log('reviewBooks', reviewBooks)}
          {reviewBooks.map((book) => (
            <Box key={book.id} position="relative" onClick={() => handleBookClick(book)}>
              <Image
                src={book.img}
                width="150px"
                height="200px"
                objectFit="cover"
                borderRadius='10px'
              />
            </Box>
          ))}
      </Wrap>
    </Box>
  );
};

export default ReviewProfile;
