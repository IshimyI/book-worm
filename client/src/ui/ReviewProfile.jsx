/* eslint-disable react/prop-types */
import { Box, Image, Text, SimpleGrid } from "@chakra-ui/react";

const ReviewProfile = ({ reviewBooks, handleBookClick }) => {
  return (
    <Box m={0}>
      <Text fontSize="20px" marginBottom="20px">
        Мои рецензии на книги
      </Text>
      {reviewBooks.length === 0 && (
        <Text color="gray.500">Вы ещё не оставляли рецензий — самое время начать.</Text>
      )}
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing="20px">
        {reviewBooks.map((book) => (
          <Box
            key={book.id}
            cursor="pointer"
            onClick={() => handleBookClick(book)}
            transition="transform 0.15s ease, box-shadow 0.15s ease"
            _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
          >
            <Image
              src={book.img}
              width="150px"
              height="200px"
              objectFit="cover"
              borderRadius="10px"
            />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ReviewProfile;
