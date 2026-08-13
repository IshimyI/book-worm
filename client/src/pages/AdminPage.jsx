/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, Stack, Flex, Button, Badge, useToast, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, Checkbox } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import PageCard from '../ui/PageCard';
import AnalyticsSummary from '../ui/AnalyticsSummary';
import SecurityEventLog from '../ui/SecurityEventLog';
import StatsSummary from '../ui/StatsSummary';
import PendingBooks from '../ui/PendingBooks';

export default function AdminPage({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/admin/reported-reviews')
      .then((res) => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user]);

  const dismiss = async (id) => {
    try {
      await axiosInstance.post(`/admin/reviews/${id}/dismiss`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      toast({ title: 'Жалобы сброшены, рецензия восстановлена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сбросить жалобы', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Удалить эту рецензию окончательно?')) return;
    try {
      await axiosInstance.delete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      toast({ title: 'Рецензия удалена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить рецензию', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === reviews.length ? [] : reviews.map((r) => r.id)));
  };

  const bulkDismiss = async () => {
    setBulkBusy(true);
    try {
      await axiosInstance.post('/admin/reviews/bulk-dismiss', { ids: selectedIds });
      setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      toast({ title: `Жалобы сброшены у ${selectedIds.length} рецензий`, status: 'success', duration: 2000, isClosable: true });
      setSelectedIds([]);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сбросить жалобы', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkRemove = async () => {
    if (!window.confirm(`Удалить ${selectedIds.length} рецензий окончательно?`)) return;
    setBulkBusy(true);
    try {
      await axiosInstance.post('/admin/reviews/bulk-delete', { ids: selectedIds });
      setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      toast({ title: `Удалено рецензий: ${selectedIds.length}`, status: 'success', duration: 2000, isClosable: true });
      setSelectedIds([]);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить рецензии', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBulkBusy(false);
    }
  };

  if (!user) {
    return (
      <Center py="100px">
        <Text>Войдите, чтобы открыть эту страницу.</Text>
      </Center>
    );
  }

  if (!user.isAdmin) {
    return (
      <Center py="100px">
        <Text>Доступ только для администраторов.</Text>
      </Center>
    );
  }

  return (
    <PageCard maxW="900px">
      <Heading as="h1" size="lg" mb="20px">Администрирование</Heading>

      <Tabs colorScheme="green">
        <TabList>
          <Tab>Жалобы {reviews.length > 0 && `(${reviews.length})`}</Tab>
          <Tab>На модерации {pendingCount > 0 && `(${pendingCount})`}</Tab>
          <Tab>Статистика</Tab>
          <Tab>Аналитика</Tab>
          <Tab>Журнал безопасности</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            {loading ? (
              <Center py="60px"><Spinner size="xl" /></Center>
            ) : reviews.length === 0 ? (
              <Text color="bw.textMuted" textAlign="center" py="40px">Жалоб нет — всё чисто.</Text>
            ) : (
              <Stack spacing={4}>
                <Flex justify="space-between" align="center" wrap="wrap" gap="10px">
                  <Checkbox
                    isChecked={selectedIds.length === reviews.length}
                    isIndeterminate={selectedIds.length > 0 && selectedIds.length < reviews.length}
                    onChange={toggleSelectAll}
                  >
                    Выбрать все
                  </Checkbox>
                  {selectedIds.length > 0 && (
                    <Flex gap="10px">
                      <Button size="sm" backgroundColor="#334d00" color="white" isLoading={bulkBusy} onClick={bulkDismiss}>
                        Сбросить жалобы ({selectedIds.length})
                      </Button>
                      <Button size="sm" variant="outline" colorScheme="red" isLoading={bulkBusy} onClick={bulkRemove}>
                        Удалить выбранные ({selectedIds.length})
                      </Button>
                    </Flex>
                  )}
                </Flex>
                {reviews.map((review) => (
                  <Box key={review.id} p="4" border="1px solid" borderColor="bw.border" borderRadius="md">
                    <Flex justify="space-between" align="flex-start" mb="2" flexWrap="wrap" gap="8px">
                      <Flex gap="10px" align="flex-start">
                        <Checkbox
                          mt="4px"
                          aria-label={`Выбрать рецензию на ${review.book.title}`}
                          isChecked={selectedIds.includes(review.id)}
                          onChange={() => toggleSelected(review.id)}
                        />
                        <Box>
                          <NavLink to={`/books/${review.book.id}`}>
                            <Text fontWeight="bold" _hover={{ textDecoration: 'underline' }}>{review.book.title}</Text>
                          </NavLink>
                          <Text fontSize="sm" color="bw.textMuted">
                            Автор:{' '}
                            <NavLink to={`/users/${review.author.id}`} style={{ textDecoration: 'underline' }}>
                              {review.author.name}
                            </NavLink>{' '}
                            ({review.author.email})
                          </Text>
                        </Box>
                      </Flex>
                      <Badge colorScheme="red" fontSize="0.9em">{review.reportCount} жалоб</Badge>
                    </Flex>
                    <Text mb="3">{review.body}</Text>
                    <Text fontSize="sm" color="bw.textMuted" mb="3">Оценка: {review.rating} ⭐</Text>
                    <Flex gap="10px">
                      <Button size="sm" backgroundColor="#334d00" color="white" onClick={() => dismiss(review.id)}>
                        Сбросить жалобы
                      </Button>
                      <Button size="sm" variant="outline" colorScheme="red" onClick={() => remove(review.id)}>
                        Удалить рецензию
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            )}
          </TabPanel>
          <TabPanel px={0}>
            <PendingBooks onCountChange={setPendingCount} />
          </TabPanel>
          <TabPanel px={0}>
            <StatsSummary />
          </TabPanel>
          <TabPanel px={0}>
            <AnalyticsSummary />
          </TabPanel>
          <TabPanel px={0}>
            <SecurityEventLog />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </PageCard>
  );
}
