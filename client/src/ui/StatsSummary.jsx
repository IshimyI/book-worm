/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Text, Heading, Stack, Flex, Spinner, Center, SimpleGrid } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

function Bar({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <Flex align="center" gap="10px" mb="6px">
      <Text fontSize="sm" flex="1" noOfLines={1} title={label}>{label}</Text>
      <Box flex="2" bg="bw.border" borderRadius="full" h="8px" overflow="hidden">
        <Box bg="bw.accentSolid" h="100%" width={`${Math.max(pct, 3)}%`} />
      </Box>
      <Text fontSize="sm" color="bw.textMuted" minW="30px" textAlign="right">{count}</Text>
    </Flex>
  );
}

function StatCard({ label, value }) {
  return (
    <Box p="4" border="1px solid" borderColor="bw.border" borderRadius="md" textAlign="center">
      <Text fontSize="sm" color="bw.textMuted">{label}</Text>
      <Text fontSize="2xl" fontWeight="bold">{value}</Text>
    </Box>
  );
}

export default function StatsSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/admin/stats')
      .then((res) => setData(res.data))
      .catch(() => setData(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Center py="60px"><Spinner size="xl" /></Center>;
  }
  if (!data) {
    return <Text color="bw.textMuted" textAlign="center" py="40px">Не удалось загрузить статистику.</Text>;
  }

  const maxUsersDay = Math.max(...data.usersByDay.map((d) => d.count), 1);
  const maxReviewsDay = Math.max(...data.reviewsByDay.map((d) => d.count), 1);
  const maxTopBook = Math.max(...data.topBooks.map((b) => b.reviewCount), 1);

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb="24px">
        <StatCard label="Пользователей" value={data.totalUsers} />
        <StatCard label="Рецензий" value={data.totalReviews} />
        <StatCard label="Книг" value={data.totalBooks} />
      </SimpleGrid>

      <Heading as="h3" size="sm" mb="10px">Новые пользователи за 30 дней</Heading>
      {data.usersByDay.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных</Text>
      ) : (
        <Stack spacing={1} mb="24px">
          {data.usersByDay.map((d) => (
            <Bar key={d.date} label={dateFormatter.format(new Date(d.date))} count={d.count} max={maxUsersDay} />
          ))}
        </Stack>
      )}

      <Heading as="h3" size="sm" mb="10px">Новые рецензии за 30 дней</Heading>
      {data.reviewsByDay.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных</Text>
      ) : (
        <Stack spacing={1} mb="24px">
          {data.reviewsByDay.map((d) => (
            <Bar key={d.date} label={dateFormatter.format(new Date(d.date))} count={d.count} max={maxReviewsDay} />
          ))}
        </Stack>
      )}

      <Heading as="h3" size="sm" mb="10px">Топ книг по числу рецензий</Heading>
      {data.topBooks.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных</Text>
      ) : (
        <Stack spacing={1}>
          {data.topBooks.map((b) => (
            <Bar key={b.id} label={`${b.title} — ${b.author}`} count={b.reviewCount} max={maxTopBook} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
