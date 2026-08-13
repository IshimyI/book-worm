import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Heading, Text, SimpleGrid, Flex, Image, Skeleton } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import PageCard from '../ui/PageCard';
import { withCount } from '../utils/pluralize';

export default function CollectionsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeoMeta({
    title: 'Подборки книг',
    description: 'Тематические подборки книг от редакции Mr Book Worm.',
  });

  useEffect(() => {
    axiosInstance
      .get('/lists/curated')
      .then((res) => setLists(res.data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageCard maxW="900px">
      <Heading as="h1" size="lg" mb="10px">Подборки книг</Heading>
      <Text color="bw.textMuted" mb="30px">Тематические списки от редакции сайта</Text>

      {loading ? (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="16px">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} height="140px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : lists.length === 0 ? (
        <Text color="bw.textMuted">Подборок пока нет — загляните позже.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="16px">
          {lists.map((list) => (
            <NavLink key={list.id} to={`/lists/${list.id}`}>
              <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="16px" bg="bw.cardBg" _hover={{ borderColor: '#4b5320', boxShadow: 'sm' }} transition="border-color 0.15s ease">
                <Heading as="h3" size="sm" mb="6px">{list.name}</Heading>
                {list.description && (
                  <Text fontSize="sm" color="bw.textMuted" mb="10px" noOfLines={2}>{list.description}</Text>
                )}
                <Text fontSize="sm" color="bw.textMuted" mb="10px">
                  {withCount(list.bookCount, ['книга', 'книги', 'книг'])}
                </Text>
                {list.covers.length > 0 && (
                  <Flex gap="6px">
                    {list.covers.map((cover, i) => (
                      <Image key={i} src={cover || './default.jpg'} alt="" loading="lazy" width="44px" height="60px" objectFit="cover" borderRadius="4px" />
                    ))}
                  </Flex>
                )}
              </Box>
            </NavLink>
          ))}
        </SimpleGrid>
      )}
    </PageCard>
  );
}
