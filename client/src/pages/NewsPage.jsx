import { useEffect, useState } from 'react';
import { Box, Center, Heading, Text, Stack, Spinner } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function NewsPage() {
  const [news, setNews] = useState(null);

  useSeoMeta({
    title: 'Новости',
    description: 'Новости и обновления Mr Book Worm — каталога книг с рейтингами и рецензиями.',
  });

  useEffect(() => {
    axiosInstance
      .get('/news')
      .then((res) => setNews(res.data))
      .catch(() => setNews([]));
  }, []);

  if (news === null) {
    return (
      <Center py="100px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Center py="40px" px="20px">
      <Box maxW="800px" width="100%">
        <Box bg="#fffdf7" borderRadius="lg" boxShadow="md" p="30px" mb="24px" borderTop="4px solid #4b5320">
          <Heading as="h1" size="lg">Новости</Heading>
          <Text color="gray.600" mt="6px">Что нового на Mr Book Worm</Text>
        </Box>
        <Stack spacing="18px">
          {news.map((item) => (
            <Box key={item.id} bg="#fffdf7" borderRadius="lg" boxShadow="md" p="24px">
              <Text fontSize="xs" color="gray.500" mb="6px" textTransform="uppercase" letterSpacing="0.5px">
                {dateFormatter.format(new Date(item.createdAt))}
              </Text>
              <Heading as="h2" size="md" mb="10px">{item.title}</Heading>
              <Text color="gray.700">{item.body}</Text>
            </Box>
          ))}
        </Stack>
      </Box>
    </Center>
  );
}
