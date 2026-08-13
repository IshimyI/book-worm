import { useEffect, useState } from 'react';
import {
  Box, Text, Stack, Flex, Spinner, Center, Select, Table, Thead, Tbody, Tr, Th, Td,
  Button, TableContainer, Badge,
} from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

const TYPE_COLORS = {
  failed_login: 'orange',
  signup_bot_blocked: 'red',
  rate_limited: 'yellow',
  '2fa_enabled': 'green',
  '2fa_disabled': 'orange',
  password_reset_requested: 'blue',
};

export default function SecurityEventLog() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get('/admin/security-events', { params: { page, type: type || undefined, pageSize: 25 } })
      .then((res) => setData(res.data))
      .catch(() => setData(false))
      .finally(() => setLoading(false));
  }, [page, type]);

  if (loading && !data) {
    return <Center py="60px"><Spinner size="xl" /></Center>;
  }
  if (!data) {
    return <Text color="bw.textMuted" textAlign="center" py="40px">Не удалось загрузить журнал безопасности.</Text>;
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="16px" flexWrap="wrap" gap="10px">
        <Text fontSize="sm" color="bw.textMuted">Всего событий: {data.total}</Text>
        <Select
          maxW="260px"
          size="sm"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        >
          <option value="">Все типы</option>
          {data.types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </Flex>

      {data.events.length === 0 ? (
        <Text color="bw.textMuted" textAlign="center" py="40px">Событий не найдено.</Text>
      ) : (
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Когда</Th>
                <Th>Тип</Th>
                <Th>Email</Th>
                <Th>IP</Th>
                <Th>Детали</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.events.map((e) => (
                <Tr key={e.id}>
                  <Td whiteSpace="nowrap">{dateTimeFormatter.format(new Date(e.createdAt))}</Td>
                  <Td>
                    <Badge colorScheme={TYPE_COLORS[e.type] || 'gray'} fontSize="0.75em">{e.type}</Badge>
                  </Td>
                  <Td>{e.email || '—'}</Td>
                  <Td>{e.ip || '—'}</Td>
                  <Td maxW="240px" whiteSpace="normal" wordBreak="break-word">{e.detail || '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {data.totalPages > 1 && (
        <Stack direction="row" justify="center" align="center" mt="16px" spacing={4}>
          <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page <= 1}>
            Назад
          </Button>
          <Text fontSize="sm" color="bw.textMuted">Стр. {data.page} из {data.totalPages}</Text>
          <Button size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} isDisabled={page >= data.totalPages}>
            Вперёд
          </Button>
        </Stack>
      )}
    </Box>
  );
}
