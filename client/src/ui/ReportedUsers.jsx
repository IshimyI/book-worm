/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Text, Stack, Flex, Button, Center, Spinner, Badge, useToast } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { withCount } from '../utils/pluralize';
import useConfirm from './useConfirm';

export default function ReportedUsers({ onCountChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/admin/reported-users')
      .then((res) => {
        setUsers(res.data);
        onCountChange?.(res.data.length);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = async (id) => {
    if (!(await confirm('Сбросить все жалобы на этого пользователя?', { confirmLabel: 'Сбросить' }))) return;
    try {
      await axiosInstance.post(`/admin/reported-users/${id}/dismiss`);
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== id);
        onCountChange?.(next.length);
        return next;
      });
      toast({ title: 'Жалобы сброшены', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сбросить жалобы', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (loading) {
    return <Center py="60px"><Spinner size="xl" /></Center>;
  }

  return (
    <>
      {ConfirmDialog}
      {users.length === 0 ? (
        <Text color="bw.textMuted" textAlign="center" py="40px">Жалоб на пользователей нет.</Text>
      ) : (
        <Stack spacing={4}>
          {users.map((u) => (
            <Box key={u.id} p="4" border="1px solid" borderColor="bw.border" borderRadius="md">
              <Flex justify="space-between" align="flex-start" mb="2" flexWrap="wrap" gap="8px">
                <Box>
                  <NavLink to={`/users/${u.id}`}>
                    <Text fontWeight="bold" _hover={{ textDecoration: 'underline' }}>{u.name}</Text>
                  </NavLink>
                  <Text fontSize="sm" color="bw.textMuted">{u.email}</Text>
                </Box>
                <Badge colorScheme="red" fontSize="0.9em">{withCount(u.reportCount, ['жалоба', 'жалобы', 'жалоб'])}</Badge>
              </Flex>
              <Stack spacing={1} mb="3">
                {u.reports.map((r) => (
                  <Text key={r.id} fontSize="sm" color="bw.textMuted">
                    {r.reporter?.name || 'Аноним'}: {r.reason || '(без причины)'}
                  </Text>
                ))}
              </Stack>
              <Button size="sm" backgroundColor="#334d00" color="white" onClick={() => dismiss(u.id)}>
                Сбросить жалобы
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}
