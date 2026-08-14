import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Heading, Text, Stack, Flex, Avatar, Skeleton, Badge } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import PageCard from '../ui/PageCard';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { withCount } from '../utils/pluralize';

const MEDALS = ['🥇', '🥈', '🥉'];
const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date());

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState(null);

  useSeoMeta({
    title: 'Топ читателей месяца',
    description: 'Самые активные рецензенты Mr Book Worm в этом месяце.',
  });

  useEffect(() => {
    axiosInstance
      .get('/leaderboard')
      .then((res) => setLeaders(res.data))
      .catch(() => setLeaders([]));
  }, []);

  return (
    <PageCard maxW="700px">
      <Heading as="h1" size="lg" mb="6px">Топ читателей</Heading>
      <Text color="bw.textMuted" mb="24px" textTransform="capitalize">{monthName}</Text>

      {leaders === null ? (
        <Stack spacing="10px">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height="60px" borderRadius="md" />)}
        </Stack>
      ) : leaders.length === 0 ? (
        <Text color="bw.textMuted">В этом месяце ещё нет рецензий — станьте первым!</Text>
      ) : (
        <Stack spacing="10px">
          {leaders.map((leader, i) => (
            <NavLink key={leader.id} to={`/users/${leader.id}`}>
              <Flex
                align="center"
                gap="14px"
                p="12px"
                border="1px solid"
                borderColor="bw.border"
                borderRadius="md"
                bg={i < 3 ? 'bw.reviewHighlight' : 'bw.cardBg'}
                _hover={{ borderColor: '#4b5320' }}
              >
                <Text fontSize="lg" w="32px" textAlign="center">{MEDALS[i] || `${i + 1}.`}</Text>
                <Avatar name={leader.name} src={resolveAvatarUrl(leader.avatarUrl)} size="sm" />
                <Box flex="1">
                  <Text fontWeight="bold">{leader.name}</Text>
                  <Text fontSize="sm" color="bw.textMuted">{withCount(leader.reviewCount, ['рецензия', 'рецензии', 'рецензий'])}</Text>
                </Box>
                {leader.helpfulCount > 0 && (
                  <Badge colorScheme="green">👍 {leader.helpfulCount}</Badge>
                )}
              </Flex>
            </NavLink>
          ))}
        </Stack>
      )}
    </PageCard>
  );
}
