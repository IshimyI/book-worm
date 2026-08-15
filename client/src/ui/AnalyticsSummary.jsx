/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Text, Heading, Stack, Flex, Spinner, Center } from '@chakra-ui/react';
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

export default function AnalyticsSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/admin/analytics')
      .then((res) => setData(res.data))
      .catch(() => setData(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Center py="60px"><Spinner size="xl" /></Center>;
  }
  if (!data) {
    return <Text color="bw.textMuted" textAlign="center" py="40px">Не удалось загрузить аналитику.</Text>;
  }

  const maxDayCount = Math.max(...data.viewsByDay.map((d) => d.count), 1);
  const maxPathCount = Math.max(...data.topPaths.map((p) => p.count), 1);
  const maxReferrerCount = Math.max(...data.topReferrers.map((r) => r.count), 1);

  return (
    <Box>
      <Text fontSize="sm" color="bw.textMuted" mb="20px">
        Без cookie и без отслеживания посетителей — только счётчики просмотров страниц за последние 30 дней.
      </Text>

      <Heading as="h3" size="sm" mb="10px">Всего просмотров: {data.totalViews}</Heading>

      <Heading as="h3" size="sm" mt="24px" mb="10px">По дням</Heading>
      {data.viewsByDay.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных</Text>
      ) : (
        <Stack spacing={1}>
          {data.viewsByDay.map((d) => (
            <Bar key={d.date} label={dateFormatter.format(new Date(d.date))} count={d.count} max={maxDayCount} />
          ))}
        </Stack>
      )}

      <Heading as="h3" size="sm" mt="24px" mb="10px">Популярные страницы</Heading>
      {data.topPaths.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных</Text>
      ) : (
        <Stack spacing={1}>
          {data.topPaths.map((p) => (
            <Bar key={p.path} label={p.path} count={p.count} max={maxPathCount} />
          ))}
        </Stack>
      )}

      <Heading as="h3" size="sm" mt="24px" mb="10px">Источники переходов</Heading>
      {data.topReferrers.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm">Пока нет данных (в основном прямые заходы)</Text>
      ) : (
        <Stack spacing={1}>
          {data.topReferrers.map((r) => (
            <Bar key={r.referrer} label={r.referrer} count={r.count} max={maxReferrerCount} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
