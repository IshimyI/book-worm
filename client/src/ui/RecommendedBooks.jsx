/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Box, Image, Text, SimpleGrid } from "@chakra-ui/react";
import axiosInstance from "../axiosInstance";
import { coverThumbUrl } from "../utils/coverUrl";

const RecommendedBooks = ({ handleBookClick }) => {
  const [books, setBooks] = useState([]);
  const [basedOnGenre, setBasedOnGenre] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/recommendations")
      .then((res) => {
        setBooks(res.data.books);
        setBasedOnGenre(res.data.basedOnGenre);
      })
      .catch(() => setBooks([]));
  }, []);

  if (books.length === 0) return null;

  return (
    <Box>
      <Text fontSize="20px" marginBottom="10px">
        Рекомендуем вам
      </Text>
      {basedOnGenre && (
        <Text fontSize="sm" color="bw.textMuted" mb="20px">
          На основе жанра «{basedOnGenre}», который вы часто оцениваете
        </Text>
      )}
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing="20px">
        {books.map((book) => (
          <Box
            key={book.id}
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
            <Text fontSize="sm" mt="6px" noOfLines={2}>{book.title}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default RecommendedBooks;
