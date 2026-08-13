/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, Stack, Image, Avatar, Flex, Button, Skeleton, SkeletonText } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import { coverThumbUrl } from '../utils/coverUrl';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import PageCard from '../ui/PageCard';

export default function FeedPage({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useSeoMeta({ title: 'Лента подписок' });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    axiosInstance
      .get('/feed', { params: { page, pageSize: 15 } })
      .then((res) => setData(res.data))
      .catch(() => setData(false))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (!user) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Войдите, чтобы видеть ленту подписок</Text>
        <NavLink to="/auth">
          <Button backgroundColor="#334d00" color="white">Войти</Button>
        </NavLink>
      </Center>
    );
  }

  if (loading) {
    return (
      <PageCard maxW="800px">
        <Skeleton height="32px" width="200px" mb="20px" />
        {[...Array(3)].map((_, i) => (
          <Flex key={i} gap="14px" p="12px" mb="14px" border="1px solid" borderColor="bw.border" borderRadius="md">
            <Skeleton width="60px" height="84px" borderRadius="4px" />
            <Box flex="1"><SkeletonText noOfLines={2} spacing="2" /></Box>
          </Flex>
        ))}
      </PageCard>
    );
  }

  return (
    <PageCard maxW="800px">
      <Heading as="h1" size="lg" mb="10px">Лента</Heading>

      {!data || data.following === 0 ? (
        <Text color="bw.textMuted">
          Вы пока ни на кого не подписаны — откройте профиль автора рецензии и нажмите «Подписаться», чтобы видеть его новые отзывы здесь.
        </Text>
      ) : data.reviews.length === 0 ? (
        <Text color="bw.textMuted">Пока нет новых рецензий от тех, на кого вы подписаны.</Text>
      ) : (
        <Stack spacing="14px">
          {data.reviews.map((review) => (
            <Box key={review.id} p="12px" border="1px solid" borderColor="bw.border" borderRadius="md">
              <Flex align="center" gap="8px" mb="6px">
                <Avatar name={review.userName} src={resolveAvatarUrl(review.userAvatarUrl)} size="xs" />
                <Text fontSize="sm" color="bw.textMuted">
                  <NavLink to={`/users/${review.userId}`} style={{ textDecoration: 'underline' }}>
                    {review.userName}
                  </NavLink>{' '}
                  оставил(а) рецензию
                </Text>
              </Flex>
              <NavLink to={`/books/${review.bookId}`}>
                <Flex gap="14px" _hover={{ opacity: 0.85 }}>
                  <Image src={coverThumbUrl(review.bookImg)} alt={review.bookTitle} loading="lazy" width="60px" height="84px" objectFit="cover" borderRadius="4px" />
                  <Box>
                    <Text fontWeight="bold">{review.bookTitle}</Text>
                    <Text fontSize="sm" noOfLines={2}>{review.body}</Text>
                    <Text fontSize="sm">{review.rating} ⭐</Text>
                  </Box>
                </Flex>
              </NavLink>
            </Box>
          ))}
        </Stack>
      )}

      {data && data.totalPages > 1 && (
        <Flex justifyContent="center" alignItems="center" columnGap="10px" mt="20px">
          <Button
            size="sm"
            isDisabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            sx={{ backgroundColor: '#334d00', color: 'white' }}
          >
            ← Назад
          </Button>
          <Text fontSize="sm" color="bw.textMuted">
            Страница {page} из {data.totalPages}
          </Text>
          <Button
            size="sm"
            isDisabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            sx={{ backgroundColor: '#334d00', color: 'white' }}
          >
            Вперёд →
          </Button>
        </Flex>
      )}
    </PageCard>
  );
}
