/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, Stack, Flex, Button, Badge, useToast, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import PageCard from '../ui/PageCard';
import AnalyticsSummary from '../ui/AnalyticsSummary';
import SecurityEventLog from '../ui/SecurityEventLog';

export default function AdminPage({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
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
      toast({ title: 'Рецензия удалена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить рецензию', status: 'error', duration: 2500, isClosable: true });
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
                {reviews.map((review) => (
                  <Box key={review.id} p="4" border="1px solid" borderColor="bw.border" borderRadius="md">
                    <Flex justify="space-between" align="flex-start" mb="2" flexWrap="wrap" gap="8px">
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
