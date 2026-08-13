import { useEffect, useState } from 'react';
import { Box, Heading, Flex, Image, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { coverThumbUrl } from '../utils/coverUrl';

export default function TrendingStrip() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    axiosInstance
      .get('/trending')
      .then((res) => setBooks(res.data))
      .catch(() => setBooks([]));
  }, []);

  if (books.length === 0) return null;

  return (
    <Box mb="20px">
      <Heading as="h2" size="sm" mb="10px">🔥 Популярное на этой неделе</Heading>
      <Flex gap="14px" overflowX="auto" pb="6px">
        {books.map((book) => (
          <NavLink key={book.id} to={`/books/${book.id}`} style={{ flexShrink: 0 }}>
            <Box width="100px" _hover={{ opacity: 0.85 }}>
              <Image
                src={coverThumbUrl(book.img) || './default.jpg'}
                alt={book.title}
                loading="lazy"
                width="100px"
                height="140px"
                objectFit="cover"
                borderRadius="6px"
              />
              <Text fontSize="xs" mt="4px" noOfLines={2}>{book.title}</Text>
            </Box>
          </NavLink>
        ))}
      </Flex>
    </Box>
  );
}
