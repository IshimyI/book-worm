import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, Stack, Avatar, Divider, Image, Flex, Button, Skeleton, SkeletonCircle, SkeletonText } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useSeoMeta({
    enabled: Boolean(profile),
    title: profile ? `${profile.name} — профиль` : '',
    description: profile ? `${profile.reviewCount} рецензий от ${profile.name} на Mr Book Worm` : '',
  });

  useEffect(() => {
    setPage(1);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/users/${id}/profile`, { params: { page, pageSize: 10 } })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(false))
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading) {
    return (
      <Center py="40px" px="20px">
        <Box maxW="800px" width="100%" bg="#fffdf7" borderRadius="lg" boxShadow="md" p="30px" borderTop="4px solid #4b5320">
          <Flex align="center" gap="16px" mb="10px">
            <SkeletonCircle size="16" />
            <Box flex="1">
              <Skeleton height="24px" width="200px" mb="10px" />
              <Skeleton height="14px" width="260px" />
            </Box>
          </Flex>
          <Divider my="20px" />
          <Skeleton height="20px" width="120px" mb="16px" />
          {[...Array(3)].map((_, i) => (
            <Flex key={i} gap="14px" p="12px" mb="14px" border="1px solid #eee" borderRadius="md">
              <Skeleton width="60px" height="84px" borderRadius="4px" />
              <Box flex="1"><SkeletonText noOfLines={2} spacing="2" /></Box>
            </Flex>
          ))}
        </Box>
      </Center>
    );
  }

  if (!profile) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Пользователь не найден</Text>
        <NavLink to="/">
          <Button backgroundColor="#334d00" color="white">На главную</Button>
        </NavLink>
      </Center>
    );
  }

  return (
    <Center py="40px" px="20px">
      <Box maxW="800px" width="100%" bg="#fffdf7" borderRadius="lg" boxShadow="md" p="30px" borderTop="4px solid #4b5320">
        <NavLink to="/">
          <Button variant="link" mb="20px" sx={{ color: '#334d00' }}>
            <ArrowBackIcon mr="6px" /> К каталогу
          </Button>
        </NavLink>

        <Flex align="center" gap="16px" mb="10px">
          <Avatar name={profile.name} size="lg" />
          <Box>
            <Heading as="h1" size="lg">{profile.name}</Heading>
            <Text color="gray.500" fontSize="sm">
              На сайте с {dateFormatter.format(new Date(profile.memberSince))} · {profile.reviewCount} рецензий
            </Text>
          </Box>
        </Flex>

        <Divider my="20px" />

        <Heading as="h2" size="md" mb="16px">Рецензии</Heading>
        {profile.reviews.length === 0 ? (
          <Text color="gray.500">Пока нет рецензий</Text>
        ) : (
          <Stack spacing="14px">
            {profile.reviews.map((review) => (
              <NavLink key={review.id} to={`/books/${review.bookId}`}>
                <Flex
                  gap="14px"
                  p="12px"
                  border="1px solid #ddd"
                  borderRadius="md"
                  _hover={{ borderColor: '#4b5320', boxShadow: 'sm' }}
                  transition="border-color 0.15s ease"
                >
                  <Image src={review.bookImg} alt={review.bookTitle} width="60px" height="84px" objectFit="cover" borderRadius="4px" />
                  <Box>
                    <Text fontWeight="bold">{review.bookTitle}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>{review.body}</Text>
                    <Text fontSize="sm">{review.rating} ⭐</Text>
                  </Box>
                </Flex>
              </NavLink>
            ))}
          </Stack>
        )}

        {profile.totalPages > 1 && (
          <Flex justifyContent="center" alignItems="center" columnGap="10px" mt="20px">
            <Button
              size="sm"
              isDisabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ backgroundColor: '#334d00', color: 'white' }}
            >
              ← Назад
            </Button>
            <Text fontSize="sm" color="gray.600">
              Страница {page} из {profile.totalPages}
            </Text>
            <Button
              size="sm"
              isDisabled={page >= profile.totalPages}
              onClick={() => setPage((p) => Math.min(profile.totalPages, p + 1))}
              sx={{ backgroundColor: '#334d00', color: 'white' }}
            >
              Вперёд →
            </Button>
          </Flex>
        )}
      </Box>
    </Center>
  );
}
