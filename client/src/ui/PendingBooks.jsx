/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Text, Stack, Flex, Button, Center, Spinner, Image, useToast } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { coverUrl } from '../utils/coverUrl';
import useConfirm from './useConfirm';

export default function PendingBooks({ onCountChange }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/admin/pending-books')
      .then((res) => {
        setBooks(res.data);
        onCountChange?.(res.data.length);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id) => {
    try {
      await axiosInstance.post(`/admin/books/${id}/approve`);
      setBooks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        onCountChange?.(next.length);
        return next;
      });
      toast({ title: 'Книга одобрена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось одобрить книгу', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const reject = async (id) => {
    if (!(await confirm('Отклонить и удалить эту книгу вместе с рецензией?', { confirmLabel: 'Отклонить' }))) return;
    try {
      await axiosInstance.delete(`/admin/books/${id}`);
      setBooks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        onCountChange?.(next.length);
        return next;
      });
      toast({ title: 'Книга отклонена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отклонить книгу', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (loading) {
    return <Center py="60px"><Spinner size="xl" /></Center>;
  }
  if (books.length === 0) {
    return (
      <>
        <Text color="bw.textMuted" textAlign="center" py="40px">Книг на модерации нет.</Text>
        {ConfirmDialog}
      </>
    );
  }

  return (
    <>
    <Stack spacing={4}>
      {books.map((book) => (
        <Box key={book.id} p="4" border="1px solid" borderColor="bw.border" borderRadius="md">
          <Flex gap="16px" flexWrap="wrap">
            <Image src={coverUrl(book.img)} alt="" loading="lazy" boxSize="80px" objectFit="cover" borderRadius="md" fallbackSrc="https://cdn1.ozone.ru/s3/multimedia-x/6597669093.jpg" />
            <Box flex="1" minW="200px">
              <NavLink to={`/books/${book.id}`}>
                <Text fontWeight="bold" _hover={{ textDecoration: 'underline' }}>{book.title}</Text>
              </NavLink>
              <Text fontSize="sm" color="bw.textMuted">{book.author}{book.year ? `, ${book.year}` : ''}{book.genre ? ` · ${book.genre}` : ''}</Text>
              {book.submittedBy && (
                <Text fontSize="sm" color="bw.textMuted">
                  Добавил:{' '}
                  <NavLink to={`/users/${book.submittedBy.id}`} style={{ textDecoration: 'underline' }}>
                    {book.submittedBy.name}
                  </NavLink>{' '}
                  ({book.submittedBy.email})
                </Text>
              )}
            </Box>
            <Flex gap="10px" align="flex-start">
              <Button size="sm" bg="bw.accentSolid" color="bw.accentSolidText" onClick={() => approve(book.id)}>
                Одобрить
              </Button>
              <Button size="sm" variant="outline" colorScheme="red" onClick={() => reject(book.id)}>
                Отклонить
              </Button>
            </Flex>
          </Flex>
        </Box>
      ))}
    </Stack>
    {ConfirmDialog}
    </>
  );
}
